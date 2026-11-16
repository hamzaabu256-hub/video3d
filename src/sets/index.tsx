// مكتبة الديكورات: office / studio / park / classroom. الشخصيات تقف عند z=-1.5 والحائط الخلفي عند z=-4.2.
import React from "react";
import type { Look, V3 } from "../engine/Stage";
import { Office, officeLook } from "../ep2/sets";

type C = { children?: React.ReactNode };
const Box: React.FC<{ s: V3; p: V3; c: string; e?: string; ei?: number; cast?: boolean; rot?: V3 }> = ({ s, p, c, e, ei = 1, cast = true, rot = [0, 0, 0] }) => (
  <mesh position={p} rotation={rot} castShadow={cast} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.7} emissive={e ?? "#000000"} emissiveIntensity={e ? ei : 0} />
  </mesh>
);
const Ground: React.FC<{ color: string; z?: number; rough?: number; metal?: number }> = ({ color, rough = 0.9, metal = 0 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color={color} roughness={rough} metalness={metal} /></mesh>
);
const Wall: React.FC<{ color: string }> = ({ color }) => (
  <>
    <mesh position={[0, 1.6, -4.2]} receiveShadow><planeGeometry args={[40, 3.2]} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>
    <mesh position={[-7, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[40, 3.2]} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>
  </>
);

/* ---------------- Studio (بودكاست / نيون) ---------------- */
export const studioLook = (): Look => ({
  bg: "#0d0f1a", fog: ["#0d0f1a", 10, 26], hemi: ["#7f8cff", "#1a1030", 0.55],
  key: { color: "#ffe8d0", intensity: 1.5, pos: [2.5, 5, 5] }, fill: { color: "#ff4fa3", intensity: 0.8, pos: [-5, 2.5, 3] },
});
const Studio: React.FC<C> = ({ children }) => (
  <group>
    <Ground color="#161a2e" rough={0.35} metal={0.2} />
    <Wall color="#1b2040" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.5]} receiveShadow><circleGeometry args={[2.8, 48]} /><meshStandardMaterial color="#2a2150" roughness={0.9} /></mesh>
    <Box s={[7, 0.06, 0.06]} p={[0, 2.7, -4.1]} c="#ff3d9a" e="#ff3d9a" cast={false} />
    <Box s={[7, 0.06, 0.06]} p={[0, 0.5, -4.1]} c="#22d3ee" e="#22d3ee" cast={false} />
    <Box s={[2.6, 1.3, 0.05]} p={[0, 1.6, -4.12]} c="#0b1020" e="#243a7a" cast={false} />
    {([-3.6, 3.6] as number[]).map((x, i) => (
      <mesh key={i} position={[x, 1.7, -4.1]}><torusGeometry args={[1.0, 0.05, 12, 48]} /><meshStandardMaterial color="#b46bff" emissive="#b46bff" emissiveIntensity={1.2} /></mesh>
    ))}
    <Box s={[3.2, 0.4, 0.9]} p={[0, 0.2, -3.5]} c="#3a2f5c" />
    <Box s={[3.2, 0.7, 0.2]} p={[0, 0.7, -3.9]} c="#3a2f5c" />
    {([-4.4, 4.4] as number[]).map((x, i) => (
      <group key={i} position={[x, 0, -2.6]}>
        <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.025, 0.025, 1.8, 8]} /><meshStandardMaterial color="#444" /></mesh>
        <mesh position={[0, 1.85, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#fff2cc" emissive="#ffd88a" emissiveIntensity={1.1} /></mesh>
      </group>
    ))}
    {children}
  </group>
);

/* ---------------- Park (حديقة) ---------------- */
export const parkLook = (): Look => ({
  bg: "#bfe3ff", fog: ["#cfeaff", 14, 42], hemi: ["#ffffff", "#7fb069", 0.95],
  key: { color: "#fff1cc", intensity: 2.0, pos: [5, 8, 4] }, fill: { color: "#bfe0ff", intensity: 0.4, pos: [-5, 3, 4] },
});
const Tree: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.14, 0.2, 1.6, 10]} /><meshStandardMaterial color="#7a5233" roughness={0.9} /></mesh>
    <mesh position={[0, 2.1, 0]} castShadow><sphereGeometry args={[0.95, 16, 12]} /><meshStandardMaterial color="#3f8f4a" roughness={0.9} /></mesh>
    <mesh position={[0.5, 1.8, 0.2]} castShadow><sphereGeometry args={[0.6, 14, 10]} /><meshStandardMaterial color="#4aa355" roughness={0.9} /></mesh>
  </group>
);
const Park: React.FC<C> = ({ children }) => (
  <group>
    <Ground color="#6dbb5a" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.2]} receiveShadow><planeGeometry args={[60, 2.2]} /><meshStandardMaterial color="#dccaa0" roughness={1} /></mesh>
    {([[-5, 0, -4.5], [-3.2, 0, -6.5], [5.2, 0, -5], [7, 0, -3], [-7.5, 0, -2], [2.5, 0, -8]] as V3[]).map((p, i) => <Tree key={i} p={p} s={0.9 + (i % 3) * 0.2} />)}
    <group position={[3.4, 0, -2.8]}>
      <Box s={[1.6, 0.08, 0.5]} p={[0, 0.45, 0]} c="#8a5a35" />
      <Box s={[1.6, 0.5, 0.06]} p={[0, 0.75, -0.22]} c="#8a5a35" />
      <Box s={[0.08, 0.45, 0.45]} p={[-0.7, 0.22, 0]} c="#3b3b3b" />
      <Box s={[0.08, 0.45, 0.45]} p={[0.7, 0.22, 0]} c="#3b3b3b" />
    </group>
    {([[-16, -1, -16, 9], [4, -1.5, -18, 11], [18, -1, -15, 8]] as number[][]).map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} scale={[1.6, 0.6, 1]}><sphereGeometry args={[r, 24, 16]} /><meshStandardMaterial color="#5aa84e" roughness={1} /></mesh>
    ))}
    {([[-6, 9, -18], [5, 10, -22], [14, 8, -16]] as V3[]).map((p, i) => (
      <group key={i} position={p}>
        {[[0, 0, 0, 1.6], [1.5, -0.2, 0, 1.2], [-1.5, -0.3, 0, 1.1]].map(([x, y, z, r], j) => (
          <mesh key={j} position={[x, y, z]}><sphereGeometry args={[r, 12, 10]} /><meshBasicMaterial color="#ffffff" /></mesh>
        ))}
      </group>
    ))}
    {children}
  </group>
);

/* ---------------- Classroom (فصل) ---------------- */
export const classLook = (): Look => ({
  bg: "#e9e3d3", fog: ["#e9e3d3", 12, 30], hemi: ["#ffffff", "#9a8a6a", 0.75],
  key: { color: "#fff6e5", intensity: 1.6, pos: [3, 6, 5] }, fill: { color: "#cfe0ff", intensity: 0.5, pos: [-5, 3, 3] },
});
const SDesk: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box s={[0.9, 0.05, 0.6]} p={[0, 0.7, 0]} c="#c79a63" />
    <Box s={[0.05, 0.68, 0.05]} p={[-0.4, 0.34, -0.25]} c="#555" /><Box s={[0.05, 0.68, 0.05]} p={[0.4, 0.34, -0.25]} c="#555" />
    <Box s={[0.05, 0.68, 0.05]} p={[-0.4, 0.34, 0.25]} c="#555" /><Box s={[0.05, 0.68, 0.05]} p={[0.4, 0.34, 0.25]} c="#555" />
    <Box s={[0.4, 0.04, 0.4]} p={[0, 0.42, 0.6]} c="#3b6fb6" /><Box s={[0.4, 0.4, 0.04]} p={[0, 0.65, 0.8]} c="#3b6fb6" />
  </group>
);
const Classroom: React.FC<C> = ({ children }) => (
  <group>
    <Ground color="#b99a6b" />
    <Wall color="#efe7d3" />
    <Box s={[4.4, 1.7, 0.04]} p={[0, 1.7, -4.16]} c="#8a6a45" cast={false} />
    <Box s={[4.0, 1.4, 0.04]} p={[0, 1.7, -4.12]} c="#1f4d3a" cast={false} />
    <Box s={[2.2, 0.03, 0.01]} p={[-0.6, 2.1, -4.09]} c="#f1f1f1" cast={false} />
    <Box s={[1.6, 0.03, 0.01]} p={[-0.9, 1.9, -4.09]} c="#f1f1f1" cast={false} />
    <Box s={[1.9, 0.03, 0.01]} p={[-0.7, 1.7, -4.09]} c="#f1f1f1" cast={false} />
    <Box s={[3.6, 0.06, 0.15]} p={[0, 0.98, -4.08]} c="#8a6a45" />
    <mesh position={[3.4, 2.7, -4.14]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 0.04, 28]} /><meshStandardMaterial color="#ffffff" /></mesh>
    <Box s={[0.02, 0.2, 0.01]} p={[3.4, 2.77, -4.11]} c="#222" cast={false} />
    <Box s={[0.14, 0.02, 0.01]} p={[3.45, 2.7, -4.11]} c="#222" cast={false} />
    {([-5.2, -3.6, 3.6, 5.2] as number[]).map((x, i) => <SDesk key={i} p={[x, 0, -3.0]} />)}
    <Box s={[1.4, 2.2, 0.4]} p={[-5.6, 1.1, -3.9]} c="#7b5a3a" />
    {([0, 1, 2, 3] as number[]).map((i) => <Box key={i} s={[0.2, 0.3, 0.3]} p={[-6.0 + i * 0.3, 1.9, -3.7]} c={["#d35454", "#3a7a5a", "#3a77cc", "#ccaa33"][i]} />)}
    {children}
  </group>
);

export type SetDef = { look: () => Look; Comp: React.FC<C> };
export const SETS: Record<string, SetDef> = {
  office: { look: officeLook, Comp: ({ children }) => <Office>{children}</Office> },
  studio: { look: studioLook, Comp: Studio },
  park: { look: parkLook, Comp: Park },
  classroom: { look: classLook, Comp: Classroom },
};
