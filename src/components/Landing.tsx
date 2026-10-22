import React, { useEffect, useRef, useState } from 'react';
import { useStory, storyService } from '../services/storyService';
import { luckService } from '../services/luckService';
import { useCalendar, lunarLabel } from './Calendar';
import { yearName } from '../services/lunar';
import { Prologue } from './Prologue';
import { INK, S, InkDefs, Paper, PaperTop, CamCtx, Layer, ell, type Cam } from '../film/ink';
import { Cloud, Mountain, Moon, Lantern, TempleFront, Bamboo, Lotus, LotusLeaf, Waves, Crane, Pine } from '../film/figures';
import { FILM_CSS } from '../film/filmCss';
import { Ambient } from './LegendFilm';

/**
 * The front door: one living Đông Hồ print of the temple at dusk that leans with your mouse,
 * a name, and a seal to press. Everything else is inside.
 */
export const Landing: React.FC<{ onEnter: () => void; onWatch: () => void }> = ({ onEnter, onWatch }) => {
  const story = useStory();
  const begun = story.started || story.khan.length > 0;
  const [tale, setTale] = useState(false);
  const { lunar, festival } = useCalendar();
  const [cam, setCam] = useState<Cam>({ x: 800, y: 450, z: 1, t: 1.6 });
  const [hot, setHot] = useState(false);
  const begin = () => (begun ? onEnter() : setTale(true));
  const beginRef = useRef(begin);
  beginRef.current = begin;

  // Enter goes in; the print leans gently toward the mouse
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !document.querySelector('[role=dialog]')) beginRef.current();
    };
    const m = (e: PointerEvent) => {
      const dx = e.clientX / window.innerWidth - 0.5, dy = e.clientY / window.innerHeight - 0.5;
      setCam({ x: 800 + dx * 90, y: 450 + dy * 40, z: 1.02, t: 1.6 });
    };
    window.addEventListener('keydown', k);
    window.addEventListener('pointermove', m);
    return () => {
      window.removeEventListener('keydown', k);
      window.removeEventListener('pointermove', m);
    };
  }, []);

  const restart = () => {
    if (!confirm('Start the story again? Your scarves, pouch, phúc and journal will be cleared.')) return;
    storyService.reset();
    luckService.reset();
    try {
      localStorage.removeItem('pvt_pos');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#140b08] text-[#fbeed2] select-none">
      <style>{FILM_CSS}</style>
      {tale && (
        <Prologue
          onClose={() => setTale(false)}
          onEnter={() => {
            setTale(false);
            onEnter();
          }}
        />
      )}

      {/* the print */}
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden>
        <InkDefs />
        <g clipPath="url(#film-clip)">
          <Paper wash="#e8c596" />
          <CamCtx.Provider value={cam}>
            <g className="printing">
              <g className="kb">
                <Layer depth={0.15}>
                  <Moon x={1250} y={170} r={62} />
                  <Cloud x={330} y={190} w={300} seed={4} className="a-drift" />
                  <Cloud x={1450} y={300} w={240} n={3} seed={9} className="a-drift2" />
                </Layer>
                <Layer depth={0.35}>
                  <Mountain x={180} base={560} w={560} h={360} f={INK.greenLight} />
                  <Mountain x={620} base={560} w={520} h={250} f={INK.greenLight} />
                  <Mountain x={1450} base={560} w={640} h={420} />
                  <Crane x={980} y={260} s={0.42} className="a-fly" />
                  <Crane x={1080} y={300} s={0.32} className="a-fly" style={{ animationDelay: '0.5s' }} />
                </Layer>
                <Layer depth={0.7}>
                  <S d="M-200 560Q800 520 1800 560L1800 700L-200 700Z" f={INK.greenLight} tex="tx-grass" />
                  <Pine x={330} base={610} s={0.9} />
                  <Bamboo x={1220} base={640} h={330} lean={-16} />
                  <Bamboo x={1290} base={640} h={280} lean={14} delay={0.6} />
                  <g
                    onPointerEnter={() => setHot(true)}
                    onPointerLeave={() => setHot(false)}
                    onClick={begin}
                    style={{ cursor: 'pointer', filter: hot ? 'drop-shadow(0 0 26px rgba(255,205,120,.95))' : 'drop-shadow(0 0 10px rgba(255,190,110,.45))', transition: 'filter .5s' }}
                    pointerEvents="all"
                  >
                    <TempleFront x={800} y={640} s={0.62} />
                  </g>
                </Layer>
                <Layer depth={1}>
                  <Waves x0={-300} x1={1900} y={660} h={400} />
                  <LotusLeaf x={260} y={780} r={70} />
                  <LotusLeaf x={1330} y={800} r={60} />
                  <Lotus x={300} y={770} s={0.75} />
                  <Lotus x={1300} y={790} s={0.6} />
                  {[0, 1, 2].map((i) => (
                    <g key={i} transform={`translate(${-80 - i * 520} ${730 + i * 40})`}>
                      <g className="a-floatx" style={{ animationDelay: `${-i * 9}s` }}>
                        <S d={ell(0, 0, 26, 8)} f={INK.pink} k={3} />
                        <circle cy={-16} r={18} fill="url(#glow-gold)" className="a-glow" />
                        <circle cy={-14} r={4} fill="#fff4cf" />
                      </g>
                    </g>
                  ))}
                </Layer>
                <Layer depth={1.35}>
                  {[110, 300, 1300, 1490].map((x, i) => (
                    <g key={x}>
                      <path d={`M${x} -20L${x} ${120 + (i % 2) * 40}`} stroke={INK.key} strokeWidth={3} />
                      <Lantern x={x} y={170 + (i % 2) * 40} s={1.3} delay={i * 0.35} />
                    </g>
                  ))}
                </Layer>
              </g>
            </g>
          </CamCtx.Provider>
          <Ambient kind="motes" />
          <PaperTop dim={0.08} border={false} />
        </g>
      </svg>

      {/* a soft darkening behind the words */}
      <div className="absolute inset-x-0 top-0 h-[42vh] bg-gradient-to-b from-[#140b08]/70 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-[#140b08]/85 to-transparent pointer-events-none" />

      {/* today, as a little seal */}
      <div className={`absolute top-[max(1rem,env(safe-area-inset-top))] right-4 px-3 py-1.5 rounded-sm text-right leading-tight ${festival?.major ? 'dh-seal' : 'dh-paper'}`}>
        <div className="text-[10px] opacity-75">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div className="text-[12px] font-display font-bold">
          {lunarLabel(lunar)} · {yearName(lunar.year)}
        </div>
        {festival && <div className="text-[11px] font-semibold">{festival.vi}</div>}
      </div>

      {/* the name */}
      <div className="absolute inset-x-0 top-[9vh] flex flex-col items-center text-center pointer-events-none px-4">
        <h1 className="font-display font-bold text-[clamp(3rem,9vw,7.5rem)] leading-none text-[#fff4dc] drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] title-in">Phủ Vân Thủy</h1>
        <p className="mt-3 font-display italic text-[clamp(1rem,2vw,1.4rem)] text-[#f2d9a8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] title-in" style={{ animationDelay: '.4s' }}>
          Four scarves are lost. The Mothers are waiting.
        </p>
      </div>

      {/* the way in */}
      <div className="absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3 px-4">
        <button onClick={begin} className="px-10 py-4 rounded-md dh-seal text-xl font-bold cursor-pointer hover:scale-[1.04] active:scale-95 transition-transform title-in" style={{ animationDelay: '.8s' }}>
          {begun ? `Continue · ${story.khan.length}/4` : 'Bước vào · Enter'}
        </button>
        <div className="flex items-center gap-4 text-[13px] text-[#e8cfa0] title-in" style={{ animationDelay: '1.1s' }}>
          <button onClick={onWatch} className="hover:text-white cursor-pointer">
            ▶ The legend
          </button>
          {begun && (
            <>
              <span className="opacity-40">·</span>
              <button onClick={() => setTale(true)} className="hover:text-white cursor-pointer">
                Retell the story
              </button>
              <span className="opacity-40">·</span>
              <button onClick={restart} className="hover:text-white cursor-pointer">
                Start over
              </button>
            </>
          )}
        </div>
      </div>
      <p className="absolute bottom-2 left-3 text-[10px] text-[#c9b08a]/60 max-w-[60vw] hidden sm:block">A fictional temple, made with respect for Đạo Mẫu.</p>
    </div>
  );
};
