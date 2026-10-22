/**
 * Phúc: blessing points.
 * Good manners and discoveries raise phúc; ignoring real temple etiquette lowers it.
 * Phúc tilts the fortune sticks. Saved in this browser only.
 */

export interface LuckEvent {
  id: number;
  delta: number;
  reason: string;
  at: number;
}

interface LuckState {
  value: number;
  history: LuckEvent[];
  /** secrets found at least once (luck is only awarded the first time) */
  found: string[];
}

const KEY = 'pvt_phuc';
const START = 50;
export { TOTAL_DISCOVERIES as TOTAL_SECRETS } from '../data/story';

function load(): LuckState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as LuckState;
      return { value: s.value ?? START, history: s.history ?? [], found: s.found ?? [] };
    }
  } catch {
    /* storage unavailable: start fresh */
  }
  return { value: START, history: [], found: [] };
}

let state: LuckState = load();
let nextId = 1;
const listeners = new Set<() => void>();
const eventListeners = new Set<(e: LuckEvent) => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const luckService = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /** toast-style notifications for each change */
  onEvent(fn: (e: LuckEvent) => void) {
    eventListeners.add(fn);
    return () => {
      eventListeners.delete(fn);
    };
  },
  change(delta: number, reason: string) {
    if (!delta) return;
    const value = Math.max(0, Math.min(100, state.value + delta));
    const e: LuckEvent = { id: nextId++, delta, reason, at: Date.now() };
    state = { ...state, value, history: [e, ...state.history].slice(0, 30) };
    save();
    listeners.forEach((l) => l());
    eventListeners.forEach((l) => l(e));
  },
  /** start fresh (used by "Start over") */
  reset() {
    state = { value: START, history: [], found: [] };
    save();
    listeners.forEach((l) => l());
  },
  /** returns true the first time a secret is found */
  markFound(id: string): boolean {
    if (state.found.includes(id)) return false;
    state = { ...state, found: [...state.found, id] };
    save();
    listeners.forEach((l) => l());
    return true;
  },
};

/** A short label for the current luck level */
export function luckLabel(v: number): { jp: string; en: string } {
  if (v >= 85) return { jp: 'Đại phúc', en: 'Radiant' };
  if (v >= 65) return { jp: 'Có phúc', en: 'Blessed' };
  if (v >= 45) return { jp: 'Bình an', en: 'Steady' };
  if (v >= 25) return { jp: 'Mây che', en: 'Clouded' };
  return { jp: 'Lận đận', en: 'Troubled' };
}
