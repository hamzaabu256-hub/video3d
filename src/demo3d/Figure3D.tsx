// A fully 3D, procedurally built character (no external assets): capsule limbs on a jointed rig, a big round head with
// blinking eyes, brows and a mouth that follows the voice. Everything is a function of time t, so any frame renders alone.
// The engine's edge pass draws ink lines around it automatically (it lives in the normal world layer).
import React from "react";
import type { V3 } from "../engine/Stage";

export type Anim = "idle" | "walk" | "wave" | "talk" | "point" | "shrug" | "celebrate" | "think" | "clap" | "dance";
export type Emotion = "neutral" | "happy" | "sad" | "surprised" | "angry";
export type FigureSpec = { skin: string; shirt: string; pants: string; shoes?: string; hair: string; glasses?: boolean; tie?: string; long?: boolean; beard?: boolean; hat?: string };

const Mat: React.FC<{ color: string; rough?: number }> = ({ color, rough = 0.7 }) => <meshStandardMaterial color={color} roughness={rough} metalness={0} />;
const Ball: React.FC<{ r: number; color: string; pos?: V3; scale?: V3 }> = ({ r, color, pos = [0, 0, 0], scale = [1, 1, 1] }) => (
  <mesh position={pos} scale={scale} castShadow receiveShadow><sphereGeometry args={[r, 24, 16]} /><Mat color={color} /></mesh>
);
// a capsule hanging down from its joint (the joint is the group's origin)
const Limb: React.FC<{ r: number; len: number; color: string }> = ({ r, len, color }) => (
  <mesh position={[0, -len / 2, 0]} castShadow receiveShadow><capsuleGeometry args={[r, Math.max(0.01, len - 2 * r), 6, 14]} /><Mat color={color} /></mesh>
);

export const Figure3D: React.FC<{
  spec: FigureSpec; t: number; anim?: Anim; mouth?: number; emotion?: Emotion;
  pos?: V3; rotY?: number; scale?: number; walkRate?: number; seed?: number;
}> = ({ spec, t, anim = "idle", mouth = 0, emotion = "neutral", pos = [0, 0, 0], rotY = 0, scale = 0.85, walkRate = 6.2, seed = 0 }) => {
  const ph = t * walkRate, s = Math.sin(ph);
  const walking = anim === "walk";
  // ---- body pose -------------------------------------------------------------------------------------------------------
  let hipsY = 0.84 + (walking ? 0.035 * Math.abs(s) : 0.006 * Math.sin(t * 2.3 + seed));
  let legL = 0, legR = 0, kneeL = 0.02, kneeR = 0.02;
  if (walking) {
    legL = s * 0.6; legR = -s * 0.6;
    kneeL = 0.1 + Math.max(0, -Math.sin(ph + 1.1)) * 0.85; kneeR = 0.1 + Math.max(0, Math.sin(ph + 1.1)) * 0.85;
  }
  // arms: x = swing (negative = forward), z = out to the side (the +X arm is the viewer's right when the figure faces the camera)
  let aL = { x: 0, z: 0.12 }, aR = { x: 0, z: -0.12 }, fL = { x: -0.15, z: 0 }, fR = { x: -0.15, z: 0 };
  const g = mouth; const beat = Math.sin(t * 7 + seed);
  if (walking) { aL = { x: -legL * 0.9, z: 0.1 }; aR = { x: -legR * 0.9, z: -0.1 }; fL = { x: -0.35 - Math.max(0, -aL.x) * 0.5, z: 0 }; fR = { x: -0.35 - Math.max(0, -aR.x) * 0.5, z: 0 }; }
  if (anim === "wave") { aL = { x: 0, z: 2.5 + 0.08 * Math.sin(t * 3) }; fL = { x: 0, z: 0.55 * Math.sin(t * 10) }; }
  if (anim === "talk") {
    aL = { x: -0.55 - 0.35 * g * beat, z: 0.25 + 0.25 * g }; aR = { x: -0.45 + 0.3 * g * Math.sin(t * 6 + 1), z: -0.25 - 0.2 * g };
    fL = { x: -0.95 - 0.3 * g, z: 0 }; fR = { x: -0.8, z: 0 };
  }
  if (anim === "point") { aL = { x: -1.45, z: 0.1 }; fL = { x: -0.05, z: 0 }; }
  if (anim === "shrug") { aL = { x: -0.2, z: 0.55 }; aR = { x: -0.2, z: -0.55 }; fL = { x: -0.9, z: 0 }; fR = { x: -0.9, z: 0 }; }
  if (anim === "celebrate") { const j = Math.abs(Math.sin(t * 6)); hipsY += j * 0.22; aL = { x: 0, z: 2.6 + 0.2 * Math.sin(t * 12) }; aR = { x: 0, z: -2.6 - 0.2 * Math.sin(t * 12 + 1) }; legL = legR = -0.15 * j; kneeL = kneeR = 0.2 * j; }
  if (anim === "think") { aL = { x: -0.7, z: -0.3 }; fL = { x: -2.2, z: 0 }; aR = { x: -0.5, z: -0.2 }; fR = { x: -1.3, z: 0 }; }
  if (anim === "clap") { const c = 0.1 + 0.1 * Math.sin(t * 14); aL = { x: -1.0, z: -c }; aR = { x: -1.0, z: c }; fL = { x: -0.8, z: 0 }; fR = { x: -0.8, z: 0 }; }
  if (anim === "dance") { const j = Math.abs(Math.sin(t * 5)); hipsY += j * 0.08; aL = { x: -0.4, z: 1.4 + 0.5 * Math.sin(t * 5) }; aR = { x: -0.4, z: -1.4 - 0.5 * Math.sin(t * 5 + Math.PI) }; legL = 0.25 * Math.sin(t * 5); legR = -0.25 * Math.sin(t * 5); }
  // ---- head + face ---------------------------------------------------------------------------------------------------------
  const nod = (anim === "talk" || g > 0.05 ? 0.05 * g * Math.sin(t * 9) : 0) + (emotion === "sad" ? 0.22 : emotion === "surprised" ? -0.08 : 0);
  const turn = 0.07 * Math.sin(t * 0.8 + seed);
  const cyc = (t + seed * 1.3) % 3.4; const bl = cyc < 0.13 ? Math.abs(cyc - 0.065) / 0.065 : 1;
  const eyeY = (0.2 + 0.8 * bl) * (emotion === "surprised" ? 1.3 : emotion === "angry" ? 0.75 : emotion === "happy" ? 0.85 : 1);
  const browY = 0.185 + (emotion === "surprised" ? 0.05 : emotion === "happy" ? 0.02 : 0);
  const browRot = emotion === "sad" ? 0.32 : emotion === "angry" ? -0.32 : 0;
  const m = emotion === "surprised" ? Math.max(g, 0.35) : g;
  const open = m > 0.1;
  const L = 0.062, hs = 0.4; // eye radius, head radius

  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={scale}>
      <group position={[0, hipsY, 0]}>
        {/* torso */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow><cylinderGeometry args={[0.21, 0.25, 0.52, 18]} /><Mat color={spec.shirt} /></mesh>
        <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[0.255, 0.255, 0.1, 18]} /><Mat color={spec.pants} /></mesh>
        {spec.tie ? <mesh position={[0, 0.3, 0.215]} castShadow><boxGeometry args={[0.07, 0.3, 0.025]} /><Mat color={spec.tie} /></mesh> : null}
        {/* legs */}
        {([[-1, legR, kneeR], [1, legL, kneeL]] as [number, number, number][]).map(([sx, a, k], i) => (
          <group key={"leg" + i} position={[sx * 0.12, -0.03, 0]} rotation={[a, 0, 0]}>
            <Limb r={0.085} len={0.43} color={spec.pants} />
            <group position={[0, -0.42, 0]} rotation={[k, 0, 0]}>
              <Limb r={0.075} len={0.4} color={spec.pants} />
              <Ball r={0.1} color={spec.shoes ?? "#1c1c24"} pos={[0, -0.4, 0.06]} scale={[0.9, 0.7, 1.45]} />
            </group>
          </group>
        ))}
        {/* arms */}
        {([[1, aL, fL], [-1, aR, fR]] as [number, { x: number; z: number }, { x: number; z: number }][]).map(([sx, a, f], i) => (
          <group key={"arm" + i} position={[sx * 0.3, 0.5, 0]} rotation={[a.x, 0, a.z]}>
            <Ball r={0.085} color={spec.shirt} />
            <Limb r={0.065} len={0.34} color={spec.shirt} />
            <group position={[0, -0.33, 0]} rotation={[f.x, 0, f.z]}>
              <Limb r={0.058} len={0.32} color={spec.skin} />
              <Ball r={0.08} color={spec.skin} pos={[0, -0.34, 0]} />
            </group>
          </group>
        ))}
        {/* head */}
        <group position={[0, 0.92, 0]} rotation={[nod, turn, 0]}>
          <Ball r={hs} color={spec.skin} />
          <mesh castShadow><sphereGeometry args={[hs + 0.012, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]} /><Mat color={spec.hair} rough={0.85} /></mesh>
          {spec.long ? <mesh position={[0, -0.12, -0.1]} scale={[1, 1.15, 0.85]} castShadow><sphereGeometry args={[hs + 0.03, 20, 14]} /><Mat color={spec.hair} rough={0.85} /></mesh> : null}
          {spec.beard ? <mesh position={[0, 0, 0.0]} castShadow><sphereGeometry args={[hs + 0.012, 20, 14, 0, Math.PI * 2, Math.PI * 0.68, Math.PI * 0.3]} /><Mat color={spec.hair} rough={0.9} /></mesh> : null}
          {spec.hat ? <group position={[0, hs - 0.02, 0]}><mesh castShadow><cylinderGeometry args={[0.2, 0.22, 0.2, 20]} /><Mat color={spec.hat} /></mesh><mesh position={[0, -0.09, 0.12]} castShadow><boxGeometry args={[0.34, 0.025, 0.3]} /><Mat color={spec.hat} /></mesh></group> : null}
          <Ball r={0.07} color={spec.skin} pos={[-hs + 0.005, 0, 0]} scale={[0.5, 1, 1]} />
          <Ball r={0.07} color={spec.skin} pos={[hs - 0.005, 0, 0]} scale={[0.5, 1, 1]} />
          {/* eyes */}
          {[-1, 1].map((sx) => (
            <group key={"eye" + sx} position={[sx * 0.14, 0.05, hs - 0.07]}>
              <mesh scale={[1, eyeY, 0.55]}><sphereGeometry args={[L + 0.02, 16, 12]} /><meshStandardMaterial color="#ffffff" roughness={0.3} /></mesh>
              <mesh position={[0, 0, 0.03]} scale={[1, eyeY, 0.5]}><sphereGeometry args={[L * 0.62, 12, 10]} /><meshStandardMaterial color="#1a1420" roughness={0.2} /></mesh>
            </group>
          ))}
          {/* brows */}
          {[-1, 1].map((sx) => (
            <mesh key={"brow" + sx} position={[sx * 0.14, browY + 0.05, hs - 0.04]} rotation={[0, 0, sx * browRot]} castShadow><boxGeometry args={[0.15, 0.028, 0.03]} /><Mat color={spec.hair} /></mesh>
          ))}
          {spec.glasses ? (
            <group position={[0, 0.05, hs - 0.03]}>
              {[-1, 1].map((sx) => <mesh key={"gl" + sx} position={[sx * 0.14, 0, 0]}><torusGeometry args={[0.095, 0.012, 8, 24]} /><meshStandardMaterial color="#202028" roughness={0.4} /></mesh>)}
              <mesh><boxGeometry args={[0.07, 0.014, 0.014]} /><meshStandardMaterial color="#202028" /></mesh>
            </group>
          ) : null}
          {/* mouth: opens with the voice; a smile / frown / flat line when closed */}
          <group position={[0, -0.15, hs - 0.04]}>
            {open ? (
              <mesh scale={[0.075 + 0.03 * m, 0.015 + 0.085 * m, 0.04]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#3a0f18" roughness={0.6} /></mesh>
            ) : emotion === "happy" ? (
              <mesh rotation={[0, 0, Math.PI]} position={[0, 0.06, 0]}><torusGeometry args={[0.085, 0.014, 8, 20, Math.PI]} /><meshStandardMaterial color="#3a0f18" /></mesh>
            ) : emotion === "sad" ? (
              <mesh position={[0, -0.03, 0]}><torusGeometry args={[0.07, 0.014, 8, 20, Math.PI]} /><meshStandardMaterial color="#3a0f18" /></mesh>
            ) : (
              <mesh><boxGeometry args={[0.13, 0.018, 0.02]} /><meshStandardMaterial color="#3a0f18" /></mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
