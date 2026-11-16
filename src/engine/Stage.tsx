// Stage: ThreeCanvas + إضاءة + كاميرا متحركة بين مفتاحين. كل شيء دالة في رقم الفريم فيمكن رندر أي فريم لوحده.
import React from "react";
import "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";

export type V3 = [number, number, number];
export type CamKeys = { from: V3; to?: V3; lookFrom: V3; lookTo?: V3; fov: number };
export type Look = {
  bg: string; fog?: [string, number, number];
  hemi: [string, string, number];
  key: { color: string; intensity: number; pos: V3 };
  fill: { color: string; intensity: number; pos: V3 };
};

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const mix = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const Rig: React.FC<{ cam: CamKeys; dur: number }> = ({ cam, dur }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const camera = useThree((s) => s.camera) as any;
  const k = ease(frame / Math.max(1, dur - 1));
  const p = mix(cam.from, cam.to ?? cam.from, k);
  const l = mix(cam.lookFrom, cam.lookTo ?? cam.lookFrom, k);
  camera.position.set(p[0], p[1], p[2]);
  camera.fov = cam.fov;
  camera.aspect = width / height;
  camera.lookAt(l[0], l[1], l[2]);
  camera.updateProjectionMatrix();
  return null;
};

// focus: مسافة التركيز (محجوزة لعمق الميدان لاحقاً، حالياً تتحكم بالضباب فقط)
export const Stage: React.FC<{ look: Look; cam: CamKeys; dur: number; focus?: number; children?: React.ReactNode }> = ({ look, cam, dur, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov, position: cam.from, near: 0.1, far: 80 }} style={{ background: look.bg }}>
      <color attach="background" args={[look.bg]} />
      {look.fog ? <fog attach="fog" args={look.fog} /> : null}
      <hemisphereLight args={[look.hemi[0], look.hemi[1], look.hemi[2]]} />
      <directionalLight color={look.key.color} intensity={look.key.intensity} position={look.key.pos} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={0.5} shadow-camera-far={30} shadow-bias={-0.0004} />
      <directionalLight color={look.fill.color} intensity={look.fill.intensity} position={look.fill.pos} />
      <Rig cam={cam} dur={dur} />
      {children}
    </ThreeCanvas>
  );
};
