import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useBackLayer } from '../services/backStack';
import { soundService } from '../services/soundService';
import type { GiaLook } from '../three/living';

/**
 * Hầu đồng, seen from a mat at the side of the hall, in the 3D temple itself.
 * The medium receives the spirits one after another (each a "giá"), each in their own colours.
 * Keep the beat with the phách (bamboo clapper) and the spirit's aura blooms in the hall;
 * miss and it grows quieter. There is no failing, and you can just watch.
 * This component is only the light overlay: the ceremony itself happens in the scene.
 */

export interface CeremonyControl {
  setGia: (i: number, look: GiaLook) => void;
  setEnergy: (e: number) => void;
  burst: () => void;
  scatterLoc: () => void;
}

interface Gia {
  vi: string;
  en: string;
  about: string;
  look: GiaLook;
  css: string;
  bpm: number;
  beats: number;
  /** eighth-notes of one bar (8 chars): x = a beat to keep */
  pattern: string;
  melody: number[];
}

const SCALE = [261.6, 293.7, 349.2, 392.0, 440.0, 523.3, 587.3, 698.5];
const GIA: Gia[] = [
  {
    vi: 'Mẫu giáng',
    en: 'The Mother descends',
    about: 'The Mother comes first, only for a moment and always veiled. No dance: only her blessing on the hall.',
    look: { robe: 0xc81e1e, under: 0xe8b830, aura: 0xff6b4a, prop: 'none', veiled: true, dance: 'still' },
    css: '#ff6b4a',
    bpm: 72,
    beats: 12,
    pattern: 'x...x...',
    melody: [0, 2, 3, 2, 3, 4, 3, 2],
  },
  {
    vi: 'Quan Lớn Đệ Tam',
    en: 'The Third Mandarin of the Waters',
    about: 'A warrior-mandarin of the Water Palace in white, who dances with a sword to drive away evil.',
    look: { robe: 0xf3efe4, under: 0x2f5a8a, aura: 0xbfe3ff, prop: 'sword', veiled: false, dance: 'stride' },
    css: '#bfe3ff',
    bpm: 96,
    beats: 24,
    pattern: 'x.x.x.x.',
    melody: [4, 5, 4, 3, 2, 3, 0, 2],
  },
  {
    vi: 'Chầu Đệ Nhị Thượng Ngàn',
    en: 'The Second Lady of the Forest',
    about: 'A lady of the mountains and forests in green, turning with her fans like leaves in the wind.',
    look: { robe: 0x3f8a3a, under: 0xe8b830, aura: 0x7dffa0, prop: 'fans', veiled: false, dance: 'spin' },
    css: '#7dffa0',
    bpm: 104,
    beats: 24,
    pattern: 'x.xx.x.x',
    melody: [3, 4, 6, 5, 4, 3, 4, 2],
  },
  {
    vi: 'Ông Hoàng Mười',
    en: 'The Tenth Prince',
    about: 'The poet-prince of Nghệ An in gold. He sips rice wine, recites verses and showers everyone with lộc.',
    look: { robe: 0xe8b830, under: 0xc81e1e, aura: 0xffd84a, prop: 'cup', veiled: false, dance: 'sway' },
    css: '#ffd84a',
    bpm: 112,
    beats: 24,
    pattern: 'x.x.xx.x',
    melody: [2, 3, 2, 0, 1, 2, 4, 3],
  },
  {
    vi: 'Cô Bé Thượng Ngàn',
    en: 'The Little Forest Maiden',
    about: 'The youngest spirit, mischievous and sweet, skipping in with baskets of flowers.',
    look: { robe: 0x8db27a, under: 0xe7a28f, aura: 0xff9ad6, prop: 'baskets', veiled: false, dance: 'skip' },
    css: '#ff9ad6',
    bpm: 120,
    beats: 24,
    pattern: 'xx.xx.x.',
    melody: [5, 4, 5, 6, 5, 4, 3, 4],
  },
];

/** the game's clock (seconds); audio is scheduled relative to it */
const clk = () => performance.now() / 1000;
const TRAVEL = 1.9;
const VEILED: GiaLook = { robe: 0xc81e1e, under: 0xe8b830, aura: 0xffb070, prop: 'none', veiled: true, dance: 'still' };

interface Note {
  t: number;
  side: -1 | 1;
  state: 'live' | 'hit' | 'miss';
}

export const HauDongSight: React.FC<{ ctl: CeremonyControl; onClose: () => void; onBlessed: (share: number) => void }> = ({ ctl, onClose, onBlessed }) => {
  const [phase, setPhase] = useState<'intro' | 'card' | 'play' | 'end'>('intro');
  const [gi, setGi] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [watchOnly, setWatchOnly] = useState(false);
  const [flash, setFlash] = useState<{ id: number; text: string } | null>(null);
  const energyRef = useRef(0);
  const total = useRef({ hit: 0, all: 0 });
  const notes = useRef<Note[]>([]);
  const noteEls = useRef<(HTMLDivElement | null)[]>([]);
  const giaEnd = useRef(0);
  const raf = useRef(0);
  const fid = useRef(0);
  useBackLayer(true, onClose);

  const gia = GIA[gi];
  const addEnergy = (d: number) => {
    energyRef.current = Math.max(0, Math.min(1, energyRef.current + d));
    ctl.setEnergy(energyRef.current);
  };

  useEffect(() => {
    ctl.setGia(0, VEILED);
    ctl.setEnergy(0.15);
  }, [ctl]);

  /** schedule one giá's music and beats */
  const startGia = useCallback(
    (i: number) => {
      const g = GIA[i];
      ctl.setGia(i, g.look);
      const beat = 60 / g.bpm, eighth = beat / 2;
      const g0 = clk(), a0 = soundService.audioTime;
      const toAudio = (t: number) => a0 + (t - g0);
      const t0 = g0 + TRAVEL + 0.2;
      const list: Note[] = [];
      for (let e = 0; e < g.beats * 2; e++) {
        const at = t0 + e * eighth;
        const inBar = e % 8;
        if (e % 2 === 0) soundService.phach(toAudio(at), inBar === 0);
        if (inBar === 0 || inBar === 4) soundService.drum(toAudio(at));
        if (e % 2 === 0) soundService.playLute(SCALE[g.melody[(e / 2) % g.melody.length]], toAudio(at), 0.09);
        if (g.pattern[inBar] === 'x') list.push({ t: at, side: list.length % 2 ? 1 : -1, state: 'live' });
      }
      notes.current = list;
      total.current.all += list.length;
      giaEnd.current = t0 + g.beats * beat + 0.6;
      setPhase('play');
    },
    [ctl],
  );

  const judge = useCallback(() => {
    if (phase !== 'play' || watchOnly) return;
    const now = clk();
    let best: Note | null = null, bd = 9;
    for (const n of notes.current) {
      if (n.state !== 'live') continue;
      const d = Math.abs(n.t - now);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    if (best && bd < 0.17) {
      best.state = 'hit';
      total.current.hit++;
      const perfect = bd < 0.075;
      addEnergy(perfect ? 0.085 : 0.055);
      ctl.burst();
      soundService.sparkle(soundService.audioTime, perfect ? 1568 : 1318);
      setFlash({ id: ++fid.current, text: perfect ? 'Linh!' : 'Đẹp' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, watchOnly, ctl]);

  // the loop: move the beats, notice the missed ones, let the aura breathe
  useEffect(() => {
    if (phase !== 'play') return;
    const tick = () => {
      const now = clk();
      notes.current.forEach((n, i) => {
        if (watchOnly && n.state === 'live' && now >= n.t) {
          n.state = 'hit';
          total.current.hit++;
          addEnergy(0.05);
          if (i % 2 === 0) ctl.burst();
        }
        if (n.state === 'live' && now - n.t > 0.2) {
          n.state = 'miss';
          addEnergy(-0.02);
        }
        const el = noteEls.current[i];
        if (!el) return;
        const k = (n.t - now) / TRAVEL;
        el.style.transform = `translateX(${n.side * k * 46}vw)`;
        el.style.opacity = n.state === 'live' && k <= 1 ? '1' : '0';
      });
      energyRef.current = Math.max(0, energyRef.current - 0.0006);
      ctl.setEnergy(energyRef.current);
      setEnergy(energyRef.current);
      if (now > giaEnd.current) {
        if (gi + 1 < GIA.length) {
          setGi(gi + 1);
          setPhase('card');
        } else setPhase('end');
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, gi, watchOnly]);

  // between spirits: the veil falls over the medium, a new name, then the music returns
  useEffect(() => {
    if (phase !== 'card') return;
    ctl.setGia(gi, VEILED);
    soundService.playTempleGong();
    const t = window.setTimeout(() => startGia(gi), 3400);
    return () => clearTimeout(t);
  }, [phase, gi, startGia, ctl]);

  useEffect(() => {
    if (phase !== 'end') return;
    ctl.scatterLoc();
    soundService.playBellChime();
    onBlessed(total.current.all ? total.current.hit / total.current.all : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const begin = (watch: boolean) => {
    setWatchOnly(watch);
    void soundService.audioTime; // wake the audio on this gesture
    setGi(0);
    setPhase('card');
  };

  // keys: Space / Enter / J / F / K keep the beat
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if ([' ', 'Enter', 'j', 'J', 'f', 'F', 'k', 'K'].includes(e.key)) {
        e.preventDefault();
        if (phase === 'intro') begin(false);
        else judge();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const share = total.current.all ? Math.round((total.current.hit / total.current.all) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[45] select-none" onPointerDown={() => phase === 'play' && judge()} role="dialog" aria-label="Hầu đồng">
      <style>{SIGHT_CSS}</style>
      {/* soft vignette, the hall stays visible */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(15,10,8,.7)_100%)]" />

      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 flex items-start gap-2">
        <div className="dh-paper rounded-md px-3 py-1.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#8f2a21] font-semibold">
            Hầu đồng · giá {Math.min(gi + 1, GIA.length)}/{GIA.length}
          </div>
          <div className="text-sm dh-title leading-tight">
            {phase === 'intro' ? 'The medium waits beneath the veil' : gia.vi}
            {phase !== 'intro' && <span className="font-normal italic text-[#5a4837]"> · {gia.en}</span>}
          </div>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="ml-auto px-3 py-2 rounded-md dh-paper text-[13px] font-semibold cursor-pointer flex items-center gap-1.5"
          title="Stand up and leave quietly (Esc)"
        >
          <X className="w-4 h-4" /> Leave quietly
        </button>
      </div>

      {phase === 'intro' && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="dh-paper rounded-md p-6 max-w-md text-center text-[#211a15] giacard" onPointerDown={(e) => e.stopPropagation()}>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#8f2a21] font-semibold">You kneel at the side of the mat</div>
            <h2 className="dh-title text-3xl mt-1">Hầu đồng</h2>
            <p className="mt-2 text-[14px] leading-relaxed">
              The medium is about to receive the spirits, one after another, each in their own colours. Keep the beat with the <b>phách</b> (the bamboo clapper) and
              their aura blooms through the hall. Miss a beat and it simply grows quieter.
            </p>
            <p className="mt-2 text-[12px] text-[#5a4837]">Space, Enter or click when a beat reaches the red drum.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <button onClick={() => begin(false)} className="px-5 py-2.5 rounded-md dh-seal font-semibold cursor-pointer">
                Keep the beat
              </button>
              <button onClick={() => begin(true)} className="px-4 py-2.5 rounded-md border-2 border-[#211a15] font-semibold cursor-pointer hover:bg-[#efe3c8]">
                Just watch
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'card' && (
        <div className="absolute inset-x-0 top-[16%] flex justify-center pointer-events-none px-4">
          <div key={gi} className="dh-paper rounded-md px-6 py-4 text-center text-[#211a15] max-w-lg giacard" style={{ boxShadow: `0 0 50px ${gia.css}` }}>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#8f2a21] font-semibold">The veil falls · giá {gi + 1}</div>
            <div className="dh-title text-2xl sm:text-3xl mt-1">{gia.vi}</div>
            <div className="italic text-sm">{gia.en}</div>
            <p className="mt-2 text-[13px] leading-snug">{gia.about}</p>
          </div>
        </div>
      )}

      {phase === 'end' && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="dh-paper rounded-md p-6 max-w-md text-center text-[#211a15] giacard" onPointerDown={(e) => e.stopPropagation()}>
            <h2 className="dh-title text-2xl">The medium scatters lộc</h2>
            <p className="mt-2 text-[14px] leading-relaxed">
              {share >= 70 ? 'The whole hall felt you keeping the beat. The spirits leave smiling.' : share >= 35 ? 'You sat with the music, and the spirits noticed.' : 'You watched quietly from the side. That, too, is an offering.'}
            </p>
            <div className="mt-2 text-[12px] text-[#5a4837]">Spirit energy shared: {share}%</div>
            <button onClick={onClose} className="mt-4 px-5 py-2.5 rounded-md dh-seal font-semibold cursor-pointer">
              Leave quietly
            </button>
          </div>
        </div>
      )}

      {/* the beat lane */}
      {phase === 'play' && (
        <div className="absolute inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] h-16 pointer-events-none">
          <div className="absolute inset-x-[3vw] top-1/2 -translate-y-1/2 h-11 rounded-full bg-[#140b08]/55 border border-[#f3ead6]/20" />
          {notes.current.map((_, i) => (
            <div
              key={`${gi}-${i}`}
              ref={(el) => {
                noteEls.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2 -ml-[15px] -mt-[15px] w-[30px] h-[30px] rounded-full border-[3px] border-[#211a15]"
              style={{ background: gia.css, opacity: 0 }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full dh-seal flex items-center justify-center text-[13px] font-bold">phách</div>
          {flash && (
            <div key={flash.id} className="absolute left-1/2 -top-10 dh-title text-2xl text-[#fff1c4] beat-flash" style={{ textShadow: `0 0 18px ${gia.css}` }}>
              {flash.text}
            </div>
          )}
        </div>
      )}

      {/* energy */}
      {phase !== 'intro' && (
        <div className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center gap-3 px-6 pointer-events-none">
          <span className="text-[12px] text-[#f3d9a0] dh-title">Linh khí</span>
          <div className="flex-1 h-2.5 rounded-full bg-[#140b08]/60 overflow-hidden border border-[#f3ead6]/20">
            <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.round(energy * 100)}%`, background: gia.css, boxShadow: `0 0 12px ${gia.css}` }} />
          </div>
          <span className="text-[12px] text-[#f3d9a0] hidden sm:block">{watchOnly ? 'Just watching' : 'Space / click on the beat'}</span>
        </div>
      )}
    </div>
  );
};

const SIGHT_CSS = `
.giacard { animation: festIn .8s cubic-bezier(.2,1.4,.4,1) both; }
.beat-flash { animation: beatflash .6s ease-out both; }
@keyframes beatflash { from { opacity: 1; transform: translate(-50%, 0) scale(.8) } to { opacity: 0; transform: translate(-50%, -24px) scale(1.2) } }
`;
