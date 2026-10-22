import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { INK, S, L, InkDefs, Paper, PaperTop, circ, ell } from '../film/ink';
import { Candle, Lotus, Cloud } from '../film/figures';
import { FILM_CSS } from '../film/filmCss';
import { useBackLayer } from '../services/backStack';
import { soundService } from '../services/soundService';
import { CoinToss, XamSlip, drawXam } from './Rituals';
import type { Xam, QueResult } from '../data/rituals';

/**
 * Full-screen rituals, drawn as Đông Hồ prints and done with your own hands:
 * offering incense (pick, light, raise, bow, plant) and asking the fortune sticks (shake!).
 */

const Frame: React.FC<{ title: string; vi: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; wash?: string; onPointerDown?: (e: React.PointerEvent) => void; onPointerUp?: () => void; onPointerMove?: (e: React.PointerEvent) => void }> = ({
  title,
  vi,
  onClose,
  children,
  footer,
  wash = '#efd9ad',
  ...ptr
}) => {
  useBackLayer(true, onClose);
  return (
    <div className="fixed inset-0 z-[58] bg-[#0f0a08] flex flex-col text-[#fbeed2] select-none" role="dialog" aria-label={title}>
      <style>{FILM_CSS + STAGE_CSS}</style>
      <div className="flex items-center gap-2 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#e9b84a] font-semibold">{vi}</div>
          <div className="text-sm font-display">{title}</div>
        </div>
        <button onClick={onClose} className="ml-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Close" title="Close (Esc)">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 touch-none" {...ptr}>
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-h-full drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <InkDefs />
          <g clipPath="url(#film-clip)">
            <Paper wash={wash} />
            <g className="printing">{children}</g>
            <PaperTop />
          </g>
        </svg>
      </div>
      <div className="px-4 pt-2 pb-[max(0.9rem,env(safe-area-inset-bottom))] flex flex-col items-center text-center gap-2 min-h-[7.5rem] justify-center">{footer}</div>
    </div>
  );
};

/* ================================================================== */
/* Thắp hương                                                          */
/* ================================================================== */
type IStep = 'pick' | 'light' | 'pray' | 'place' | 'done';

export const IncenseRitual: React.FC<{ onClose: () => void; onDone: (sticks: number) => void }> = ({ onClose, onDone }) => {
  const [step, setStep] = useState<IStep>('pick');
  const [n, setN] = useState(0);
  const [glow, setGlow] = useState(0);
  const [holding, setHolding] = useState(false);
  const [bows, setBows] = useState(0);
  const [planted, setPlanted] = useState(0);
  const held = useRef(false);

  // lighting: hold to keep the tips in the flame
  useEffect(() => {
    if (step !== 'light' || !holding) return;
    const t = window.setInterval(() => {
      setGlow((g) => {
        const v = Math.min(1, g + 0.05);
        if (v >= 1) {
          window.setTimeout(() => setStep('pray'), 500);
          soundService.playPaperBurn();
        }
        return v;
      });
    }, 60);
    return () => clearInterval(t);
  }, [step, holding]);

  const act = () => {
    if (step === 'pick') {
      if (n < 5) {
        setN(n + 1);
        soundService.playMo();
      }
    } else if (step === 'place') {
      if (planted < n) {
        const p = planted + 1;
        setPlanted(p);
        soundService.playMo();
        if (p >= n) {
          window.setTimeout(() => {
            setStep('done');
            onDone(n);
            soundService.playBellChime();
          }, 700);
        }
      }
    }
  };
  const down = () => {
    held.current = true;
    if (step === 'light' || step === 'pray') setHolding(true);
    else act();
  };
  const up = () => {
    if (!held.current) return;
    held.current = false;
    if (step === 'pray' && holding) {
      const b = bows + 1;
      setBows(b);
      soundService.playMo();
      if (b >= 3) window.setTimeout(() => setStep('place'), 600);
    }
    setHolding(false);
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (step === 'pick' && /^[1-5]$/.test(e.key)) {
        setN(+e.key);
        return;
      }
      if (step === 'pick' && e.key === 'Enter' && n > 0) return setStep('light');
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        down();
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') up();
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  });

  const raised = step === 'pray' && holding;
  const sticks = Array.from({ length: n }, (_, i) => i);
  const handX = step === 'light' ? 640 : step === 'place' || step === 'done' ? 800 : 820;
  const handY = raised ? 470 : step === 'light' ? 560 : 640;

  const tip = {
    pick: n ? `${n} stick${n > 1 ? 's' : ''} in your hand. Odd numbers are for the living: one, three or five.` : 'Take incense sticks from the vase: click it, or press 1 to 5.',
    light: 'Hold the tips in the candle flame (hold Space or press and hold).',
    pray: `Raise the incense to your forehead and bow: press and hold, then release. ${bows}/3`,
    place: `Plant the sticks in the ash, one at a time. ${planted}/${n}`,
    done: n % 2 ? 'The smoke rises straight up. Your offering is made.' : 'An old woman smiles kindly: "Odd numbers, dear. Even numbers are kept for mourning."',
  }[step];

  return (
    <Frame
      title="Offer incense"
      vi="Thắp hương"
      onClose={onClose}
      wash="#ecd3a6"
      onPointerDown={down}
      onPointerUp={up}
      footer={
        <>
          <p className="max-w-xl text-[14px] sm:text-[16px] leading-snug">{tip}</p>
          <div className="flex gap-2">
            {step === 'pick' && (
              <button disabled={!n} onClick={() => setStep('light')} className="px-5 py-2 rounded-md dh-seal font-semibold cursor-pointer disabled:opacity-40">
                Light {n || ''} stick{n === 1 ? '' : 's'}
              </button>
            )}
            {step === 'pick' && n > 0 && (
              <button onClick={() => setN(0)} className="px-4 py-2 rounded-md border border-white/30 text-sm cursor-pointer">
                Put them back
              </button>
            )}
            {step === 'done' && (
              <button onClick={onClose} className="px-5 py-2 rounded-md dh-seal font-semibold cursor-pointer">
                Done
              </button>
            )}
          </div>
        </>
      }
    >
      {/* the hall behind: a red wall and the altar's glow */}
      <S d="M0 0L1600 0L1600 520L0 520Z" f={INK.sonDeep} tex="tx-swirl" k={0} />
      <circle cx={800} cy={300} r={360} fill="url(#glow-gold)" opacity={0.5} />
      <S d="M0 520L1600 520L1600 900L0 900Z" f="#c9a77a" tex="tx-hatch" k={0} />
      {/* great burner (đỉnh) */}
      <g>
        <S d="M560 640Q560 820 800 830Q1040 820 1040 640Z" f={INK.gold} tex="tx-rings" />
        <S d="M540 620L1060 620L1060 650L540 650Z" f={INK.gold} k={5} />
        <S d="M580 618Q800 590 1020 618Z" f="#8a8076" k={3} />
        <S d="M600 820L580 880L620 880ZM1000 820L980 880L1020 880Z" f={INK.gold} k={4} />
        <S d="M540 640q-50 -10 -50 -60q30 10 50 30ZM1060 640q50 -10 50 -60q-30 10 -50 30Z" f={INK.gold} k={4} />
      </g>
      {/* planted sticks + smoke */}
      {Array.from({ length: planted }, (_, i) => {
        const x = 800 + (i - (planted - 1) / 2) * 34;
        return (
          <g key={i}>
            <L d={`M${x} 612L${x} 420`} w={6} c="#a8402e" />
            <circle cx={x} cy={418} r={6} fill="#ff8a3a" className="a-glow" />
            <path d={`M${x} 410q-16 -40 4 -80q18 -36 -2 -80q-14 -30 6 -70`} fill="none" stroke="#efe6da" strokeWidth={3} className="a-smoke" opacity={0.75} />
          </g>
        );
      })}
      {/* candle */}
      <Candle x={430} y={640} s={2.2} />
      {/* vase of incense */}
      <g style={{ cursor: step === 'pick' ? 'pointer' : 'default' }} className={step === 'pick' ? 'hot' : ''}>
        <S d="M1180 640Q1150 560 1200 520L1280 520Q1330 560 1300 640Z" f={INK.cham} tex="tx-dots" />
        {Array.from({ length: Math.max(0, 9 - n) }, (_, i) => (
          <L key={i} d={`M${1210 + i * 7} 530L${1196 + i * 10} 380`} w={5} c="#a8402e" />
        ))}
        {step === 'pick' && <circle cx={1240} cy={480} r={110} fill="none" stroke={INK.hoe} strokeWidth={4} strokeDasharray="8 10" className="a-spin-slow" style={{ transformOrigin: '1240px 480px' }} />}
      </g>
      {/* your hands with the sticks */}
      {step !== 'done' && planted < n + 1 && (
        <g style={{ transform: `translate(${handX}px, ${handY}px) rotate(${step === 'pray' && !holding && bows > 0 ? 8 : 0}deg)`, transition: 'transform .5s cubic-bezier(.3,1.3,.5,1)' }}>
          {sticks.slice(planted).map((i) => {
            const x = (i - (n - 1) / 2) * 12;
            return (
              <g key={i}>
                <L d={`M${x} 40L${x * 1.6} -200`} w={6} c="#a8402e" />
                {glow > 0 && <circle cx={x * 1.6} cy={-202} r={5 + glow * 4} fill="#ff8a3a" opacity={glow} />}
                {glow >= 1 && <path d={`M${x * 1.6} -210q-10 -30 4 -60q12 -26 -2 -54`} fill="none" stroke="#efe6da" strokeWidth={2.4} className="a-smoke" opacity={0.7} />}
              </g>
            );
          })}
          {n > 0 && (
            <>
              <S d="M-150 160Q-120 40 -40 20L-14 60Q-70 90 -90 170Z" f={INK.brown} />
              <S d="M150 160Q120 40 40 20L14 60Q70 90 90 170Z" f={INK.brown} />
              <S d="M-34 10Q0 -6 34 10Q40 60 0 70Q-40 60 -34 10Z" f={INK.skin} k={4} />
            </>
          )}
        </g>
      )}
      {step === 'light' && <circle cx={430} cy={440} r={60 + glow * 30} fill="url(#glow-gold)" opacity={0.6 + glow * 0.4} />}
      {step === 'place' && <circle cx={800} cy={605} r={70} fill="none" stroke={INK.hoe} strokeWidth={4} strokeDasharray="8 10" className="a-spin-slow" style={{ transformOrigin: '800px 605px' }} />}
      {step === 'done' && <Cloud x={800} y={180} w={320} seed={77} f={INK.diep} className="a-drift" />}
    </Frame>
  );
};

/* ================================================================== */
/* Xin xăm                                                             */
/* ================================================================== */
type XStep = 'think' | 'shake' | 'fall' | 'coins' | 'slip';

export const XamRitual: React.FC<{ onClose: () => void; phuc: number; onDrawn: (n: number) => void }> = ({ onClose, phuc, onDrawn }) => {
  const [step, setStep] = useState<XStep>('think');
  const [q, setQ] = useState('');
  const [power, setPower] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [x, setX] = useState<Xam | null>(null);
  const [res, setRes] = useState<QueResult | null>(null);
  const last = useRef<{ x: number; dir: number }>({ x: 0, dir: 0 });
  const dragging = useRef(false);
  const lastKey = useRef('');

  // a shake: tilt the tube the other way, rattle, fill the meter
  const shakeOnce = (dir: number) => {
    if (step !== 'shake') return;
    setTilt(dir * (10 + Math.random() * 6));
    soundService.playOmikujiShake();
    setPower((p) => {
      const v = Math.min(1, p + 0.075);
      if (v >= 1 && p < 1) {
        const drawn = drawXam(phuc);
        setX(drawn);
        window.setTimeout(() => setStep('fall'), 200);
        window.setTimeout(() => setStep('coins'), 1700);
      }
      return v;
    });
  };
  // the meter settles if you stop
  useEffect(() => {
    if (step !== 'shake') return;
    const t = window.setInterval(() => {
      setPower((p) => Math.max(0, p - 0.012));
      setTilt((t) => t * 0.6);
    }, 120);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') {
        if (e.key === 'Enter' && step === 'think') setStep('shake');
        return;
      }
      if (step === 'think' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setStep('shake');
        return;
      }
      if (step !== 'shake') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'a' || e.key === 'd') {
        e.preventDefault();
        if (e.repeat) return;
        const dir = e.key === 'ArrowLeft' || e.key === 'a' ? -1 : e.key === 'ArrowRight' || e.key === 'd' ? 1 : lastKey.current === 'L' ? 1 : -1;
        lastKey.current = dir < 0 ? 'L' : 'R';
        shakeOnce(dir);
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  });

  const onDown = (e: React.PointerEvent) => {
    if (step !== 'shake') return;
    dragging.current = true;
    last.current = { x: e.clientX, dir: 0 };
    shakeOnce(Math.random() < 0.5 ? -1 : 1);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || step !== 'shake') return;
    const dx = e.clientX - last.current.x;
    if (Math.abs(dx) > 26) {
      const dir = Math.sign(dx);
      if (dir !== last.current.dir) shakeOnce(dir);
      last.current = { x: e.clientX, dir };
    }
  };

  const rising = Math.round(power * 60);
  const tip = {
    think: 'Kneel before the altar and hold your question in your heart.',
    shake: 'Shake the tube: drag left and right, or tap ← → (or Space). Keep going until a stick falls.',
    fall: 'A stick slips out and clatters onto the floor…',
    coins: `Stick number ${x?.n}. Ask the two coins whether it is truly your answer.`,
    slip: 'Your verse. It is saved in your journal.',
  }[step];

  return (
    <Frame
      title="Ask the fortune sticks"
      vi="Xin xăm"
      onClose={onClose}
      wash="#efd2bf"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => (dragging.current = false)}
      footer={
        <>
          <p className="max-w-xl text-[14px] sm:text-[16px] leading-snug">{tip}</p>
          {step === 'think' && (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Your question (only you will see it)" className="w-72 px-3 py-2 rounded-md bg-[#f3ead6] text-[#211a15] text-sm outline-none border-2 border-[#211a15]" />
              <button onClick={() => setStep('shake')} className="px-5 py-2 rounded-md dh-seal font-semibold cursor-pointer">
                Take up the tube
              </button>
            </div>
          )}
          {step === 'shake' && (
            <div className="w-64 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[#e9b84a] transition-[width] duration-150" style={{ width: `${power * 100}%` }} />
            </div>
          )}
          {step === 'coins' && (
            <div className="dh-paper rounded-md px-4 py-3 text-[#211a15]">
              <CoinToss
                label="Toss the coins"
                onResult={(r) => {
                  setRes(r);
                  if (r === 'thanh' && x) {
                    window.setTimeout(() => {
                      setStep('slip');
                      soundService.playBellChime();
                      onDrawn(x.n);
                    }, 1200);
                  }
                }}
              />
              {res && res !== 'thanh' && (
                <button
                  onClick={() => {
                    setRes(null);
                    setPower(0);
                    setX(null);
                    setStep('shake');
                  }}
                  className="mt-2 text-sm underline cursor-pointer"
                >
                  Not this one. Shake again
                </button>
              )}
            </div>
          )}
        </>
      }
    >
      <S d="M0 0L1600 0L1600 560L0 560Z" f={INK.sonDeep} tex="tx-swirl" k={0} />
      <circle cx={800} cy={260} r={380} fill="url(#glow-gold)" opacity={0.45} />
      <S d="M0 560L1600 560L1600 900L0 900Z" f="#c9a77a" tex="tx-hatch" k={0} />
      <Lotus x={330} y={520} s={0.9} />
      <Lotus x={1270} y={520} s={0.9} />
      <Candle x={200} y={560} s={1.6} />
      <Candle x={1400} y={560} s={1.6} delay={0.3} />
      {step === 'think' && q && (
        <text x={800} y={140} textAnchor="middle" fontSize={34} fontStyle="italic" fill={INK.hoeLight} fontFamily="'Noto Serif', serif" opacity={0.85}>
          “{q}”
        </text>
      )}
      {step !== 'slip' && (
        <g style={{ transform: `translate(800px, 600px) rotate(${tilt}deg)`, transition: 'transform .09s ease-out' }}>
          {/* sticks, a few rising with the shaking */}
          {Array.from({ length: 13 }, (_, i) => {
            const x0 = -60 + i * 10;
            const up = i === 6 ? rising + (step === 'fall' ? 999 : 0) : Math.round((Math.sin(i * 7.3) * 0.5 + 0.5) * rising * 0.35);
            return <S key={i} d={`M${x0 - 4} ${-170 - up}L${x0 + 4} ${-170 - up}L${x0 + 4} ${30 - up}L${x0 - 4} ${30 - up}Z`} f="#d9b47a" k={2.5} tight />;
          })}
          <S d="M-90 -110L90 -110L90 210Q90 240 60 240L-60 240Q-90 240 -90 210Z" f="#7a5a2a" tex="tx-hatch" />
          <S d="M-90 -80L90 -80L90 -64L-90 -64Z" f={INK.gold} k={3} />
          <S d="M-90 170L90 170L90 186L-90 186Z" f={INK.gold} k={3} />
          <text y={70} textAnchor="middle" fontSize={44} fontWeight={700} fill={INK.hoeLight} fontFamily="'Noto Serif', serif">
            XĂM
          </text>
        </g>
      )}
      {(step === 'fall' || step === 'coins') && x && (
        <g className="stick-fall">
          <S d="M-8 -150L8 -150L8 150L-8 150Z" f="#e6c48a" k={3} tight />
          <text y={-100} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK.son} fontFamily="'Noto Serif', serif" style={{ writingMode: 'vertical-rl' }}>
            {x.n}
          </text>
        </g>
      )}
      {(step === 'coins' || step === 'fall') && x && (
        <g transform="translate(1180 330)">
          <S d={circ(0, 0, 90)} f={INK.diep} k={6} className="a-pop" />
          <text y={-14} textAnchor="middle" fontSize={22} fill={INK.key} fontFamily="'Noto Serif', serif">
            Quẻ số
          </text>
          <text y={44} textAnchor="middle" fontSize={64} fontWeight={700} fill={INK.son} fontFamily="'Noto Serif', serif">
            {x.n}
          </text>
        </g>
      )}
      {step === 'slip' && x && (
        <foreignObject x={420} y={60} width={760} height={780}>
          <div style={{ transform: 'scale(1.25)', transformOrigin: 'top center' }} className="dh-paper rounded-md p-4 text-[#211a15] max-w-[600px] mx-auto">
            <XamSlip x={x} />
            <div className="mt-3 flex gap-2 justify-center">
              <button
                onClick={() => {
                  setRes(null);
                  setX(null);
                  setPower(0);
                  setStep('think');
                }}
                className="px-3 py-1.5 rounded-md border-2 border-[#211a15] text-sm font-semibold cursor-pointer"
              >
                Ask another question
              </button>
              <button onClick={onClose} className="px-4 py-1.5 rounded-md dh-seal text-sm font-semibold cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </foreignObject>
      )}
      <S d={ell(800, 860, 300, 24)} f="#00000022" k={0} />
    </Frame>
  );
};

const STAGE_CSS = `
.hot:hover { filter: brightness(1.15) drop-shadow(0 0 14px rgba(255,210,120,.8)); }
.stick-fall { animation: stickfall 1.3s cubic-bezier(.5,0,.6,1) both; }
@keyframes stickfall {
  0% { transform: translate(800px, 260px) rotate(0) }
  45% { transform: translate(860px, 120px) rotate(40deg) }
  80% { transform: translate(960px, 760px) rotate(96deg) }
  90% { transform: translate(975px, 735px) rotate(88deg) }
  100% { transform: translate(985px, 760px) rotate(92deg) }
}
`;
