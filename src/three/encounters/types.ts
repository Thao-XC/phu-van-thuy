import type * as THREE from 'three';
import type { Architecture } from '../kit/architecture';
import type { Nature } from '../kit/nature';
import type { KitMaterials } from '../kit/materials';
import type { VietKit } from '../kit/vietnam';

/** The legend card shown when an encounter ends */
export interface StoryCard {
  title: string;
  /** Vietnamese / Hán-Nôm title */
  jp: string;
  /** 2–4 short paragraphs telling the real legend / tradition */
  body: string[];
  /** one line about what just happened to you */
  ending: string;
}

/** What an encounter script can do while it runs */
export interface EncounterApi {
  caption: (text: string, seconds?: number) => void;
  /** brief full-screen flash (lightning, smoke, light) */
  flash: (color: number, peak?: number, seconds?: number) => void;
  shake: (amount: number, seconds?: number) => void;
  /** finish: fade to this colour, then return the visitor to the shrine and show the card */
  end: (fadeColor: number, seconds?: number) => void;
  /** change the sky / fog / light of the secret world mid-story */
  setEnv: (env: Partial<EncounterRuntime['env']>) => void;
}

/** The visitor's position inside the encounter, in its own local coordinates */
export interface EncounterPlayer {
  x: number;
  y: number;
  z: number;
  /** horizontal look direction (radians, same convention as the scene) */
  rotY: number;
}

/** A built, running encounter ("pocket world" placed far below the shrine) */
export interface EncounterRuntime {
  enter: { x: number; z: number; rotY: number };
  ground: (x: number, z: number) => number;
  walkable?: (x: number, z: number) => boolean;
  bounds: { x0: number; x1: number; z0: number; z1: number };
  env: { bg: number; fog: number; density: number; sun: number; hemi: number; ambient: number; sunColor?: number };
  underwater?: boolean;
  /** called every frame with seconds since the encounter began */
  update: (t: number, dt: number, p: EncounterPlayer, api: EncounterApi) => void;
}

export interface EncounterKit {
  root: THREE.Group;
  arch: Architecture;
  nat: Nature;
  m: KitMaterials;
  vk: VietKit;
}

/** Declared by a shrine layout: where it triggers, what it is, where you come back */
export interface EncounterDef {
  id: string;
  title: string;
  /** main-world area that triggers it when the visitor tries to step in */
  zone: (x: number, z: number) => boolean;
  /** colour of the "going in" transition */
  diveColor: number;
  /** where the visitor reappears afterwards (must be outside the zone) */
  exit: { x: number; z: number; rotY: number };
  card: StoryCard;
  build: (kit: EncounterKit) => EncounterRuntime;
}

export interface EncounterEvent {
  type: 'start' | 'caption' | 'end';
  id: string;
  title?: string;
  text?: string;
  seconds?: number;
  card?: StoryCard;
}
