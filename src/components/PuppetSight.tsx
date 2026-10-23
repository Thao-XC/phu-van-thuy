import React, { useEffect, useRef, useState } from 'react';
import type { PuppetEvent } from '../three/puppets';
import { useBackLayer } from '../services/backStack';

/** a tiny bus from the scene to the overlay */
export function createPuppetBus() {
  const subs = new Set<(e: PuppetEvent) => void>();
  return {
    emit: (e: PuppetEvent) => subs.forEach((f) => f(e)),
    on: (f: (e: PuppetEvent) => void) => {
      subs.add(f);
      return () => void subs.delete(f);
    },
  };
}
export type PuppetBus = ReturnType<typeof createPuppetBus>;

/**
 * Watching the water puppets: nothing on screen but the show, Chú Tễu's words in a manga bubble
 * over his head, a small printed card naming each act, and one quiet hint.
 */
export const PuppetSight: React.FC<{ bus: PuppetBus; anchor: () => { x: number; y: number; on: boolean } | null; onClose: () => void }> = ({ bus, anchor, onClose }) => {
  const [act, setAct] = useState<{ i: number; vi: string; en: string } | null>(null);
  const [line, setLine] = useState<{ id: number; vi: string; en: string } | null>(null);
  const [end, setEnd] = useState(false);
  const id = useRef(0);
  useBackLayer(true, onClose);

  useEffect(
    () =>
      bus.on((e) => {
        if (e.type === 'act') {
          setAct(e);
          window.setTimeout(() => setAct((a) => (a?.i === e.i ? null : a)), 3800);
        } else if (e.type === 'line') {
          const l = { id: ++id.current, vi: e.vi, en: e.en };
          setLine(l);
          window.setTimeout(() => setLine((x) => (x?.id === l.id ? null : x)), 3900);
        } else {
          setEnd(true);
          window.setTimeout(onClose, 3500);
        }
      }),
    [bus, onClose],
  );

  // keep the bubble over Tễu's head
  const bubble = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: innerWidth / 2, y: innerHeight / 2, on: false, dx: 0 });
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = anchor();
      const w = bubble.current?.offsetWidth ?? 280, h = bubble.current?.offsetHeight ?? 90;
      if (a) {
        const x = Math.max(w / 2 + 12, Math.min(innerWidth - w / 2 - 12, a.x));
        const y = Math.max(h + 16, a.y);
        setPos({ x, y, on: a.on, dx: Math.max(-w / 2 + 30, Math.min(w / 2 - 30, a.x - x)) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchor]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none select-none" role="dialog" aria-label="Water puppet show">
      {/* soft letterbox: you're in the audience now */}
      <div className="absolute inset-x-0 top-0 h-[7vh] bg-black/80 arrive-bar-top" />
      <div className="absolute inset-x-0 bottom-0 h-[9vh] bg-black/80 arrive-bar-bottom" />

      {act && (
        <div key={act.i} className="absolute left-1/2 top-[10vh] -translate-x-1/2 fest-in">
          <div className="dh-paper px-5 py-2 rounded-sm text-center border-2 border-[#211a15]">
            <div className="dh-title text-xl text-[#211a15] leading-tight">{act.vi}</div>
            <div className="text-[12px] italic text-[#5a3a26]">{act.en}</div>
          </div>
        </div>
      )}

      {line && pos.on && (
        <div key={line.id} ref={bubble} className="absolute manga-pop" style={{ left: pos.x, top: pos.y - 14, transform: 'translate(-50%, -100%)' }}>
          <div className="manga-bubble relative px-4 pt-3 pb-2.5 w-[min(300px,72vw)]">
            <span className="absolute -top-3.5 left-4 px-2 py-0.5 rounded-sm bg-[#e2b23a] text-[#211a15] text-[11px] font-bold border-2 border-[#16110d]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
              Chú Tễu
            </span>
            <p className="text-[18px] leading-snug">{line.vi}</p>
            <p className="text-[14px] leading-snug opacity-60">{line.en}</p>
            <svg width="34" height="26" viewBox="0 0 34 26" className="absolute left-1/2" style={{ bottom: -23, transform: `translateX(calc(-50% + ${pos.dx}px))` }} aria-hidden>
              <path d="M2 0 C 10 6, 14 14, 20 25 C 20 14, 24 6, 32 0" fill="#fffdf7" stroke="#16110d" strokeWidth="3" strokeLinejoin="round" />
              <rect x="3" y="-2" width="28" height="4" fill="#fffdf7" />
            </svg>
          </div>
        </div>
      )}

      {end && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="dh-title text-4xl text-[#fff1c4] drop-shadow-[0_0_20px_rgba(0,0,0,.9)] fest-in">Hết · The end</div>
        </div>
      )}

      <div className="absolute bottom-[2.6vh] left-1/2 -translate-x-1/2 text-[12px] text-[#f1dfc0]/70">
        <kbd className="px-1 rounded border border-current">Space</kbd> vỗ tay · clap &nbsp;·&nbsp; <kbd className="px-1 rounded border border-current">S</kbd> next act &nbsp;·&nbsp; <kbd className="px-1 rounded border border-current">Esc</kbd> leave
      </div>
    </div>
  );
};
