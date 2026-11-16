// ديكور مكتب بسيط: أرضية + جدران + نافذة + مكاتب بشاشات + نباتات.
import React from "react";
import type { Look, V3 } from "../engine/Stage";

export const officeLook = (): Look => ({
  bg: "#cfd8e6", fog: ["#cfd8e6", 12, 28],
  hemi: ["#ffffff", "#8a93a6", 0.7],
  key: { color: "#fff4e0", intensity: 1.7, pos: [3, 6, 5] },
  fill: { color: "#9db7ff", intensity: 0.5, pos: [-5, 3, 3] },
});

const Box: React.FC<{ s: V3; p: V3; c: string; emissive?: string; cast?: boolean }> = ({ s, p, c, emissive, cast = true }) => (
  <mesh position={p} castShadow={cast} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.7} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? 0.9 : 0} />
  </mesh>
);

const Monitor: React.FC<{ pos: V3; kind: string }> = ({ pos, kind }) => (
  <group position={pos}>
    <Box s={[0.9, 0.55, 0.04]} p={[0, 0.45, 0]} c="#1d1f27" />
    <Box s={[0.82, 0.47, 0.01]} p={[0, 0.45, 0.025]} c="#dfe9ff" emissive="#9db9f5" cast={false} />
    {kind === "chat" ? [0, 1, 2, 3].map((i) => (
      <Box key={i} s={[0.34, 0.07, 0.01]} p={[i % 2 ? 0.2 : -0.2, 0.63 - i * 0.12, 0.035]} c={i % 2 ? "#5b8def" : "#ffffff"} emissive={i % 2 ? "#3f6fd6" : "#ffffff"} cast={false} />
    )) : null}
    <Box s={[0.08, 0.2, 0.06]} p={[0, 0.1, -0.02]} c="#2b2d36" />
  </group>
);

const Desk: React.FC<{ pos: V3; screen: string }> = ({ pos, screen }) => (
  <group position={pos}>
    <Box s={[1.6, 0.06, 0.8]} p={[0, 0.75, 0]} c="#a47a52" />
    {([[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]] as [number, number][]).map(([x, z], i) => (
      <Box key={i} s={[0.06, 0.72, 0.06]} p={[x, 0.36, z]} c="#5a4a3a" />
    ))}
    <Monitor pos={[0, 0.78, -0.15]} kind={screen} />
  </group>
);

const Plant: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.18, 0.14, 0.4, 16]} /><meshStandardMaterial color="#b5653c" roughness={0.8} /></mesh>
    <mesh position={[0, 0.65, 0]} castShadow><sphereGeometry args={[0.32, 16, 12]} /><meshStandardMaterial color="#4f9a5a" roughness={0.9} /></mesh>
  </group>
);

export const Office: React.FC<{ screens?: string[]; children?: React.ReactNode }> = ({ screens = ["chat", "chat", "chat"], children }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#8b7d6b" roughness={0.9} /></mesh>
    <mesh position={[0, 1.6, -4.2]} receiveShadow><planeGeometry args={[40, 3.2]} /><meshStandardMaterial color="#e8e2d8" roughness={0.95} /></mesh>
    <mesh position={[-7, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[40, 3.2]} /><meshStandardMaterial color="#ddd6ca" roughness={0.95} /></mesh>
    {/* نافذة */}
    <Box s={[2.6, 1.6, 0.05]} p={[-1.6, 1.7, -4.15]} c="#f4f4f4" cast={false} />
    <Box s={[2.4, 1.4, 0.02]} p={[-1.6, 1.7, -4.11]} c="#bfe0ff" emissive="#9fd0ff" cast={false} />
    {screens.map((s, i) => <Desk key={i} pos={[1.4 + i * 1.9, 0, -3.1]} screen={s} />)}
    <Plant pos={[-4.6, 0, -3.4]} />
    <Plant pos={[6.2, 0, -1.2]} />
    {children}
  </group>
);
