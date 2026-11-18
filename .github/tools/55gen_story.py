#!/usr/bin/env python3
"""يكتب سكربت حلقة (story.json) بواسطة Gemini من موضوع.
متغيرات البيئة: EP (اسم الحلقة) ، TOPIC (الموضوع او auto) ، GEMINI_API_KEY ، MODEL (اختياري)"""
import datetime, json, os, pathlib, re, sys, time, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
EP = os.environ.get("EP", "").strip()
TOPIC = os.environ.get("TOPIC", "").strip()
KEY = os.environ.get("GEMINI_API_KEY", "").strip()
FORCE = os.environ.get("MODEL", "").strip()
BASE = "https://generativelanguage.googleapis.com/v1beta/"

if not re.fullmatch(r"[A-Za-z0-9-]+", EP):
    sys.exit("اسم الحلقة يجب ان يكون حروفا انجليزية او ارقاما او شرطة فقط")
if not KEY:
    sys.exit("GEMINI_API_KEY غير موجود: اضفه في Settings > Secrets and variables > Actions")

AUTO = [
    "لماذا نؤجل المهام المهمة رغم أننا نعرف أن التأجيل يضرنا؟",
    "لماذا نشعر بالوحدة حتى ونحن بين الناس؟",
    "لماذا نتذكر موقفاً محرجاً قديماً وكأنه حدث بالأمس؟",
    "لماذا نقارن أنفسنا بالآخرين على وسائل التواصل؟",
    "لماذا نفتح الهاتف دون سبب ونمرّر الشاشة بلا توقف؟",
    "لماذا نخاف من الفشل حتى قبل أن نبدأ؟",
    "لماذا نعجز عن قول لا رغم أن الموافقة ترهقنا؟",
    "لماذا نبكي أحياناً دون سبب واضح؟",
    "لماذا نشعر بالتعب رغم أننا لم نفعل شيئاً؟",
    "لماذا تزداد الأفكار المزعجة ليلاً قبل النوم؟",
]
if TOPIC.lower() in ("", "auto", "تلقائي"):
    TOPIC = AUTO[datetime.date.today().toordinal() % len(AUTO)]

ANIM = {"idle", "wave", "talk", "point", "shrug", "celebrate", "think", "clap", "dance"}
EMO = {"neutral", "happy", "sad", "surprised", "angry"}
SHOT = {"wide", "two", "medium", "close", "low", "orbit"}

SYSTEM = '''أنت كاتب سكربتات لقناة «أسرار النفس» (علم نفس مبسّط) لفيديو قصير عمودي مدته 50 ثانية بين شخصيتين: سالم (يسأل ويتفاجأ) وليلى (تشرح بهدوء).
اكتب بالعربية الفصحى المبسطة وبجمل قصيرة.
البنية المطلوبة:
1) السطر الأول لسالم: سؤال مثير عن الموضوع ثم يعد بأن الإجابة في آخر الفيديو.
2) الأسطر التالية تمهيد وتشويق من دون كشف الإجابة.
3) tease_index: رقم السطر (يبدأ العد من صفر) الذي تقول فيه ليلى إن الإجابة قريبة.
4) reveal_index: رقم السطر الذي تُكشف فيه الإجابة، ويأتي بعده سطر أو سطران للتفسير والتنبيه.
5) السطر الأخير: تنبيه بسيط عن متى يُستحسن استشارة مختص إن كان الموضوع يمس الصحة النفسية.
لا تكتب دعوات الاشتراك والإعجاب (تُضاف تلقائياً).
قواعد الدقة والأمان: لا تخترع أرقاماً أو نسباً أو دراسات أو أسماء باحثين أو مؤسسات. استخدم معلومات عامة معروفة فقط وعبارات حذرة مثل «غالباً» و«قد». لا تشخّص أحداً ولا تذكر أدوية أو علاجات ولا تشجع على سلوك مؤذٍ.
عدد الأسطر من 9 إلى 12، ومجموع كلمات النصوص من 80 إلى 95 كلمة.
القيم المسموحة: anim: idle, wave, talk, point, shrug, celebrate, think, clap, dance. emotion: neutral, happy, sad, surprised, angry. shot: wide, two, medium, close, low, orbit.
أخرج JSON فقط بهذا الشكل ولا تكتب أي شرح:
{"title":"عنوان قصير مثير مع إيموجي","hook":"سؤال قصير جدا حتى 6 كلمات مع إيموجي","answer_hook":"الجواب: ... حتى 5 كلمات مع إيموجي","comment_question":"سؤال قصير للتعليقات","tease_index":4,"reveal_index":7,"lines":[{"who":"salem","text":"...","anim":"talk","emotion":"surprised","shot":"close"}]}'''

def call(method, path, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method,
                                 headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try: msg = json.loads(e.read().decode("utf-8"))
        except Exception: msg = {}
        return e.code, msg

def pick_models():
    first = [FORCE] if FORCE else []
    st, d = call("GET", "models?pageSize=200")
    if st != 200:
        print("تعذر جلب قائمة النماذج:", st, str(d)[:200])
        # تم تصحيح أسماء النماذج الاحتياطية لتكون متوافقة مع API الحالي
        return first or ["gemini-1.5-flash", "gemini-1.5-flash-latest"]
    c = []
    for m in d.get("models", []):
        n = m.get("name", "").replace("models/", "")
        if "generateContent" not in m.get("supportedGenerationMethods", []) or "flash" not in n:
            continue
        if re.search(r"image|tts|audio|live|embed|robot|computer|vision|thinking|exp|native", n):
            continue
        v = tuple(int(x) for x in re.findall(r"\d+", n)[:2]) or (0,)
        c.append((("preview" not in n, v, "lite" not in n), n))
    c.sort(reverse=True)
    names = first + [n for _, n in c if n not in first]
    return names[:5] or ["gemini-1.5-flash"]

def parse_json(txt):
    # تم تحسين هذه الدالة لمعالجة الأخطاء في حال كان الـ JSON غير مكتمل أو به أخطاء برمجية
    try: 
        return json.loads(txt)
    except Exception:
        m = re.search(r"\{.*\}", txt, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                return None
        return None

def ask(model, feedback):
    prompt = "الموضوع: " + TOPIC + feedback
    body = {"systemInstruction": {"parts": [{"text": SYSTEM}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.8, "responseMimeType": "application/json"}}
    st, d = call("POST", "models/" + model + ":generateContent", body)
    if st != 200: return st, d, None
    try:
        return 200, d, parse_json(d["candidates"][0]["content"]["parts"][0]["text"])
    except Exception:
        return 422, d, None

def words(s): return len(re.findall(r"\S+", s))

def check(js):
    """يرجع (hard, soft): hard = خطأ بنيوي ، soft = عدد الكلمات خارج المدى."""
    if not isinstance(js, dict) or not isinstance(js.get("lines"), list): return "الشكل غير صحيح: يجب كائن فيه lines", ""
    L = js["lines"]
    if not 9 <= len(L) <= 12: return "عدد الاسطر " + str(len(L)) + " والمطلوب بين 9 و12", ""
    for i, l in enumerate(L):
        if not isinstance(l, dict) or not str(l.get("text", "")).strip(): return "السطر " + str(i) + " بلا نص", ""
    for k in ("title", "hook", "comment_question", "answer_hook"):
        if not str(js.get(k, "")).strip(): return "الحقل " + k + " ناقص", ""
    ti, ri = js.get("tease_index"), js.get("reveal_index")
    if not (isinstance(ti, int) and isinstance(ri, int) and 1 <= ti < ri < len(L)):
        return "tease_index و reveal_index يجب ان يكونا اعدادا صحيحة بحيث 1 <= tease_index < reveal_index < عدد الاسطر", ""
    w = sum(words(str(l["text"])) for l in L)
    # تم توحيد شرط عدد الكلمات ليتطابق مع التعليمات (80 إلى 95)
    if not 80 <= w <= 95: return "", "عدد كلمات الحوار " + str(w) + " والمطلوب بين 80 و95"
    return "", ""

print("الموضوع:", TOPIC)
models = pick_models()
print("النماذج المرشحة:", models)
data = soft_ok = None; used = ""; fb = ""
for model in models:
    for attempt in range(3):
        st, d, js = ask(model, fb)
        if st == 200 and js is not None:
            hard, soft = check(js)
            if not hard and not soft: data, used = js, model; break
            if not hard: soft_ok, used = js, model
            msg = hard or soft
            fb = "\nتصحيح مطلوب بعد المحاولة السابقة: " + msg
            print(model, "محاولة", attempt + 1, "مرفوضة:", msg)
            continue
        if st in (429, 503):
            print(model, st, "ضغط او حد استخدام: انتظار 20 ثانية"); time.sleep(20); continue
        if st == 403:
            sys.exit("403 رفض الوصول: " + str(d)[:300] + "\nتأكد من تفعيل التحقق بخطوتين ورقم الهاتف لحساب Google ثم انشئ مفتاحا جديدا من AI Studio.")
        print(model, st, str(d)[:200]); break
    if data: break
if not data and soft_ok:
    data = soft_ok; print("تنبيه: عدد الكلمات خارج المدى المثالي لكن البنية سليمة")
if not data:
    sys.exit("فشل توليد السكربت: جرب نموذجا اخر في خانة gemini_model او اعد التشغيل لاحقا")

L = []
for i, l in enumerate(data["lines"]):
    who = l.get("who") if l.get("who") in ("salem", "layla") else ("salem" if i % 2 == 0 else "layla")
    L.append({"who": "salem" if i == 0 else who, "text": str(l["text"]).strip(),
              "anim": l.get("anim") if l.get("anim") in ANIM else "talk",
              "emotion": l.get("emotion") if l.get("emotion") in EMO else "neutral",
              "shot": l.get("shot") if l.get("shot") in SHOT else "medium"})
L[0].update({"hook": str(data["hook"]).strip()[:60], "shot": "close", "emotion": "surprised", "anim": "point"})
L[data["tease_index"]]["hook"] = "الإجابة بعد لحظات ⏳"
L[data["reveal_index"]]["hook"] = str(data["answer_hook"]).strip()[:60]
L[data["reveal_index"]]["shot"] = "close"
L += [
    {"who": "salem", "cta": True, "text": "إن أعجبك الفيديو، فاضغط إعجاب، واشترك في أسرار النفس، وفعّل الجرس!", "anim": "celebrate", "emotion": "happy", "shot": "two"},
    {"who": "layla", "cta": True, "text": "واكتب في التعليقات: " + str(data["comment_question"]).strip() + " وأرسله لصديق!", "anim": "clap", "emotion": "happy", "shot": "two",
     "react": {"salem": {"anim": "wave", "emotion": "happy"}}},
]

h = sum(ord(c) for c in EP)
sal = [{"skin": "#e6b98f", "shirt": "#c0392b", "pants": "#222a3a", "hair": "#2b1d17", "hat": "#1f2937"},
       {"skin": "#e6b98f", "shirt": "#2f6f73", "pants": "#222a3a", "hair": "#2b1d17", "beard": True},
       {"skin": "#e6b98f", "shirt": "#e07a2f", "pants": "#2b3245", "hair": "#2b1d17", "glasses": True}][h % 3]
lay = [{"skin": "#f2c9a0", "shirt": "#0f766e", "pants": "#2e3a56", "hair": "#1f1612", "long": True, "glasses": True},
       {"skin": "#f2c9a0", "shirt": "#b5486a", "pants": "#2e3a56", "hair": "#4a2a1a", "long": True},
       {"skin": "#f2c9a0", "shirt": "#7a5bb5", "pants": "#2e3a56", "hair": "#4a2a1a", "long": True}][h % 3]
story = {
    "title": str(data["title"]).strip()[:70], "subtitle": "أسرار النفس", "brand": "أسرار النفس",
    "outro": "اشترك في أسرار النفس 🔔", "outroSub": "محتوى توعوي ولا يغني عن استشارة مختص",
    "set": ["studio", "office", "classroom"][h % 3], "music": "mystery", "sfx": True, "introFrames": 0, "outroFrames": 60,
    "characters": {
        "salem": {"name": "سالم", "voice": "ar-EG-ShakirNeural", "gttsPitch": 0.94, "color": "#ffd166", "spec": sal},
        "layla": {"name": "ليلى", "voice": "ar-EG-SalmaNeural", "gttsPitch": 1.16, "color": "#7dd3fc", "spec": lay},
    },
    "lines": L,
}
ED = ROOT / "src/story/episodes" / EP
ED.mkdir(parents=True, exist_ok=True)
(ED / "story.json").write_text(json.dumps(story, ensure_ascii=False, indent=2), encoding="utf-8")
total = sum(words(x["text"]) for x in L)
print("تم:", EP, "| النموذج:", used, "| الاسطر:", len(L), "| الكلمات:", total, "| المدة التقريبية:", round(total / 2.4 + len(L) * 0.33 + 2), "ثانية")

summ = os.environ.get("GITHUB_STEP_SUMMARY")
if summ:
    with open(summ, "a", encoding="utf-8") as f:
        f.write("### " + story["title"] + "\n\nالموضوع: " + TOPIC + "\n\n")
        for x in L: f.write("- **" + ("سالم" if x["who"] == "salem" else "ليلى") + ":** " + x["text"] + "\n")
        f.write("\n> راجع المعلومات قبل النشر: السكربت كتبه نموذج ذكاء اصطناعي.\n")
