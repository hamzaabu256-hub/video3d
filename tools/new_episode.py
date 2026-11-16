#!/usr/bin/env python3
"""python3 tools/new_episode.py <name> [--set office|studio|park|classroom] [--chars 1|2]
ينشئ حلقة جديدة من قالب ويحدّث registry."""
import argparse, json, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser(); ap.add_argument("name"); ap.add_argument("--set", default="office"); ap.add_argument("--chars", type=int, default=1)
a = ap.parse_args()
d = ROOT / "src/story/episodes" / a.name
assert not d.exists(), "الحلقة موجودة"
d.mkdir(parents=True)
A = {"name": "سالم", "voice": "ar-EG-ShakirNeural", "color": "#ffd166", "spec": {"skin": "#f2c9a0", "shirt": "#6a86b8", "pants": "#2e3a56", "hair": "#3a2a22", "glasses": True}}
B = {"name": "ليلى", "voice": "ar-EG-SalmaNeural", "color": "#ff9ecb", "spec": {"skin": "#f2c9a0", "shirt": "#b5486a", "pants": "#2e3a56", "hair": "#4a2a1a", "long": True}}
chars = {"a": A} if a.chars == 1 else {"a": A, "b": B}
lines = [{"who": "a", "text": "اكتب النص هنا.", "anim": "talk", "emotion": "happy", "shot": "medium"}]
if a.chars > 1: lines.append({"who": "b", "text": "وهنا الرد.", "anim": "talk", "emotion": "happy", "shot": "two"})
story = {"title": "عنوان الحلقة", "subtitle": "", "outro": "شكراً للمشاهدة", "set": a.set, "music": "calm", "characters": chars, "lines": lines}
(d / "story.json").write_text(json.dumps(story, ensure_ascii=False, indent=2), encoding="utf-8")
subprocess.run([sys.executable, str(ROOT / "tools/build_story.py"), a.name, "--dry"], check=True)
subprocess.run([sys.executable, str(ROOT / "tools/gen_registry.py")], check=True)
print(f"تم. عدّل {d}/story.json ثم شغّل: python3 tools/build_story.py {a.name}")
