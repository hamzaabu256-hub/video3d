import type { V3 } from "../engine/Stage";
export type CharCfg = { name: string; voice?: string; rate?: string; pitch?: string; gttsPitch?: number; spec: any; pos?: V3; rotY?: number; scale?: number; color?: string };
export type Seg = {
  from: number; dur: number; kind: "intro" | "line" | "outro"; who: string; anim: string; emotion: string; shot: string;
  text?: string; hook?: string; cta?: boolean; react?: Record<string, { anim?: string; emotion?: string }>;
};
export type StoryCfg = {
  title: string; subtitle?: string; outro?: string; outroSub?: string; brand?: string; set: string; music?: string | false; sfx?: boolean;
  captions?: boolean; transition?: string; entrance?: boolean; outroAnim?: string; introFrames?: number; outroFrames?: number;
  characters: Record<string, CharCfg>; lines: any[];
};
export type Timeline = { fps: number; total: number; hasAudio: boolean; hasMusic: boolean; hasSfx?: boolean; segs: Seg[] };
export type EpisodeData = { story: StoryCfg; timeline: Timeline; mouth: { fps: number; v: number[] } };
