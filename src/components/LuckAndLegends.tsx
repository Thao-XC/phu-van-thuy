import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Sparkles, ScrollText } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { luckService, luckLabel, TOTAL_SECRETS, type LuckEvent } from '../services/luckService';
import { soundService } from '../services/soundService';
import type { StoryCard } from '../three/encounters/types';

export function useLuck() {
  return useSyncExternalStore(luckService.subscribe, luckService.get, luckService.get);
}

/* ------------------------------------------------------------------ */
/* Luck chip for the top bars                                          */
/* ------------------------------------------------------------------ */
export const LuckChip: React.FC<{ onClick: () => void; compact?: boolean }> = ({ onClick, compact }) => {
  const { value } = useLuck();
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);
  useEffect(
    () =>
      luckService.onEvent((e) => {
        setPulse(e.delta > 0 ? 'up' : 'down');
        setTimeout(() => setPulse(null), 900);
      }),
    []
  );
  const label = luckLabel(value);
  return (
    <button
      onClick={onClick}
      title={`Phúc (blessings): ${value}/100, ${label.en}`}
      aria-label={`Phúc ${value} of 100`}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#fbf8f0]/95 hover:bg-[#f3ebd7] border text-xs font-semibold shadow-md transition-all cursor-pointer ${
        pulse === 'up' ? 'border-[#15803d] scale-105' : pulse === 'down' ? 'border-[#b91c1c] scale-95' : 'border-[#d8cabb]'
      }`}
    >
      <span className="font-han text-[#8e1b1b] text-sm leading-none">福</span>
      <span className="tabular-nums text-[#2a1d14]">{value}</span>
      {!compact && <span className="hidden md:inline text-[11px] text-[#6d5b49] font-normal">{label.en}</span>}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Floating +/- luck notes                                             */
/* ------------------------------------------------------------------ */
export const LuckToasts: React.FC = () => {
  const [items, setItems] = useState<LuckEvent[]>([]);
  useEffect(
    () =>
      luckService.onEvent((e) => {
        soundService.playLuck(e.delta > 0);
        setItems((prev) => [e, ...prev].slice(0, 3));
        setTimeout(() => setItems((prev) => prev.filter((p) => p.id !== e.id)), 4200);
      }),
    []
  );
  if (!items.length) return null;
  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[45] flex flex-col items-center gap-1.5 pointer-events-none w-[min(92vw,440px)]">
      {items.map((e) => (
        <div
          key={e.id}
          className={`sheet-panel flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg text-xs sm:text-[13px] bg-[#fbf7ef]/95 backdrop-blur ${
            e.delta > 0 ? 'border-[#9ccbb0]' : 'border-[#e8b4a8]'
          }`}
        >
          <span className={`font-bold tabular-nums shrink-0 ${e.delta > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
            {e.delta > 0 ? '+' : '−'}
            {Math.abs(e.delta)} phúc
          </span>
          <span className="text-[#4a3c2e] leading-snug">{e.reason}</span>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Subtitle-style captions for legends and hints                       */
/* ------------------------------------------------------------------ */
export const CaptionBar: React.FC<{ text: string | null }> = ({ text }) => {
  if (!text) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(50%-10px)] sm:bottom-44 z-[41] pointer-events-none w-[min(92vw,620px)] text-center">
      <span
        key={text}
        className="sheet-fade inline-block px-4 py-2 rounded-xl bg-[#1c1712]/70 text-[#fbf3e3] font-kanji text-sm sm:text-base leading-relaxed shadow-lg backdrop-blur-sm"
      >
        {text}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Legend / secret card                                                */
/* ------------------------------------------------------------------ */
export const StoryCardSheet: React.FC<{ card: StoryCard; luck: number; firstTime: boolean; onClose: () => void }> = ({ card, luck, firstTime, onClose }) => {
  const { found } = useLuck();
  return (
    <Sheet onClose={onClose} size="md" label={card.title} className="px-5 sm:px-7 pt-4 sm:pt-7">
      <div className="text-center pr-6 sm:pr-0">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fbeedd] border border-[#d6b98c] text-[#9a3412] text-[11px] font-semibold">
          <ScrollText className="w-3.5 h-3.5" />
          Discovery · {found.length} of {TOTAL_SECRETS}
        </div>
        <h2 className="mt-3 text-xl sm:text-2xl font-display font-bold text-[#2c241c]">{card.title}</h2>
        <div className="font-han text-[#8e1b1b] text-sm mt-0.5">{card.jp}</div>
      </div>
      <p className="mt-4 text-sm italic text-[#5a4837] text-center font-display">{card.ending}</p>
      <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#2c241c]">
        {card.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-[#e3d6c0]">
        <span className={`text-sm font-semibold ${firstTime && luck > 0 ? 'text-[#15803d]' : 'text-[#8a7762]'}`}>
          {firstTime && luck > 0 ? `+${luck} phúc for discovering this` : 'Already in your journal'}
        </span>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#a3170f] text-white text-sm font-semibold cursor-pointer"
        >
          Continue
        </button>
      </div>
    </Sheet>
  );
};

/* ------------------------------------------------------------------ */
/* Luck explained                                                      */
/* ------------------------------------------------------------------ */
export const LuckSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { value, history, found } = useLuck();
  const label = luckLabel(value);
  return (
    <Sheet onClose={onClose} size="md" label="Phúc" className="px-5 sm:px-7 pt-4 sm:pt-7">
      <div className="flex items-center gap-4 pr-8">
        <div className="w-16 h-16 rounded-2xl bg-[#fbeedd] border border-[#d6b98c] flex flex-col items-center justify-center shrink-0">
          <span className="font-han text-[#8e1b1b] text-xl leading-none">福</span>
          <span className="font-bold tabular-nums text-[#2c241c]">{value}</span>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-[#2c241c]">Your phúc</h2>
          <p className="text-sm text-[#5a4837]">
            {label.jp} · {label.en} · {found.length} of {TOTAL_SECRETS} discoveries
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[#ece2cf] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#c99212] to-[#8e1b1b] transition-all" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-3 text-[13px] text-[#4a3c2e]">
        Phúc (福) means blessings, the good you build up by how you live. Here it tilts the fortune sticks: the more phúc, the better your odds.
      </p>

      <div className="mt-5 grid sm:grid-cols-2 gap-3 text-[13px]">
        <div className="p-3 rounded-xl bg-[#e6f3ea] border border-[#9ccbb0]">
          <div className="font-semibold text-[#15803d] mb-1.5">Builds phúc</div>
          <ul className="space-y-1 text-[#2c241c] list-disc pl-4">
            <li>Vái (bow with joined hands) at the gate</li>
            <li>Lighting incense in odd numbers</li>
            <li>Praying sincerely at the altar</li>
            <li>Writing and burning a petition</li>
            <li>Discovering secrets and the realms</li>
          </ul>
        </div>
        <div className="p-3 rounded-xl bg-[#fdecea] border border-[#e8b4a8]">
          <div className="font-semibold text-[#b91c1c] mb-1.5">Loses phúc</div>
          <ul className="space-y-1 text-[#2c241c] list-disc pl-4">
            <li>Using the central gate or door (they are for the gods)</li>
            <li>Standing on a threshold</li>
            <li>Running in the temple grounds</li>
            <li>Going up to the altar</li>
            <li>Even numbers of incense sticks</li>
            <li>Hoarding lộc that should be shared</li>
          </ul>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6d5b49] mb-2">Recently</div>
          <ul className="space-y-1.5">
            {history.slice(0, 8).map((e) => (
              <li key={e.id + '-' + e.at} className="flex gap-2 text-[13px]">
                <span className={`font-bold tabular-nums w-10 shrink-0 ${e.delta > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
                  {e.delta > 0 ? '+' : '−'}
                  {Math.abs(e.delta)}
                </span>
                <span className="text-[#4a3c2e]">{e.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-5 flex items-center gap-2 text-[12px] text-[#6d5b49]">
        <Sparkles className="w-3.5 h-3.5 text-[#c99212]" />
        Some things only show themselves after dark.
      </div>
    </Sheet>
  );
};
