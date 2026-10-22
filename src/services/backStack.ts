import { useEffect, useRef } from 'react';

/**
 * One "back" for the whole app.
 *
 * Every layer the user can leave (the 3D visit, a hidden legend world, any sheet or popup) registers
 * here while it is open. Esc, the browser back button and Android's back gesture all close only the
 * topmost layer, so the user always steps back one level at a time.
 *
 * History: while any layer is open we keep one extra history entry. Pressing back consumes it,
 * we close the top layer, and re-arm it if more layers remain.
 */
interface Layer {
  id: number;
  close: () => void;
}

const stack: Layer[] = [];
let nextId = 1;
let armed = false;
let ignorePops = 0;
let settleTimer: number | null = null;

const canUseHistory = () => typeof window !== 'undefined' && !!window.history?.pushState;

function arm() {
  if (armed || !canUseHistory()) return;
  try {
    window.history.pushState({ vjinjaBack: true }, '');
    armed = true;
  } catch {
    /* sandboxed iframe etc. */
  }
}

/** After layers change, make sure history matches: armed if anything is open, clean if not. */
function settle() {
  if (settleTimer !== null) return;
  settleTimer = window.setTimeout(() => {
    settleTimer = null;
    if (stack.length > 0) arm();
    else if (armed) {
      armed = false;
      ignorePops++;
      try {
        window.history.back();
      } catch {
        ignorePops--;
      }
    }
  }, 0);
}

function closeTop() {
  const top = stack[stack.length - 1];
  if (top) top.close();
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--;
      return;
    }
    if (!armed) return;
    armed = false;
    closeTop();
    settle();
  });
  // Capture phase, so Esc is handled once here before anything else sees it
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || stack.length === 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      closeTop();
    },
    true
  );
}

export const backStack = {
  push(close: () => void) {
    const layer = { id: nextId++, close };
    stack.push(layer);
    settle();
    return layer.id;
  },
  remove(id: number) {
    const i = stack.findIndex((l) => l.id === id);
    if (i >= 0) stack.splice(i, 1);
    settle();
  },
  /** Close the topmost layer, same as pressing back */
  back: closeTop,
  depth: () => stack.length,
};

/**
 * Register a closable layer while `open` is true. The latest `close` is always used,
 * so callers can pass inline arrow functions.
 */
export function useBackLayer(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const id = backStack.push(() => closeRef.current());
    return () => backStack.remove(id);
  }, [open]);
}
