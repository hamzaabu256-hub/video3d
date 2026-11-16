#!/usr/bin/env python3
"""python3 tools/build_story.py <episode> [--dry]
story.json -> صوت لكل شخصية (edge-tts) + مزامنة شفاه + موسيقى خلفية + timeline.json
--dry : بدون صوت (تقدير زمن + فم وهمي) لمعاينة سريعة بدون إنترنت."""
import argparse, asyncio, json, math, pathlib, subprocess, wave

ROOT = pathlib.Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser(); ap.add_argument("episode"); ap.add_argument("--dry", action="store_true")
args = ap.parse_args()
ED = ROOT / "src/story/episodes" / args.episode
PUB = ROOT / "public/episodes" / args.episode
cfg = json.loads((ED / "story.json").read_text(encoding="utf-8"))
chars = cfg["characters"]; ids = list(chars); n = len(ids)

FPS, SR = 30, 24000
SPF = SR // FPS
GAP, OUTRO = 10, 45
INTRO = 77 + (n - 1) * 10
DEFAULT_VOICE = "ar-EG-ShakirNeural"

def write_wav(path, arr):
    import numpy as np
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(arr, -1, 1) * 32767).astype(np.int16).tobytes())

def synth_music(seconds, mood):
    import numpy as np
    bpm = 118 if mood == "upbeat" else 72
    beat = 60 / bpm; bar = 4 * beat
    prog = ([[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]] if mood == "upbeat"
            else [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [261.63, 329.63, 392.0], [196.0, 246.94, 293.66]])
    total = int(seconds * SR); out = np.zeros(total, np.float64)
    for b in range(int(seconds / bar) + 1):
        ch = prog[b % 4]; s0 = int(b * bar * SR)
        if s0 >= total: break
        e = min(total, s0 + int(bar * SR)); tt = np.arange(e - s0) / SR
        env = np.clip(np.minimum(tt / 0.4, (bar - tt) / 0.5), 0, 1)
        pad = sum(np.sin(2 * np.pi * (f / 2) * tt) + 0.5 * np.sin(2 * np.pi * f * tt) for f in ch)
        out[s0:e] += 0.10 * env * pad / len(ch)
        for k in range(8):
            ns = s0 + int(k * (beat / 2) * SR)
            if ns >= total: break
            ne = min(total, ns + int(0.45 * SR)); tn = np.arange(ne - ns) / SR
            out[ns:ne] += 0.09 * np.sin(2 * np.pi * ch[[0, 1, 2, 1][k % 4]] * 2 * tn) * np.exp(-tn * 6)
    return (out / max(1e-6, np.abs(out).max()) * 0.8).astype(np.float32)

segs = [{"from": 0, "dur": INTRO, "kind": "intro", "who": ids[0], "anim": "wave", "emotion": "happy", "shot": "wide"}]
cur = INTRO
audio_chunks, mouth = [], [0.0] * INTRO

if args.dry:
    for ln in cfg["lines"]:
        speak = max(45, int(len(ln["text"]) / 13 * FPS)); dur = speak + GAP
        segs.append({"from": cur, "dur": dur, "kind": "line", "who": ln.get("who", ids[0]), "anim": ln.get("anim", "talk"),
                     "emotion": ln.get("emotion", "neutral"), "shot": ln.get("shot", "medium"), "text": ln["text"], "react": ln.get("react", {})})
        mouth += [round(0.5 + 0.5 * math.sin(k * 1.1), 3) * 0.9 if k % 9 < 7 else 0.0 for k in range(speak)] + [0.0] * GAP
        cur += dur
else:
    import numpy as np, edge_tts
    tmp = ROOT / "out" / "tmp" / args.episode; tmp.mkdir(parents=True, exist_ok=True)
    audio_chunks.append(np.zeros(INTRO * SPF, np.float32))
    async def tts(text, voice, rate, pitch, path):
        kw = {}
        if rate not in (None, "", "+0%"): kw["rate"] = rate
        if pitch not in (None, "", "+0Hz"): kw["pitch"] = pitch
        try:
            await edge_tts.Communicate(text, voice, **kw).save(str(path))
        except Exception as e:
            print("edge-tts failed -> gTTS fallback:", type(e).__name__)
            from gtts import gTTS
            gTTS(text, lang="ar" if voice.startswith("ar") else "en").save(str(path))
    def pcm(path):
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True)
        return np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768
    for i, ln in enumerate(cfg["lines"]):
        who = ln.get("who", ids[0]); c = chars[who]
        mp3 = tmp / f"line{i}.mp3"
        asyncio.run(tts(ln["text"], c.get("voice", DEFAULT_VOICE), c.get("rate", "+0%"), c.get("pitch", "+0Hz"), mp3))
        a = pcm(mp3); frames = math.ceil(len(a) / SPF) + GAP
        a = np.pad(a, (0, frames * SPF - len(a))); audio_chunks.append(a)
        segs.append({"from": cur, "dur": frames, "kind": "line", "who": who, "anim": ln.get("anim", "talk"),
                     "emotion": ln.get("emotion", "neutral"), "shot": ln.get("shot", "medium"), "text": ln["text"], "react": ln.get("react", {})})
        r = np.sqrt((a.reshape(frames, SPF) ** 2).mean(axis=1)); mouth_part = r
        ref = np.percentile(r[r > 0.005], 90) if (r > 0.005).any() else 1.0
        v = np.clip(r / ref, 0, 1); v[r < 0.005] = 0
        for k in range(1, len(v)): v[k] = 0.6 * v[k] + 0.4 * v[k - 1]
        mouth += [round(float(x), 3) for x in v]
        cur += frames

segs.append({"from": cur, "dur": OUTRO, "kind": "outro", "who": ids[0], "anim": cfg.get("outroAnim", "wave"), "emotion": "happy", "shot": "wide"})
cur += OUTRO; mouth += [0.0] * OUTRO

has_audio = has_music = False
if not args.dry:
    audio_chunks.append(np.zeros(OUTRO * SPF, np.float32))
    write_wav(PUB / "voice.wav", np.concatenate(audio_chunks)); has_audio = True
    if cfg.get("music"):
        write_wav(PUB / "music.wav", synth_music(cur / FPS + 1, cfg["music"])); has_music = True

(ED / "mouth.json").write_text(json.dumps({"fps": FPS, "v": mouth[:cur]}))
(ED / "timeline.json").write_text(json.dumps({"fps": FPS, "total": cur, "hasAudio": has_audio, "hasMusic": has_music, "segs": segs}, ensure_ascii=False))
print(f"[{args.episode}] {'DRY ' if args.dry else ''}OK: {cur} frames = {cur / FPS:.1f}s, {len(cfg['lines'])} lines, {n} characters")
