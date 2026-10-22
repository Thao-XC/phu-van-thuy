import React, { useEffect } from 'react';
import { KhanArt } from './LocArt';
import { PALACES } from '../data/story';
import { useStory, storyService } from '../services/storyService';
import { luckService } from '../services/luckService';

/** Hanging red lantern, drawn in SVG */
const Lantern: React.FC<{ x: string; delay: number; s?: number }> = ({ x, delay, s = 1 }) => (
  <div className="absolute top-0 drift pointer-events-none" style={{ left: x, animationDelay: `${delay}s`, transform: `scale(${s})` }} aria-hidden>
    <svg width="46" height="120" viewBox="0 0 46 120">
      <line x1="23" y1="0" x2="23" y2="40" stroke="#c99212" strokeWidth="1.4" />
      <rect x="15" y="38" width="16" height="5" rx="1" fill="#c99212" />
      <ellipse cx="23" cy="62" rx="20" ry="19" fill="#c81e1e" />
      <ellipse cx="23" cy="62" rx="20" ry="19" fill="url(#lg)" />
      <path d="M8 62H38M10 54H36M10 70H36" stroke="#8e1b1b" strokeWidth="0.8" opacity="0.6" />
      <rect x="15" y="80" width="16" height="5" rx="1" fill="#c99212" />
      <path d="M23 85V108M19 87L17 104M27 87L29 104" stroke="#f2c14e" strokeWidth="1.4" strokeLinecap="round" />
      <defs>
        <radialGradient id="lg" cx="40%" cy="40%" r="65%">
          <stop offset="0" stopColor="#ffd07a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffd07a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

export const Landing: React.FC<{ onEnter: () => void; onWatch: () => void }> = ({ onEnter, onWatch }) => {
  // keyboard: Enter goes in
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !document.querySelector('[role=dialog]') && document.activeElement === document.body) onEnter();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onEnter]);
  const story = useStory();
  const begun = story.started || story.khan.length > 0;
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#5a1a14_0%,#2a1410_55%,#160a08_100%)] text-[#fbeed2]">
      {/* faint karst silhouettes */}
      <svg className="absolute bottom-0 left-0 w-full h-[45vh] opacity-40 pointer-events-none" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
        <path d="M0 120V80Q10 40 22 70Q30 20 44 60Q52 30 64 66Q80 10 96 62Q106 50 114 74Q130 30 146 70Q160 40 172 80Q190 20 208 66Q220 50 230 76Q246 26 262 64Q276 40 288 78Q304 30 320 66Q332 50 344 74Q360 24 376 68Q388 50 400 72V120Z" fill="#0f0705" />
        <path d="M0 120V96Q60 88 120 96T240 94T400 98V120Z" fill="#1d3a36" opacity="0.8" />
      </svg>
      <Lantern x="6%" delay={0} s={0.9} />
      <Lantern x="18%" delay={1.4} s={0.7} />
      <Lantern x="78%" delay={0.7} s={0.8} />
      <Lantern x="90%" delay={2.1} s={1} />

      <main className="relative min-h-full flex flex-col items-center justify-center px-5 py-16 text-center">
        <div className="text-[#e9b84a] text-xs sm:text-sm uppercase tracking-[0.35em] pl-[0.35em] font-semibold">Đền Mẫu · A Mother Goddess temple</div>
        <h1 className="font-display font-bold text-5xl sm:text-7xl mt-2 text-[#fff4dc] drop-shadow-[0_2px_20px_rgba(233,184,74,0.35)]">Phủ Vân Thủy</h1>
        <p className="mt-3 font-display italic text-lg sm:text-xl text-[#f2d9a8]">The Cloud & Water Shrine</p>

        <div className="mt-8 flex gap-3 sm:gap-4" aria-label="The four scarves">
          {PALACES.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <KhanArt color={p.color} size={54} dim={begun && !story.khan.includes(p.id)} />
              <span className="text-[11px] text-[#e8cfa0]">{p.vi.split(' ·')[0]}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-xl text-[15px] sm:text-base leading-relaxed text-[#f3e3c3]">
          Dusk on a river bend beneath the karst mountains. Tonight the temple should hold a <i>hầu đồng</i>, but the four sacred scarves have
          vanished into the Four Palaces of Heaven, Mountains & Forests, Water and Earth. The temple keeper is waiting for someone with a sincere heart.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
          <button onClick={onEnter} className="px-8 py-3.5 rounded-2xl bg-[#c99212] hover:bg-[#dba51e] text-[#2a1410] font-bold text-base shadow-[0_8px_30px_rgba(201,146,18,0.35)] cursor-pointer transition-colors">
            {begun ? `Continue · ${story.khan.length} of 4 scarves` : 'Enter the temple'}
            <kbd className="hidden pointer-fine:inline ml-2 px-1.5 rounded border border-[#2a1410]/30 text-[11px] font-sans font-semibold">Enter</kbd>
          </button>
          <button onClick={onWatch} className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#e9b84a]/60 text-[#fbeed2] hover:bg-white/10 font-semibold cursor-pointer">
            <span className="w-6 h-6 rounded-full bg-[#8e1b1b] flex items-center justify-center text-[11px]">▶</span>
            Watch the legend of the Mothers
          </button>
          {begun && (
            <button
              onClick={() => {
                if (confirm('Start the story again? Your scarves, pouch, phúc and journal will be cleared.')) {
                  storyService.reset();
                  luckService.reset();
                }
              }}
              className="px-4 py-2 rounded-xl text-sm text-[#e8cfa0] hover:text-white underline-offset-4 hover:underline cursor-pointer"
            >
              Start over
            </button>
          )}
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-3 max-w-3xl w-full text-left text-[13px]">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-semibold text-[#f2c14e]">Move</div>
            <p className="text-[#e8d6b4] mt-0.5">↑ ↓ walk, ← → turn, click the view to look with the mouse, click golden markers to travel. Shift hurries (not in the temple!). Phones get a joystick.</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-semibold text-[#f2c14e]">Mind your manners</div>
            <p className="text-[#e8d6b4] mt-0.5">Real temple etiquette counts. Good manners build phúc (blessings); careless ones lose it.</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-semibold text-[#f2c14e]">Back out anytime</div>
            <p className="text-[#e8d6b4] mt-0.5">Esc, your browser's back button or Android's back gesture always step back one level.</p>
          </div>
        </div>

        <p className="mt-10 max-w-xl text-[12px] leading-relaxed text-[#c9b08a]">
          Phủ Vân Thủy is a fictional temple, made with respect for Đạo Mẫu, the Vietnamese worship of the Mother Goddesses of the Four Palaces, whose rituals UNESCO
          recognised as Intangible Cultural Heritage in 2016. The legends are retold from tradition; the fortune verses are written for this temple.
        </p>
      </main>
    </div>
  );
};
