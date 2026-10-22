import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { INK, S, L, InkDefs, Paper, PaperTop, CamCtx, Layer, circ, ell } from '../film/ink';
import { Person, Cloud, Waves, Mountain, Moon, Lantern, TempleFront, Throne, Bamboo, Lotus, Crane } from '../film/figures';
import { FILM_CSS } from '../film/filmCss';
import { CloudWipe, Ambient } from './LegendFilm';
import { useBackLayer } from '../services/backStack';
import { soundService } from '../services/soundService';

/**
 * The way in: an interactive Đông Hồ storybook that tells you why you're here.
 * Four prints, each with something to touch: light the lanterns, lift the four scarves,
 * strike the gong (and watch the scarves fly away), and meet Bà Thủ Từ at the gate.
 */

const SCARVES = [
  { c: INK.son, vi: 'Thiên phủ', en: 'Heaven', mother: 'Mẫu Thượng Thiên', fact: 'Red, for the sky: rain, wind, the stars. Liễu Hạnh sits here.' },
  { c: INK.green, vi: 'Nhạc phủ', en: 'Mountains & forests', mother: 'Mẫu Thượng Ngàn', fact: 'Green, for the forests and every creature in them.' },
  { c: '#f7f2e6', vi: 'Thoải phủ', en: 'Waters', mother: 'Mẫu Thoải', fact: 'White, for rivers, lakes and the sea. A daughter of the Dragon King.' },
  { c: INK.hoe, vi: 'Địa phủ', en: 'Earth', mother: 'Mẫu Địa', fact: 'Yellow, for the soil, the harvest and the ancestors.' },
];

const PAGES = [
  {
    vi: 'Phủ Vân Thủy, lúc hoàng hôn',
    en: 'Dusk on a river bend beneath the mountains. A small temple of the Mother Goddesses waits on the bank.',
    hint: 'Click the three lanterns to light them',
  },
  {
    vi: 'Bốn chiếc khăn của Tứ phủ',
    en: 'Tonight is the hầu đồng. On the altar lie four sacred scarves, one for each palace of the Mothers.',
    hint: 'Lift each scarf to see whose it is',
  },
  {
    vi: 'Đêm khăn bay đi',
    en: 'But as the gong sounded to begin, a wind came down from the four palaces…',
    hint: 'Strike the gong',
  },
  {
    vi: 'Bà Thủ Từ đang đợi',
    en: '…and the scarves were gone. The old temple keeper is waiting at the gate for someone with a sincere heart.',
    hint: 'Will you help her bring them home?',
  },
];

const Scarf: React.FC<{ x: number; y: number; c: string; s?: number; className?: string; style?: React.CSSProperties }> = ({ x, y, c, s = 1, className, style }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className={className} style={style}>
      <S d="M-70 -14Q0 -36 70 -14L64 22Q0 2 -64 22Z" f={c} tex="tx-hatch" />
      <L d="M-60 22l-4 16M-44 18l-3 16M-28 14l-2 16M-12 12l0 16M4 12l0 16M20 14l2 16M36 16l3 16M52 20l4 16" w={3} c={INK.gold} />
      <L d="M-56 -6Q0 -24 56 -6" w={2} />
    </g>
  </g>
);

export const Prologue: React.FC<{ onEnter: () => void; onClose: () => void }> = ({ onEnter, onClose }) => {
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(0);
  const [wipe, setWipe] = useState(0);
  const [lit, setLit] = useState<number[]>([]);
  const [lifted, setLifted] = useState<number[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [struck, setStruck] = useState(false);
  useBackLayer(true, onClose);

  const go = (p: number) => {
    if (p < 0 || p >= PAGES.length || p === page) return;
    setPage(p);
    setWipe((w) => w + 1);
    window.setTimeout(() => setShown(p), 1000);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (page === PAGES.length - 1) onEnter();
        else go(page + 1);
      } else if (e.key === 'ArrowLeft') go(page - 1);
      else if (e.key === 'Enter' && page === PAGES.length - 1) onEnter();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const light = (i: number) => {
    if (lit.includes(i)) return;
    setLit([...lit, i]);
    soundService.playBellChime();
  };
  const lift = (i: number) => {
    setOpen(open === i ? null : i);
    if (!lifted.includes(i)) setLifted([...lifted, i]);
    soundService.playLute([392, 440, 523.3, 587.3][i], undefined, 0.08);
  };
  const strike = () => {
    if (struck) return;
    setStruck(true);
    soundService.playTempleGong();
    window.setTimeout(() => soundService.playRumble?.(2), 600);
  };

  const P = PAGES[page];
  const allLit = lit.length === 3;
  const wash = ['#efd9ad', '#f0d3be', '#e9d6b6', '#e7c79a'][shown];

  return (
    <div className="fixed inset-0 z-[55] bg-[#0f0a08] flex flex-col text-[#fbeed2]" role="dialog" aria-label="The story so far">
      <style>{FILM_CSS}</style>
      <div className="flex items-center gap-2 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2">
        <div className="flex gap-1.5" aria-label={`Page ${page + 1} of ${PAGES.length}`}>
          {PAGES.map((_, i) => (
            <button key={i} onClick={() => go(i)} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === page ? 'w-8 bg-[#e9b84a]' : 'w-3 bg-white/25'}`} aria-label={`Page ${i + 1}`} />
          ))}
        </div>
        <button onClick={onEnter} className="ml-auto text-[13px] text-[#e8cfa0] hover:text-white underline-offset-4 hover:underline cursor-pointer">
          Skip to the temple
        </button>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-h-full drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <InkDefs />
          <g clipPath="url(#film-clip)">
            <Paper wash={wash} />
            <CamCtx.Provider value={{ x: 800, y: 450, z: 1 }}>
              <g key={shown} className="printing">
                <g className="kb">
                  {shown === 0 && (
                    <Layer>
                      <Moon x={1320} y={150} />
                      <Mountain x={260} base={560} w={600} h={330} f={INK.greenLight} />
                      <Mountain x={1360} base={560} w={620} h={380} />
                      <Cloud x={420} y={160} w={260} seed={3} className="a-drift" />
                      <Crane x={1050} y={250} s={0.45} className="a-fly" />
                      <g style={{ filter: allLit ? 'drop-shadow(0 0 24px rgba(255,200,110,.9))' : undefined, transition: 'filter 1.2s' }}>
                        <TempleFront x={800} y={640} s={0.82} name="PHỦ VÂN THỦY" />
                      </g>
                      <Bamboo x={160} base={700} h={420} lean={24} />
                      <Bamboo x={1460} base={700} h={380} lean={-18} delay={0.5} />
                      <Waves x0={-200} x1={1800} y={680} h={300} />
                      <Lotus x={300} y={760} s={0.6} />
                      <Lotus x={1240} y={770} s={0.5} />
                      {[480, 800, 1120].map((x, i) => (
                        <g key={x} onClick={() => light(i)} style={{ cursor: 'pointer' }} className="hotspot">
                          <circle cx={x} cy={330} r={70} fill="transparent" />
                          <g style={{ opacity: lit.includes(i) ? 1 : 0.45, transition: 'opacity .6s' }}>
                            <Lantern x={x} y={330} s={1.2} delay={i * 0.4} />
                          </g>
                          {!lit.includes(i) && <circle cx={x} cy={330} r={56} fill="none" stroke={INK.hoe} strokeWidth={4} strokeDasharray="8 10" className="a-spin-slow" style={{ transformOrigin: `${x}px 330px` }} />}
                        </g>
                      ))}
                    </Layer>
                  )}
                  {shown === 1 && (
                    <Layer>
                      <S d="M200 140L1400 140L1400 260L200 260Z" f={INK.sonDeep} tex="tx-swirl" />
                      <S d="M260 520L1340 520L1340 580L260 580Z" f={INK.hoe} tex="tx-hatch" />
                      <S d="M300 580L330 860M1300 580L1270 860" k={10} />
                      {[360, 1240].map((x, i) => (
                        <g key={x}>
                          <S d={`M${x - 10} 520L${x - 10} 450L${x + 10} 450L${x + 10} 520Z`} f={INK.son} k={3} />
                          <g className="a-flame" style={{ transformOrigin: `${x}px 450px`, animationDelay: `${i * 0.2}s` }}>
                            <S d={`M${x} 450Q${x - 14} 432 ${x} 404Q${x + 14} 432 ${x} 450Z`} f={INK.hoe} k={2.5} tight />
                          </g>
                        </g>
                      ))}
                      {SCARVES.map((sc, i) => {
                        const x = 500 + i * 200;
                        const up = open === i;
                        return (
                          <g key={sc.vi} onClick={() => lift(i)} style={{ cursor: 'pointer' }}>
                            <rect x={x - 90} y={420} width={180} height={120} fill="transparent" />
                            <g style={{ transform: up ? 'translateY(-70px)' : 'none', transition: 'transform .6s cubic-bezier(.2,1.4,.4,1)' }}>
                              <Scarf x={x} y={500} c={sc.c} />
                            </g>
                            {!lifted.includes(i) && <text x={x} y={600} textAnchor="middle" fontSize={22} fill={INK.key} fontFamily="'Noto Serif', serif" className="a-bob">
                              ✦
                            </text>}
                          </g>
                        );
                      })}
                      {open !== null && (
                        <g key={open} className="a-pop">
                          <S d={circ(1300, 360, 130)} f={INK.diep} k={6} />
                          <L d={circ(1300, 360, 116)} w={2.5} />
                          <Throne x={1300} y={450} s={0.38} />
                          <Person x={1300} y={450} s={0.38} seated robe={SCARVES[open].c} accent={open === 3 ? INK.son : INK.hoe} head="crown" />
                        </g>
                      )}
                      <text x={800} y={215} textAnchor="middle" fontSize={40} fontWeight={700} fontStyle="italic" fill={INK.hoeLight} fontFamily="'Noto Serif', serif">
                        Tứ phủ · {lifted.length}/4
                      </text>
                    </Layer>
                  )}
                  {shown === 2 && (
                    <Layer>
                      <Mountain x={260} base={620} w={560} h={360} />
                      <Mountain x={1340} base={620} w={560} h={300} f={INK.greenLight} />
                      <Waves x0={900} x1={1800} y={640} h={300} />
                      <S d="M-100 640L900 640L900 1000L-100 1000Z" f={INK.hoe} tex="tx-grass" k={0} />
                      <Cloud x={260} y={130} w={300} seed={21} className="a-drift" />
                      <g onClick={strike} style={{ cursor: struck ? 'default' : 'pointer' }}>
                        <L d="M700 300L700 640M900 300L900 640M680 300L920 300" w={12} />
                        <g className={struck ? 'a-drum' : ''}>
                          <S d={circ(800, 470, 110)} f={INK.gold} tex="tx-rings" />
                          <S d={circ(800, 470, 34)} f={INK.son} k={3} />
                        </g>
                        {!struck && <circle cx={800} cy={470} r={130} fill="none" stroke={INK.son} strokeWidth={5} strokeDasharray="10 12" className="a-spin-slow" style={{ transformOrigin: '800px 470px' }} />}
                      </g>
                      {SCARVES.map((sc, i) => {
                        const to = [
                          [-120, -560],
                          [-560, -180],
                          [560, 200],
                          [-260, 360],
                        ][i];
                        return (
                          <g key={sc.vi} className={struck ? 'scarf-fly' : ''} style={{ ['--tx' as string]: `${to[0]}px`, ['--ty' as string]: `${to[1]}px`, animationDelay: `${0.6 + i * 0.25}s` } as React.CSSProperties}>
                            <Scarf x={650 + i * 100} y={700} c={sc.c} s={0.6} />
                          </g>
                        );
                      })}
                      {struck &&
                        [
                          [800, 120, 'to Heaven'],
                          [250, 380, 'to the mountains'],
                          [1350, 760, 'to the waters'],
                          [430, 820, 'into the earth'],
                        ].map(([x, y, t], i) => (
                          <text key={i} x={x as number} y={y as number} textAnchor="middle" fontSize={28} fontStyle="italic" fontWeight={700} fill={INK.key} fontFamily="'Noto Serif', serif" className="fade-late" style={{ animationDelay: `${1.8 + i * 0.3}s` }}>
                            {t}
                          </text>
                        ))}
                    </Layer>
                  )}
                  {shown === 3 && (
                    <Layer>
                      <Moon x={1320} y={140} />
                      <TempleFront x={820} y={760} s={0.95} name="PHỦ VÂN THỦY" />
                      <Lantern x={460} y={330} s={1} />
                      <Lantern x={1180} y={330} s={1} delay={0.5} />
                      <S d={ell(560, 860, 160, 20)} f={INK.gray} k={0} opacity={0.35} />
                      <Person x={560} y={860} s={0.9} robe={INK.brown} accent={INK.cham} sash={INK.cham} pose="wave" />
                      <g className="a-hover">
                        <circle cx={430} cy={560} r={14} fill="url(#glow-gold)" />
                        <circle cx={430} cy={560} r={4} fill="#fff6d0" />
                      </g>
                      {SCARVES.map((sc, i) => (
                        <g key={sc.vi} transform={`translate(${1040 + i * 120} ${880})`} opacity={0.35}>
                          <Scarf x={0} y={0} c={sc.c} s={0.45} />
                        </g>
                      ))}
                    </Layer>
                  )}
                </g>
              </g>
            </CamCtx.Provider>
            <Ambient kind={shown === 2 ? 'petals' : 'motes'} key={`amb${shown}`} />
            <PaperTop dim={shown === 3 ? 0.08 : 0} />
            {wipe > 0 && <CloudWipe key={wipe} />}
          </g>
        </svg>
      </div>

      {/* the storyteller's words */}
      <div className="px-4 pt-2 pb-[max(0.8rem,env(safe-area-inset-bottom))] flex flex-col items-center text-center gap-2">
        <div className="dh-title text-lg sm:text-2xl text-[#f3d9a0]">{P.vi}</div>
        <p className="max-w-2xl text-[14px] sm:text-[16px] leading-snug">{P.en}</p>
        {page === 1 && open !== null && (
          <p className="max-w-xl text-[13px] text-[#e9c98a]">
            <b>{SCARVES[open].vi}</b> · {SCARVES[open].en} · {SCARVES[open].mother}: {SCARVES[open].fact}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <button onClick={() => go(page - 1)} disabled={page === 0} className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer" aria-label="Previous page">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[12px] italic text-[#c9b48a] min-w-[14rem]">✦ {P.hint}</span>
          {page < PAGES.length - 1 ? (
            <button onClick={() => go(page + 1)} className="p-2 rounded-full bg-[#8e1b1b] hover:bg-[#a5251f] cursor-pointer" aria-label="Next page" title="Next (→ or Space)">
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={onEnter} className="px-5 py-2.5 rounded-md dh-seal font-semibold cursor-pointer">
              Enter the temple
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
