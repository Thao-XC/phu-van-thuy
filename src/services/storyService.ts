import { useSyncExternalStore } from 'react';
import type { PalaceId } from '../data/story';
import type { StoryCard } from '../three/encounters/types';

/**
 * Story progress and the visitor's pouch, kept in this browser.
 */
export interface PouchItem {
  id: string;
  kind: string;
  forWhom?: string;
  at: number;
}
export interface SavedXam {
  n: number;
  at: number;
}
export interface SavedPetition {
  name: string;
  wish: string;
  at: number;
}

interface StoryState {
  started: boolean;
  khan: PalaceId[];
  ceremony: boolean;
  pouch: PouchItem[];
  xam: SavedXam[];
  petitions: SavedPetition[];
  cards: Record<string, StoryCard>;
}

const KEY = 'pvt_story';
const EMPTY: StoryState = { started: false, khan: [], ceremony: false, pouch: [], xam: [], petitions: [], cards: {} };

function load(): StoryState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<StoryState>) };
  } catch {
    /* storage unavailable */
  }
  return EMPTY;
}

let state = load();
const listeners = new Set<() => void>();
const set = (next: Partial<StoryState>) => {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
};

export const storyService = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  start: () => set({ started: true }),
  giveKhan(id: PalaceId) {
    if (!state.khan.includes(id)) set({ khan: [...state.khan, id] });
  },
  finishCeremony: () => set({ ceremony: true }),
  receive(kind: string, forWhom?: string) {
    const at = Date.now();
    set({ pouch: [{ id: `p-${at}`, kind, forWhom, at }, ...state.pouch].slice(0, 60) });
  },
  saveXam: (n: number) => set({ xam: [{ n, at: Date.now() }, ...state.xam].slice(0, 30) }),
  savePetition: (p: Omit<SavedPetition, 'at'>) => set({ petitions: [{ ...p, at: Date.now() }, ...state.petitions].slice(0, 30) }),
  saveCard(id: string, card: StoryCard) {
    if (!state.cards[id]) set({ cards: { ...state.cards, [id]: card } });
  },
  /** start again from the beginning (keeps nothing) */
  reset: () => set({ ...EMPTY }),
};

export function useStory() {
  return useSyncExternalStore(storyService.subscribe, storyService.get, storyService.get);
}
