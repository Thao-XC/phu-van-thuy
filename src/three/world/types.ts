import * as THREE from 'three';
import type { Architecture } from '../kit/architecture';
import type { Nature } from '../kit/nature';
import type { KitMaterials } from '../kit/materials';
import type { VietKit } from '../kit/vietnam';
import type { EncounterDef, StoryCard } from '../encounters/types';

/** An interactive place: shows a prompt when you're near, and appears in the "Go to" list */
export interface SpotDef extends Anchor {
  id: string;
  name: string;
  vi: string;
  type: SpotType;
  /** trigger radius (default 4.5) */
  r?: number;
}
export type SpotType = 'gate' | 'keeper' | 'incense' | 'altar' | 'fortune' | 'furnace' | 'bell' | 'stall' | 'river' | 'view';

export type GroundFn = (x: number, z: number) => number;

/** Where a spot's trigger sits and what the camera looks at after teleporting there */
export interface Anchor {
  at: [number, number];
  look: [number, number];
}

export type ParticleKind = 'leaves' | 'petals' | 'fireflies' | 'none';

export interface LayoutResult {
  spawn: { x: number; z: number; rotY: number };
  bounds: { x0: number; x1: number; z0: number; z1: number };
  /** places you can interact with or jump to */
  spots: SpotDef[];
  particles?: ParticleKind;
  /** multiplies the default fog density (bigger landscapes want less fog) */
  fog?: number;
  /** centre + radius of the cinematic drone orbit */
  orbit?: { x: number; z: number; r: number; y?: number };
  /** incense smoke origin (the big outdoor incense burner) */
  smoke?: [number, number, number];
  /** where the visitor may stand (e.g. not in the pond, not in the sea) */
  walkable?: (x: number, z: number) => boolean;
  /** water surface that gently bobs (sea / pond) */
  bobbingWater?: THREE.Mesh;
  /** secret worlds entered by stepping into water / hidden doorways */
  encounters?: EncounterDef[];
  /** small discoveries on the grounds */
  secrets?: SecretDef[];
  /** real-world manners that cost luck when ignored */
  etiquette?: Etiquette;
  /** called whenever the time of day changes (lanterns, lights) */
  onTime?: (time: 'day' | 'twilight' | 'night') => void;
  /** objects that only appear at night (shown/hidden with the time of day) */
  nightObjects?: THREE.Object3D[];
}

export interface SecretDef {
  id: string;
  at: [number, number];
  /** trigger radius (default 3) */
  r?: number;
  /** enter: walk into it · linger: stay a few seconds · bow: bow there · night: be there at night ·
   *  blindwalk: from `at`, walk to `to` with your eyes closed */
  trigger: 'enter' | 'linger' | 'bow' | 'night' | 'blindwalk';
  seconds?: number;
  to?: [number, number];
  /** caption shown the first time you come near, nudging without spoiling */
  hint?: string;
  luck: number;
  card: StoryCard;
  /** little animation when found (a deer bowing back, a cat waking…) */
  onFound?: () => void;
}

export interface Etiquette {
  /** places visitors must not go */
  forbidden?: { test: (x: number, z: number) => boolean; reason: string; penalty?: number }[];
  /** thresholds you should step over, never stand on */
  thresholds?: { test: (x: number, z: number) => boolean }[];
  /** areas where running is rude (courtyard, halls) */
  calm?: (x: number, z: number) => boolean;
}

export interface LayoutCtx {
  scene: THREE.Scene;
  arch: Architecture;
  nat: Nature;
  m: KitMaterials;
  vk: VietKit;
  /** ground height used for walking; layouts set it before placing things */
  ground: GroundFn;
  setGround: (fn: GroundFn) => void;
  /** add an object at (x, ground+y, z) facing rotY */
  add: <T extends THREE.Object3D>(o: T, x?: number, z?: number, rotY?: number, y?: number) => T;
  /** terrain mesh following the ground fn */
  terrain: (color: number, size?: number, seg?: number) => THREE.Mesh;
  /** flat water plane */
  water: (y: number, w: number, d: number, x?: number, z?: number, color?: number) => THREE.Mesh;
  /** ribbon path over the ground */
  path: (pts: [number, number][], w: number, kind: 'gravel' | 'paving' | 'wood' | 'dirt', lift?: number) => THREE.Mesh;
}

export type Layout = (ctx: LayoutCtx) => LayoutResult;

/* ------------------------------------------------------------------ */
/* Small helpers shared by layouts                                     */
/* ------------------------------------------------------------------ */

/** Smooth ramp between z0 (height y0) and z1 (height y1) */
export const ramp = (z: number, z0: number, z1: number, y0: number, y1: number) => {
  const t = Math.min(1, Math.max(0, (z - z0) / (z1 - z0)));
  return y0 + (y1 - y0) * t;
};

/** Gentle rolling noise for natural terrain */
export const hills = (x: number, z: number, amp = 1, freq = 0.04) =>
  (Math.sin(x * freq + 1.3) * Math.cos(z * freq * 1.3 + 0.7) + Math.sin((x + z) * freq * 0.6) * 0.6) * amp;

/** Rising ground away from a corridor of radius r around x=0 */
export const valley = (x: number, r: number, rise: number) => Math.max(0, Math.abs(x) - r) * rise;

/** Keep-clear tests for tree scattering */
export const outsideRect = (x0: number, x1: number, z0: number, z1: number) => (x: number, z: number) =>
  x > x0 && x < x1 && z > z0 && z < z1;
export const anyOf = (...tests: ((x: number, z: number) => boolean)[]) => (x: number, z: number) => tests.some((t) => t(x, z));
