// Story: يبني فيديو كامل من حلقة (story.json + timeline.json + mouth.json): ديكور، عدة شخصيات، كاميرا، ترجمة، عنوان، موسيقى.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../engine/Stage";
import type { CamKeys, V3 } from "../engine/Stage";
import { SETS } from "../sets";
import { Figure3D } from "../demo3d/Figure3D";
import type { Anim, Emotion } from "../demo3d/Figure3D";
import { EPISODES } from "./registry";
import type { CharCfg, EpisodeData, Seg } from "./types";

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const FONT = '"Noto Naskh Arabic","Noto Sans Arabic","Cairo","Tahoma","Segoe UI",sans-serif';

type Lay = { id: string; index: number; c: CharCfg; pos: V3; rotY: number };
const layout = (ep: EpisodeData): Lay[] => {
  const ids = Object.keys(ep.story.characters); const n = ids.length;
  return ids.map((id, index) => {
    const c = ep.story.characters[id];
    const pos: V3 = c.pos ?? [(index - (n - 1) / 2) * 2.3 - (n === 1 ? 0.2 : 0), 0, -1.5];
    const rotY = c.rotY ?? (n > 1 ? -pos[0] * 0.14 : 0);
    return { id, index, c, pos, rotY };
  });
};

// ---- لقطات الكاميرا: wide / two / medium / close / low / orbit ----
const shotCam = (kind: string, tgt: V3, all: V3[]): { cam: CamKeys; focus: number } => {
  const tx = tgt[0]; const cx = all.reduce((a, p) => a + p[0], 0) / all.length;
  switch (kind) {
    case "wide": return { focus: 7, cam: { from: [cx - 0.4, 1.8, 5.8], to: [cx + 0.2, 1.7, 4.9], lookFrom: [cx, 1.1, -1.5], fov: 50 } };
    case "two": return { focus: 5, cam: { from: [cx, 1.5, 4.0], to: [cx, 1.5, 3.4], lookFrom: [cx, 1.2, -1.5], fov: 46 } };
    case "close": return { focus: 2, cam: { from: [tx - 0.5, 1.58, 0.7], to: [tx - 0.3, 1.55, 0.3], lookFrom: [tx, 1.5, -1.5], fov: 38 } };
    case "low": return { focus: 3, cam: { from: [tx, 0.6, 2.8], to: [tx, 0.9, 2.4], lookFrom: [tx, 1.4, -1.5], fov: 50 } };
    case "orbit": return { focus: 3, cam: { from: [tx - 1.8, 1.5, 1.4], to: [tx + 1.8, 1.5, 1.4], lookFrom: [tx, 1.2, -1.5], fov: 44 } };
    default: return { focus: 3.8, cam: { from: [tx + 0.5, 1.5, 2.7], to: [tx, 1.5, 2.2], lookFrom: [tx, 1.1, -1.5], fov: 46 } };
  }
};

const Actor: React.FC<{ a: Lay; ep: EpisodeData; seg: Seg }> = ({ a, ep, seg }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const f = frame + seg.from; const t = f / fps;
  const isLine = seg.kind === "line"; const speaker = isLine && seg.who === a.id;
  const react = seg.react?.[a.id];
  let anim = isLine ? (speaker ? seg.anim : react?.anim ?? "idle") : seg.anim;
  const emotion = isLine ? (speaker ? seg.emotion : react?.emotion ?? "neutral") : seg.emotion;
  const v = ep.mouth.v;
  const mouth = speaker ? v[Math.min(v.length - 1, Math.max(0, f))] ?? 0 : 0;
  let x = a.pos[0]; let rotY = a.rotY;
  if (seg.kind === "intro" && ep.story.entrance !== false) {       // دخول مشياً ثم تلويح
    const walkEnd = 55; const fr = frame - a.index * 10;
    const k = Math.max(0, Math.min(1, fr / walkEnd));
    x = a.pos[0] - 6 * (1 - k * (2 - k));
    rotY = a.rotY + (Math.PI / 2) * (1 - ease((fr - (walkEnd - 18)) / 20));
    anim = fr < walkEnd ? "walk" : "wave";
  }
  return <Figure3D spec={a.c.spec} t={t} anim={anim as Anim} emotion={emotion as Emotion} mouth={mouth} pos={[x, a.pos[1], a.pos[2]]} rotY={rotY} scale={a.c.scale ?? 0.85} walkRate={6.6} seed={a.index * 1.7} />;
};

export const Scene: React.FC<{ ep: EpisodeData; seg: Seg }> = ({ ep, seg }) => {
  const L = layout(ep);
  const set = SETS[ep.story.set] ?? SETS.office; const SetComp = set.Comp;
  const tgt = (L.find((a) => a.id === seg.who) ?? L[0]).pos;
  const { cam, focus } = shotCam(seg.shot, tgt, L.map((a) => a.pos));
  return (
    <Stage look={set.look()} cam={cam} dur={seg.dur} focus={focus}>
      <SetComp>{L.map((a) => <Actor key={a.id} a={a} ep={ep} seg={seg} />)}</SetComp>
    </Stage>
  );
};

const Overlay: React.FC<{ ep: EpisodeData; seg: Seg; first: boolean }> = ({ ep, seg, first }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig();
  const wide = width > 1200; const fs = wide ? 46 : 54;
  const st = ep.story;
  const fadeIn = ep.story.transition === "cut" ? 0 : interpolate(frame, [0, first ? 14 : 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const box: React.CSSProperties = { position: "absolute", left: "6%", right: "6%", textAlign: "center", fontFamily: FONT, color: "#fff" };
  let body: React.ReactNode = null;
  if (seg.kind === "intro") {
    const o = interpolate(frame, [12, 26, seg.dur - 18, seg.dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    body = (
      <div style={{ ...box, top: wide ? "14%" : "12%", opacity: o }}>
        <div style={{ fontSize: fs * 1.5, fontWeight: 800, textShadow: "0 4px 18px rgba(0,0,0,.65)", lineHeight: 1.3 }} dir="auto">{st.title}</div>
        {st.subtitle ? <div style={{ fontSize: fs * 0.7, marginTop: 12, opacity: 0.9, textShadow: "0 2px 10px rgba(0,0,0,.6)" }} dir="auto">{st.subtitle}</div> : null}
      </div>
    );
  } else if (seg.kind === "outro") {
    const o = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    body = <div style={{ ...box, top: wide ? "16%" : "14%", opacity: o, fontSize: fs * 1.2, fontWeight: 800, textShadow: "0 4px 18px rgba(0,0,0,.65)" }} dir="auto">{st.outro ?? ""}</div>;
  } else if (st.captions !== false && seg.text) {
    const ch = st.characters[seg.who];
    const o = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
    body = (
      <div style={{ ...box, bottom: wide ? "7%" : "9%", opacity: o }}>
        {Object.keys(st.characters).length > 1 ? <div style={{ display: "inline-block", fontSize: fs * 0.62, fontWeight: 700, padding: "2px 18px", borderRadius: 999, background: ch?.color ?? "#ffd166", color: "#1a1a1a", marginBottom: 10 }} dir="auto">{ch?.name}</div> : null}
        <div style={{ fontSize: fs, fontWeight: 700, lineHeight: 1.45, padding: "14px 26px", borderRadius: 22, background: "rgba(0,0,0,.58)", textShadow: "0 2px 6px rgba(0,0,0,.8)" }} dir="auto">{seg.text}</div>
      </div>
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {body}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeIn }} />
    </AbsoluteFill>
  );
};

export const Story: React.FC<{ ep: string }> = ({ ep: id }) => {
  const ep = EPISODES[id];
  if (!ep) throw new Error("الحلقة غير موجودة في registry: " + id);
  const { durationInFrames } = useVideoConfig();
  const tl = ep.timeline;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {tl.segs.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur} name={s.kind + " " + i}>
          <Scene ep={ep} seg={s} />
          <Overlay ep={ep} seg={s} first={i === 0} />
        </Sequence>
      ))}
      {tl.hasAudio ? <Audio src={staticFile(`episodes/${id}/voice.wav`)} /> : null}
      {tl.hasMusic ? <Audio src={staticFile(`episodes/${id}/music.wav`)} volume={(f) => 0.13 * interpolate(f, [durationInFrames - 45, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} /> : null}
    </AbsoluteFill>
  );
};

// صورة مصغرة 1280x720
export const Thumb: React.FC<{ ep: string }> = ({ ep: id }) => {
  const ep = EPISODES[id];
  const ids = Object.keys(ep.story.characters);
  const seg: Seg = { from: 90, dur: 120, kind: "line", who: ids[0], anim: "talk", emotion: "happy", shot: ids.length > 1 ? "two" : "medium", react: {} };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Scene ep={ep} seg={seg} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,0) 45%)" }} />
      <div style={{ position: "absolute", top: "7%", left: "6%", right: "6%", textAlign: "center", color: "#fff", fontFamily: FONT, fontSize: 84, fontWeight: 900, lineHeight: 1.25, textShadow: "0 6px 24px rgba(0,0,0,.8)" }} dir="auto">{ep.story.title}</div>
    </AbsoluteFill>
  );
};
