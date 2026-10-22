import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Sun, Sunset, Moon, Plane, RefreshCw } from 'lucide-react';
import type { SpotDef } from '../three/world/types';
import type { TimeOfDay } from '../three/TempleScene';

export type RitualKey = 'keeper' | 'incense' | 'altar' | 'fortune' | 'furnace' | 'stall' | 'bell' | 'lantern';

const RITUALS: { k: RitualKey; vi: string; en: string; icon: string }[] = [
  { k: 'keeper', vi: 'Bà Thủ Từ', en: 'Keeper', icon: '🧓' },
  { k: 'incense', vi: 'Thắp hương', en: 'Incense', icon: '🕯️' },
  { k: 'altar', vi: 'Khấn', en: 'Pray', icon: '🙏' },
  { k: 'fortune', vi: 'Xin xăm', en: 'Fortune', icon: '🎋' },
  { k: 'furnace', vi: 'Viết sớ', en: 'Petition', icon: '📜' },
  { k: 'stall', vi: 'Nhận lộc', en: 'Lộc', icon: '🧧' },
  { k: 'bell', vi: 'Chuông', en: 'Bell', icon: '🔔' },
  { k: 'lantern', vi: 'Thả đèn', en: 'Lantern', icon: '🪷' },
];

interface Props {
  spots: SpotDef[];
  time: TimeOfDay;
  onTime: (t: TimeOfDay) => void;
  auto: boolean;
  onAuto: () => void;
  tour: boolean;
  onTour: () => void;
  onTeleport: (id: string) => void;
  onRitual: (k: RitualKey) => void;
  onBow: () => void;
  children?: React.ReactNode;
}

/**
 * Bottom control dock: rituals, "go to" places and time of day. Collapses to a slim bar (H).
 * Centred with an inline transform so it never drifts off-screen.
 */
export const Dock: React.FC<Props> = ({ spots, time, onTime, auto, onAuto, tour, onTour, onTeleport, onRitual, onBow, children }) => {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'rituals' | 'goto' | 'time'>('rituals');
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.key === 'h' || e.key === 'H') && !(document.activeElement instanceof HTMLInputElement) && !(document.activeElement instanceof HTMLTextAreaElement)) setOpen((o) => !o);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <div
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2 pointer-events-none"
      style={{ left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100vw - 1.5rem)' }}
    >
      <div className="pointer-events-auto">{children}</div>
      <button onClick={() => setOpen(!open)} className="pointer-events-auto flex items-center gap-1 px-3 py-1 rounded-t-xl bg-[#fbf3e2]/95 border border-b-0 border-[#d9c7a6] text-xs font-semibold text-[#4a3826] cursor-pointer" aria-expanded={open}>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        {open ? 'Hide' : 'Show controls'}
        <kbd className="hidden pointer-fine:inline ml-1 px-1 rounded border border-[#d9c7a6] text-[10px] font-sans">H</kbd>
      </button>
      {open && (
        <div className="pointer-events-auto -mt-2 w-[min(940px,calc(100vw-1.5rem))] rounded-2xl bg-[#fbf3e2]/95 backdrop-blur-md border border-[#d9c7a6] shadow-[0_10px_40px_rgba(42,20,16,0.35)] p-2 sm:p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 rounded-xl bg-[#efe3cb]" role="tablist">
              {(
                [
                  ['rituals', 'Rituals'],
                  ['goto', 'Go to'],
                  ['time', 'Time'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-semibold cursor-pointer ${tab === k ? 'bg-[#8e1b1b] text-[#fff4dc]' : 'text-[#5a4837]'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={onBow} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#c99212] bg-[#fff6e0] text-[#6b4500] text-xs sm:text-[13px] font-semibold cursor-pointer" title="Vái: bow with hands joined (B)">
              🙏 Vái <kbd className="hidden pointer-fine:inline px-1 rounded border border-[#e0c98a] text-[10px] font-sans">B</kbd>
            </button>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {tab === 'rituals' &&
              RITUALS.map((r) => (
                <button key={r.k} onClick={() => onRitual(r.k)} className="shrink-0 flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl bg-[#fffaf0] border border-[#e6d6b8] hover:border-[#8e1b1b] text-left cursor-pointer transition-colors">
                  <span className="text-lg" aria-hidden>
                    {r.icon}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-[#2a1d14] leading-tight">{r.en}</span>
                    <span className="block text-[11px] text-[#6d5b49] leading-tight">{r.vi}</span>
                  </span>
                </button>
              ))}
            {tab === 'goto' &&
              spots.map((s) => (
                <button key={s.id} onClick={() => onTeleport(s.id)} className="shrink-0 px-3 py-2 rounded-xl bg-[#fffaf0] border border-[#e6d6b8] hover:border-[#8e1b1b] text-left cursor-pointer">
                  <span className="block text-[13px] font-semibold text-[#2a1d14] leading-tight">{s.vi}</span>
                  <span className="block text-[11px] text-[#6d5b49] leading-tight whitespace-nowrap">{s.name}</span>
                </button>
              ))}
            {tab === 'time' && (
              <>
                {(
                  [
                    ['day', 'Day', Sun],
                    ['twilight', 'Dusk', Sunset],
                    ['night', 'Night', Moon],
                  ] as const
                ).map(([k, l, I]) => (
                  <button key={k} onClick={() => onTime(k)} aria-pressed={time === k} className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-semibold cursor-pointer ${time === k ? 'bg-[#2a1410] text-[#fbeed2] border-[#2a1410]' : 'bg-[#fffaf0] border-[#e6d6b8] text-[#2a1d14]'}`}>
                    <I className="w-4 h-4" /> {l}
                  </button>
                ))}
                <button onClick={onAuto} aria-pressed={auto} className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-semibold cursor-pointer ${auto ? 'bg-[#2a1410] text-[#fbeed2] border-[#2a1410]' : 'bg-[#fffaf0] border-[#e6d6b8] text-[#2a1d14]'}`}>
                  <RefreshCw className="w-4 h-4" /> Auto cycle
                </button>
                <button onClick={onTour} aria-pressed={tour} className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-semibold cursor-pointer ${tour ? 'bg-[#2a1410] text-[#fbeed2] border-[#2a1410]' : 'bg-[#fffaf0] border-[#e6d6b8] text-[#2a1d14]'}`}>
                  <Plane className="w-4 h-4" /> Bird's-eye tour
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
