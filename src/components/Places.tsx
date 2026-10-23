import React, { useEffect, useState } from 'react';
import type { SpotDef } from '../three/world/types';
import { useBackLayer } from '../services/backStack';

/**
 * Tab: a small numbered list of the temple's places, driven by the keyboard.
 * 1–9 go straight there; ↑ ↓ and Enter also work; Tab or Esc closes it.
 * It sits at the left edge so the view stays open.
 */
export const PlacesPicker: React.FC<{ spots: SpotDef[]; onGo: (id: string) => void; onClose: () => void }> = ({ spots, onGo, onClose }) => {
  const list = spots;
  const [sel, setSel] = useState(0);
  useBackLayer(true, onClose);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSel((v) => (v + 1) % list.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSel((v) => (v - 1 + list.length) % list.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onGo(list[sel].id);
      } else if (/^[0-9]$/.test(e.key)) {
        // 1–9 then 0 for the tenth
        const i = e.key === '0' ? 9 : Number(e.key) - 1;
        if (!list[i]) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        onGo(list[i].id);
      }
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [list, sel, onGo, onClose]);

  return (
    <div className="fixed left-3 top-1/2 -translate-y-1/2 z-40 w-64 rounded-md dh-paper border-2 border-[#211a15] shadow-xl p-3 text-[#2a1d14] select-none" role="listbox" aria-label="Go to a place">
      <div className="flex items-baseline justify-between px-1">
        <span className="dh-title text-[15px]">Đi đến · Go to</span>
        <kbd className="px-1 rounded border border-[#211a15] text-[10px]">Tab</kbd>
      </div>
      <ol className="mt-2 space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
        {list.map((s, i) => (
          <li key={s.id} ref={i === sel ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined} role="option" aria-selected={i === sel} className={`flex items-center gap-2 px-2 py-1.5 rounded ${i === sel ? 'bg-[#8e1b1b] text-[#fff4dc]' : ''}`}>
            <kbd className={`w-5 text-center rounded border text-[11px] font-bold ${i > 9 ? 'opacity-0' : ''} ${i === sel ? 'border-[#fff4dc]/60' : 'border-[#211a15]/40'}`}>{i === 9 ? 0 : i + 1}</kbd>
            <span className="text-[13px] font-semibold truncate">{s.vi}</span>
            <span className={`ml-auto text-[11px] truncate ${i === sel ? 'text-[#fbe3c0]' : 'text-[#6d5b49]'}`}>{s.name}</span>
          </li>
        ))}
      </ol>
      <div className="mt-2 px-1 text-[11px] text-[#6d5b49]">A number, or ↑ ↓ and Enter</div>
    </div>
  );
};
