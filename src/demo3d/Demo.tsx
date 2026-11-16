// Demo3D: a 9-second test of the fully 3D character (walk in, wave, talk with lip-sync, close-up with expressions).
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../engine/Stage";
import type { CamKeys } from "../engine/Stage";
import { Office, officeLook } from "../ep2/sets";
import { Figure3D } from "./Figure3D";
import type { Anim, Emotion } from "./Figure3D";
import mouthData from "./mouth.json";

const SPEC = { skin: "#f2c9a0", shirt: "#6a86b8", pants: "#2e3a56", hair: "#3a2a22", glasses: true, tie: "#c0392b" };
const SPOT: [number, number, number] = [-1.2, 0, -1.5];
const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));

export const TOTAL = 306; // walk 0-84, the voice starts at frame 84 (7.4 s of speech)
const VOICE_AT = 84;
const SHOTS: { from: number; dur: number; cam: CamKeys; focus: number }[] = [
  { from: 0, dur: 100, focus: 7, cam: { from: [-1.5, 1.8, 5.8], to: [-0.8, 1.7, 4.6], lookFrom: [-2.8, 1.2, -1.5], lookTo: [-1.5, 1.2, -1.5], fov: 50 } },
  { from: 100, dur: 110, focus: 3.8, cam: { from: [0.1, 1.5, 2.6], to: [-0.5, 1.5, 2.1], lookFrom: [-1.2, 1.1, -1.5], fov: 46 } },
  { from: 210, dur: 96, focus: 2.0, cam: { from: [-0.9, 1.58, 0.6], to: [-1.1, 1.55, 0.15], lookFrom: [-1.2, 1.5, -1.5], fov: 38 } },
];

const Hero: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const f = frame + offset; const t = f / fps;
  const walkK = Math.min(1, f / 84);                       // 0..1 along the path
  const x = -5.2 + (SPOT[0] + 5.2) * (walkK * (2 - walkK)); // eased arrival
  const turnK = ease((f - 70) / 26);
  const rotY = (Math.PI / 2) * (1 - turnK);
  const anim: Anim = f < 84 ? "walk" : f < 128 ? "wave" : f < 228 ? "talk" : "shrug";
  const mouth = f < VOICE_AT ? 0 : (mouthData.v[Math.min(mouthData.v.length - 1, Math.max(0, f - VOICE_AT))] ?? 0);
  const emotion: Emotion = f < 128 ? "happy" : f < 168 ? "neutral" : f < 210 ? "surprised" : "happy";
  return <Figure3D spec={SPEC} t={t} anim={anim} mouth={mouth} emotion={emotion} pos={[x, 0, SPOT[2]]} rotY={rotY} walkRate={6.6} />;
};

export const Demo3D: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {SHOTS.map((s, i) => (
      <Sequence key={i} from={s.from} durationInFrames={s.dur} name={"shot " + (i + 1)}>
        <Stage look={officeLook()} cam={s.cam} dur={s.dur} focus={s.focus}>
          <Office screens={["chat", "chat", "chat"]}><Hero offset={s.from} /></Office>
        </Stage>
      </Sequence>
    ))}
    <Sequence from={VOICE_AT}><Audio src={staticFile("demo3d/voice.wav")} /></Sequence>
  </AbsoluteFill>
);
