// Story: فيديو كامل من حلقة. خطاف بصري (نص ضخم + وميض)، دعوات تفاعل (CTA)، شعار القناة، شريط تقدم، ترجمة، موسيقى + مؤثرات.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../engine/Stage";
import type { CamKeys, V3 } from "../engine/Stage";
import { SETS } from "../sets";
import { Figure3D } from "../demo3d/Figure3D";
import type { Anim, Emotion } from "../demo3d/Figure3D";
import { EPISODES } from "./registry";
import type { CharCfg, EpisodeData, Seg } from "./types";

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FONT = '"Noto Naskh Arabic","Noto Sans Arabic","Cairo","Tahoma","Segoe UI","Noto Color Emoji",sans-serif';

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
  if (seg.kind === "intro" && ep.story.entrance !== false) {
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
  const frame = useCurrentFrame(); const { width, fps } = useVideoConfig();
  const wide = width > 1200; const fs = wide ? 46 : 54;
  const st = ep.story;
  const noFade = st.transition === "cut" || !!seg.hook;
  const fadeIn = noFade ? 0 : interpolate(frame, [0, first ? 14 : 5], [1, 0], clamp);
  const flash = seg.hook ? interpolate(frame, [0, 6], [0.9, 0], clamp) : 0;
  const box: React.CSSProperties = { position: "absolute", left: "6%", right: "6%", textAlign: "center", fontFamily: FONT, color: "#fff" };
  const nodes: React.ReactNode[] = [];

  if (st.brand) {
    nodes.push(<div key="brand" style={{ position: "absolute", top: wide ? "3%" : "2.5%", right: "4%", fontFamily: FONT, fontWeight: 800, fontSize: fs * 0.5, color: "#111", background: "#ffd166", padding: "4px 18px", borderRadius: 999, boxShadow: "0 2px 10px rgba(0,0,0,.5)" }} dir="auto">{st.brand}</div>);
  }
  if (seg.kind === "intro") {
    const o = interpolate(frame, [12, 26, seg.dur - 18, seg.dur], [0, 1, 1, 0], clamp);
    nodes.push(
      <div key="intro" style={{ ...box, top: wide ? "14%" : "12%", opacity: o }}>
        <div style={{ fontSize: fs * 1.5, fontWeight: 800, textShadow: "0 4px 18px rgba(0,0,0,.65)", lineHeight: 1.3 }} dir="auto">{st.title}</div>
        {st.subtitle ? <div style={{ fontSize: fs * 0.7, marginTop: 12, opacity: 0.9, textShadow: "0 2px 10px rgba(0,0,0,.6)" }} dir="auto">{st.subtitle}</div> : null}
      </div>);
  } else if (seg.kind === "outro") {
    const o = interpolate(frame, [4, 18], [0, 1], clamp);
    const pulse = 1 + 0.04 * Math.sin(frame / 4);
    nodes.push(
      <div key="outro" style={{ ...box, top: wide ? "16%" : "14%", opacity: o, transform: `scale(${pulse})` }}>
        <div style={{ fontSize: fs * 1.2, fontWeight: 900, textShadow: "0 4px 18px rgba(0,0,0,.7)", lineHeight: 1.4 }} dir="auto">{st.outro ?? ""}</div>
        {st.outroSub ? <div style={{ fontSize: fs * 0.6, marginTop: 10, opacity: 0.9, textShadow: "0 2px 8px rgba(0,0,0,.7)" }} dir="auto">{st.outroSub}</div> : null}
      </div>);
  } else {
    if (seg.hook) {
      const pop = spring({ frame, fps, config: { damping: 9, stiffness: 150 } });
      const o = interpolate(frame, [seg.dur - 10, seg.dur], [1, 0], clamp);
      nodes.push(
        <div key="hook" style={{ ...box, top: wide ? "8%" : "9%", opacity: o, transform: `scale(${0.55 + 0.45 * pop})`, fontSize: fs * 1.6, fontWeight: 900, lineHeight: 1.25, color: "#ffe066", WebkitTextStroke: "3px #000", paintOrder: "stroke fill", textShadow: "0 6px 20px rgba(0,0,0,.8)" }} dir="auto">{seg.hook}</div>);
    }
    if (seg.cta) {
      const items = [["🔔 اشترك", "#e11d48"], ["👍 إعجاب", "#2563eb"], ["💬 تعليق", "#16a34a"]];
      nodes.push(
        <div key="cta" style={{ position: "absolute", left: 0, right: 0, top: wide ? "12%" : "13%", display: "flex", justifyContent: "center", gap: 18, fontFamily: FONT, flexWrap: "wrap" }}>
          {items.map(([t, c], i) => {
            const s = spring({ frame: frame - i * 6, fps, config: { damping: 8, stiffness: 160 } });
            const pulse = 1 + 0.06 * Math.sin((frame + i * 5) / 3.5);
            return <div key={i} style={{ transform: `scale(${s * pulse})`, background: c, color: "#fff", fontWeight: 900, fontSize: fs * 0.8, padding: "10px 26px", borderRadius: 999, boxShadow: "0 6px 16px rgba(0,0,0,.5)" }}>{t}</div>;
          })}
        </div>);
    }
    if (st.captions !== false && seg.text) {
      const ch = st.characters[seg.who];
      const o = interpolate(frame, [0, 6], [0, 1], clamp);
      nodes.push(
        <div key="cap" style={{ ...box, bottom: wide ? "7%" : "15%", opacity: o }}>
          {Object.keys(st.characters).length > 1 ? <div style={{ display: "inline-block", fontSize: fs * 0.62, fontWeight: 700, padding: "2px 18px", borderRadius: 999, background: ch?.color ?? "#ffd166", color: "#1a1a1a", marginBottom: 10 }} dir="auto">{ch?.name}</div> : null}
          <div style={{ fontSize: fs, fontWeight: 700, lineHeight: 1.45, padding: "14px 26px", borderRadius: 22, background: "rgba(0,0,0,.6)", textShadow: "0 2px 6px rgba(0,0,0,.8)" }} dir="auto">{seg.text}</div>
        </div>);
    }
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {nodes}
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeIn }} />
    </AbsoluteFill>
  );
};

export const Story: React.FC<{ ep: string }> = ({ ep: id }) => {
  const ep = EPISODES[id];
  if (!ep) throw new Error("الحلقة غير موجودة في registry: " + id);
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const tl = ep.timeline;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {tl.segs.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur} name={s.kind + " " + i}>
          <Scene ep={ep} seg={s} />
          <Overlay ep={ep} seg={s} first={i === 0} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", top: 0, left: 0, height: 6, width: `${(frame / durationInFrames) * 100}%`, background: "#ffd166" }} />
      {tl.hasAudio ? <Audio src={staticFile(`episodes/${id}/voice.wav`)} /> : null}
      {tl.hasMusic ? <Audio src={staticFile(`episodes/${id}/music.wav`)} volume={(f) => 0.13 * interpolate(f, [durationInFrames - 45, durationInFrames], [1, 0], clamp)} /> : null}
      {tl.hasSfx ? <Audio src={staticFile(`episodes/${id}/sfx.wav`)} volume={0.7} /> : null}
    </AbsoluteFill>
  );
};

export const Thumb: React.FC<{ ep: string }> = ({ ep: id }) => {
  const ep = EPISODES[id];
  const ids = Object.keys(ep.story.characters);
  const seg: Seg = { from: 90, dur: 120, kind: "line", who: ids[0], anim: "talk", emotion: "surprised", shot: ids.length > 1 ? "two" : "medium", react: {} };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Scene ep={ep} seg={seg} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,0) 50%)" }} />
      <div style={{ position: "absolute", top: "6%", left: "6%", right: "6%", textAlign: "center", color: "#ffe066", fontFamily: FONT, fontSize: 92, fontWeight: 900, lineHeight: 1.25, WebkitTextStroke: "4px #000", paintOrder: "stroke fill", textShadow: "0 6px 24px rgba(0,0,0,.8)" }} dir="auto">{ep.story.title}</div>
    </AbsoluteFill>
  );
};
