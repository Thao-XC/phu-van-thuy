import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Captions, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { FILM, FILM_TITLE, type FilmChapter } from '../data/legendFilm';
import { useBackLayer } from '../services/backStack';
import { soundService } from '../services/soundService';

/**
 * A short narrated film about the real history and legends of the Mother Goddesses.
 * Scenes are drawn like Đông Hồ woodblock prints and animate beat by beat with the narration.
 * The narrator is the device's synthesized voice (Web Speech); without one, lines advance on a timer.
 */

type Lang = 'en' | 'vi';
const INK = '#2a1d14';
const PAPER = '#f4e7c9';
const RED = '#c0262d';
const GOLD = '#e0a92a';
const GREEN = '#4f8a3e';
const BLUE = '#2f5a7a';
const SKIN = '#f1cfa6';

/* ------------------------------------------------------------------ */
/* little drawing kit                                                  */
/* ------------------------------------------------------------------ */
const Cloud: React.FC<{ x: number; y: number; s?: number; fill?: string; className?: string }> = ({ x, y, s = 1, fill = '#fffaf0', className }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
   <g className={className}>
    <path
      d="M-120 20 Q-130 -20 -90 -24 Q-80 -60 -40 -50 Q-20 -80 20 -60 Q60 -78 80 -40 Q125 -40 120 0 Q140 24 100 30 L-100 30 Q-135 34 -120 20Z"
      fill={fill}
      stroke={INK}
      strokeWidth={4}
    />
    <path d="M-60 -10 q20 -24 40 0 M10 -24 q24 -20 44 4" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
   </g>
  </g>
);

/** a woman in a long tunic; khăn (headdress) colour shows which Mother or spirit */
const Figure: React.FC<{ x: number; y: number; s?: number; robe?: string; khan?: string; veil?: boolean; fans?: boolean; className?: string; flip?: boolean }> = ({
  x,
  y,
  s = 1,
  robe = RED,
  khan = GOLD,
  veil,
  fans,
  className,
  flip,
}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
   <g className={className}>
    {fans && (
      <g className="film-fans">
        <path d="M-70 -150 l-60 -40 a72 72 0 0 1 50 -50 z" fill={GOLD} stroke={INK} strokeWidth={3} />
        <path d="M70 -150 l60 -40 a72 72 0 0 0 -50 -50 z" fill={GOLD} stroke={INK} strokeWidth={3} />
      </g>
    )}
    <path d="M-40 -150 Q-60 -40 -70 0 L70 0 Q60 -40 40 -150 Q0 -165 -40 -150Z" fill={robe} stroke={INK} strokeWidth={4} />
    <path d="M-12 -150 L0 -100 L12 -150" fill="none" stroke={INK} strokeWidth={3} />
    <path d="M-40 -140 Q-75 -100 -60 -70 M40 -140 Q75 -100 60 -70" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <circle cx={0} cy={-180} r={26} fill={SKIN} stroke={INK} strokeWidth={4} />
    <path d="M-28 -190 Q0 -230 28 -190 Q20 -206 0 -208 Q-20 -206 -28 -190Z" fill={khan} stroke={INK} strokeWidth={3} />
    {!veil && (
      <g fill={INK}>
        <circle cx={-9} cy={-180} r={2.5} />
        <circle cx={9} cy={-180} r={2.5} />
        <path d="M-7 -168 q7 5 14 0" stroke={INK} strokeWidth={2} fill="none" />
      </g>
    )}
    {veil && <path d="M-40 -215 Q0 -230 40 -215 L46 -140 Q0 -128 -46 -140Z" fill={RED} stroke={INK} strokeWidth={3} opacity={0.95} />}
   </g>
  </g>
);

const Mountain: React.FC<{ d: string; fill?: string }> = ({ d, fill = GREEN }) => <path d={d} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;

const Waves: React.FC<{ y: number; fill?: string; className?: string }> = ({ y, fill = '#9fc3cf', className }) => (
  <g className={className}>
    <path d={`M-100 ${y} ${Array.from({ length: 20 }, (_, i) => `q50 -40 100 0`).join(' ')} V900 H-100Z`} fill={fill} stroke={INK} strokeWidth={4} />
    <path d={`M-60 ${y + 40} ${Array.from({ length: 20 }, () => `q40 -26 80 0 t0 0`).join(' ')}`} fill="none" stroke="#fffaf0" strokeWidth={4} opacity={0.8} />
  </g>
);

const Dragon: React.FC<{ x: number; y: number; s?: number; color?: string; className?: string }> = ({ x, y, s = 1, color = GREEN, className }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
   <g className={className}>
    <path d="M-200 40 Q-150 -60 -80 0 T60 0 T180 -30" fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
    <path d="M-200 40 Q-150 -60 -80 0 T60 0 T180 -30" fill="none" stroke={color} strokeWidth={26} strokeLinecap="round" />
    <path d="M-200 40 Q-150 -60 -80 0 T60 0 T180 -30" fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="6 14" />
    <g transform="translate(190 -34)">
      <path d="M-10 -20 L40 -6 L46 10 L-6 20Z" fill={color} stroke={INK} strokeWidth={4} />
      <circle cx={18} cy={-4} r={4} fill={INK} />
      <path d="M0 -20 q-10 -30 10 -40 M12 -16 q6 -30 26 -30" fill="none" stroke={INK} strokeWidth={3} />
      <path d="M40 8 q30 10 40 34" fill="none" stroke={RED} strokeWidth={4} />
    </g>
   </g>
  </g>
);

const Lantern: React.FC<{ x: number; y: number; s?: number; className?: string; style?: React.CSSProperties }> = ({ x, y, s = 1, className, style }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className={className} style={style}>
      <line x1={0} y1={-60} x2={0} y2={-30} stroke={INK} strokeWidth={3} />
      <ellipse cx={0} cy={0} rx={26} ry={32} fill={RED} stroke={INK} strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={12} ry={32} fill="none" stroke={GOLD} strokeWidth={2} />
      <rect x={-10} y={30} width={20} height={6} fill={GOLD} stroke={INK} strokeWidth={2} />
      <path d="M0 36 v20" stroke={RED} strokeWidth={3} />
    </g>
  </g>
);

const Roof: React.FC<{ x: number; y: number; w: number; fill?: string }> = ({ x, y, w, fill = '#7a2a1a' }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M${-w / 2 - 40} 0 Q${-w / 2} 20 ${-w / 2 + 20} 10 L${-w / 2 + 60} -60 L${w / 2 - 60} -60 L${w / 2 - 20} 10 Q${w / 2} 20 ${w / 2 + 40} 0 Q${w / 2 + 10} 40 ${w / 2 - 30} 30 L${-w / 2 + 30} 30 Q${-w / 2 - 10} 40 ${-w / 2 - 40} 0Z`} fill={fill} stroke={INK} strokeWidth={4} />
    <path d={`M${-w / 2 - 40} 0 q-20 -30 0 -50 M${w / 2 + 40} 0 q20 -30 0 -50`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  </g>
);

const Temple: React.FC<{ x: number; y: number; s?: number; label?: string }> = ({ x, y, s = 1, label }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-260} y={-160} width={520} height={160} fill="#efd38a" stroke={INK} strokeWidth={4} />
    {[-180, -60, 60, 180].map((cx) => (
      <rect key={cx} x={cx - 34} y={-130} width={68} height={130} fill={RED} stroke={INK} strokeWidth={4} />
    ))}
    <Roof x={0} y={-190} w={560} />
    <Roof x={0} y={-270} w={340} />
    <rect x={-90} y={-232} width={180} height={34} fill={RED} stroke={GOLD} strokeWidth={3} />
    {label && (
      <text x={0} y={-208} textAnchor="middle" fontSize={20} fontWeight={700} fill={GOLD} fontFamily="'Noto Serif', serif">
        {label}
      </text>
    )}
    <rect x={-300} y={0} width={600} height={24} fill="#cbbfa6" stroke={INK} strokeWidth={4} />
  </g>
);

const RiceRows: React.FC<{ y: number }> = ({ y }) => (
  <g>
    {Array.from({ length: 3 }, (_, r) => (
      <g key={r}>
        {Array.from({ length: 26 }, (_, i) => (
          <g key={i} transform={`translate(${30 + i * 62 + (r % 2) * 30} ${y + r * 56})`}>
            <g className="film-sway" style={{ animationDelay: `${(i * 0.13 + r * 0.4) % 2}s` }}>
              <path d="M0 0 q-6 -30 -18 -44 M0 0 q2 -34 6 -52 M0 0 q8 -28 20 -40" fill="none" stroke={GREEN} strokeWidth={5} strokeLinecap="round" />
              <path d="M6 -52 q8 6 4 16" fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" />
            </g>
          </g>
        ))}
      </g>
    ))}
  </g>
);

/** fades a group in once the narration reaches a beat */
const At: React.FC<{ beat: number; from: number; until?: number; children: React.ReactNode; className?: string }> = ({ beat, from, until, children, className = '' }) => (
  <g className={`film-beat ${beat >= from && (until === undefined || beat <= until) ? 'on' : ''} ${className}`}>{children}</g>
);

/* ------------------------------------------------------------------ */
/* the seven scenes                                                    */
/* ------------------------------------------------------------------ */
const SceneOrigins: React.FC<{ beat: number }> = ({ beat }) => (
  <g>
    <rect width={1600} height={900} fill="#f6e2b8" />
    <circle cx={1300} cy={170} r={80} fill={RED} stroke={INK} strokeWidth={4} className="film-pulse" />
    <Mountain d="M-20 560 L220 300 L380 470 L560 260 L800 560Z" fill="#6f9e58" />
    <Mountain d="M700 560 L960 330 L1140 480 L1320 300 L1640 560Z" fill="#88b06a" />
    <rect y={540} width={1600} height={360} fill="#c9d98a" stroke={INK} strokeWidth={4} />
    <RiceRows y={640} />
    <At beat={beat} from={1} until={1}>
      <Cloud x={340} y={160} s={0.9} className="film-drift" />
      <g transform="translate(340 220)" className="film-rain">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={-90 + i * 25} y1={0} x2={-100 + i * 25} y2={50} stroke={BLUE} strokeWidth={4} strokeLinecap="round" />
        ))}
      </g>
      <Cloud x={820} y={130} s={0.8} className="film-drift" />
      <path d="M840 170 l-30 60 h30 l-24 70 l70 -96 h-34 l26 -34z" fill={GOLD} stroke={INK} strokeWidth={4} className="film-flash" />
    </At>
    <At beat={beat} from={2}>
      <Figure x={330} y={560} s={0.9} robe="#fffaf0" khan={RED} className="film-rise" />
      <text x={330} y={300} textAnchor="middle" fontSize={30} fontWeight={700} fill={INK} fontFamily="'Noto Serif', serif">
        Âu Cơ
      </text>
      <Waves y={600} className="film-rise" />
      <Dragon x={1220} y={640} s={0.9} className="film-swim" />
      <text x={1220} y={560} textAnchor="middle" fontSize={30} fontWeight={700} fill={INK} fontFamily="'Noto Serif', serif">
        Lạc Long Quân
      </text>
    </At>
    <At beat={beat} from={3}>
      <g transform="translate(800 470)">
       <g className="film-pulse">
        <ellipse rx={130} ry={100} fill="#fff3d6" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 100 }, (_, i) => {
          const a = i * 2.39996, r = Math.sqrt(i / 100) * 86;
          return <ellipse key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r * 0.74} rx={7} ry={9} fill={i % 2 ? GOLD : '#fffaf0'} stroke={INK} strokeWidth={1.5} />;
        })}
       </g>
      </g>
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <g className="film-walk-left" style={{ animationDelay: `${i * 1.2}s` }}>
            <Figure x={700} y={620} s={0.28} robe={GREEN} flip />
          </g>
          <g className="film-walk-right" style={{ animationDelay: `${i * 1.2 + 0.6}s` }}>
            <Figure x={900} y={620} s={0.28} robe={BLUE} />
          </g>
        </g>
      ))}
    </At>
  </g>
);

const PALACE_COLORS: [string, string, string][] = [
  [RED, 'Thiên phủ', 'Heaven'],
  [GREEN, 'Nhạc phủ', 'Mountains & forests'],
  ['#f6f2ea', 'Thoải phủ', 'Waters'],
  [GOLD, 'Địa phủ', 'Earth'],
];
const ScenePalaces: React.FC<{ beat: number }> = ({ beat }) => (
  <g>
    <rect width={1600} height={900} fill="#2a1410" />
    {Array.from({ length: 40 }, (_, i) => (
      <circle key={i} cx={(i * 397) % 1600} cy={(i * 211) % 520} r={2 + (i % 3)} fill="#f6dc7a" className="film-twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
    ))}
    <g transform="translate(800 200)">
      <g className="film-spin-slow">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} rx={22} ry={70} fill="#f3a5bf" stroke={INK} strokeWidth={3} transform={`rotate(${i * 30}) translate(0 -60)`} />
        ))}
      </g>
      <circle r={40} fill={GOLD} stroke={INK} strokeWidth={4} />
    </g>
    {PALACE_COLORS.map(([c, vi, en], i) => {
      const x = 260 + i * 360;
      const lit = (i < 3 && beat >= 2) || (i === 3 && beat >= 3);
      return (
        <At key={vi} beat={beat} from={1}>
          <g transform={`translate(${x} 560)`} className={lit ? 'film-glow' : ''} opacity={lit ? 1 : 0.35}>
            <path d="M-120 140 V-60 Q-120 -170 0 -170 Q120 -170 120 -60 V140Z" fill={c} stroke={INK} strokeWidth={5} />
            <path d="M-80 140 V-40 Q-80 -120 0 -120 Q80 -120 80 -40 V140Z" fill="none" stroke={i === 2 ? '#c9b48a' : '#fff4dc'} strokeWidth={4} strokeDasharray="10 8" />
            <text y={190} textAnchor="middle" fontSize={34} fontWeight={700} fill="#fff4dc" fontFamily="'Noto Serif', serif">
              {vi}
            </text>
            <text y={226} textAnchor="middle" fontSize={22} fill="#f2d9a8" fontFamily="'Noto Serif', serif" fontStyle="italic">
              {en}
            </text>
          </g>
        </At>
      );
    })}
    <At beat={beat} from={4}>
      <g transform="translate(0 0)">
        {Array.from({ length: 13 }, (_, i) => (
          <Figure key={i} x={140 + i * 110} y={890} s={0.32} robe={[RED, GREEN, '#f6f2ea', GOLD, BLUE][i % 5]} khan={GOLD} className="film-rise" />
        ))}
      </g>
    </At>
  </g>
);

const SceneCup: React.FC<{ beat: number }> = ({ beat }) => (
  <g>
    <rect width={1600} height={900} fill={beat >= 3 ? '#e8d9a8' : '#f3d9c6'} className="film-bg" />
    <At beat={beat} from={0} until={2}>
      <Cloud x={300} y={300} s={1.4} className="film-drift" />
      <Cloud x={1250} y={260} s={1.2} className="film-drift" />
      <Cloud x={800} y={430} s={1.8} />
      <g transform="translate(800 300) scale(0.7)">
        <Roof x={0} y={-60} w={520} fill={RED} />
        <rect x={-200} y={-30} width={400} height={110} fill={GOLD} stroke={INK} strokeWidth={4} />
      </g>
    </At>
    <At beat={beat} from={0} until={1}>
      <Figure x={620} y={540} s={1} robe={RED} khan={GOLD} />
      <Figure x={1000} y={520} s={1.15} robe={GOLD} khan={RED} flip />
    </At>
    <At beat={beat} from={1} until={1}>
      <g className="film-cupfall">
        <path d="M-30 0 h60 l-10 40 h-40z" fill="#8fd1b0" stroke={INK} strokeWidth={4} transform="translate(700 380)" />
      </g>
      <g transform="translate(700 600)" className="film-shards">
        {[-50, -20, 15, 45].map((dx, i) => (
          <path key={i} d="M0 0 l18 -6 l-6 18z" fill="#8fd1b0" stroke={INK} strokeWidth={3} transform={`translate(${dx} ${i % 2 ? -6 : 4}) rotate(${i * 50})`} />
        ))}
      </g>
    </At>
    <At beat={beat} from={2} until={2}>
      <g className="film-descend">
        <Figure x={800} y={560} s={0.9} robe={RED} khan={GOLD} />
      </g>
    </At>
    <At beat={beat} from={3}>
      <Mountain d="M-20 600 L240 400 L460 600Z" fill="#88b06a" />
      <rect y={600} width={1600} height={300} fill="#c9d98a" stroke={INK} strokeWidth={4} />
      <g transform="translate(1120 620)">
        <rect x={-160} y={-120} width={320} height={120} fill="#efd38a" stroke={INK} strokeWidth={4} />
        <rect x={-30} y={-90} width={60} height={90} fill="#7a2a1a" stroke={INK} strokeWidth={4} />
        <path d="M-210 -110 L0 -230 L210 -110Z" fill="#b9874a" stroke={INK} strokeWidth={4} />
      </g>
      {[200, 300, 1400, 1480].map((x, i) => (
        <g key={x} transform={`translate(${x} 620)`} className="film-sway" style={{ animationDelay: `${i * 0.4}s` }}>
          <path d="M0 0 q6 -120 -10 -240" fill="none" stroke={GREEN} strokeWidth={10} />
          <path d="M-10 -240 q-40 10 -70 -10 M-6 -180 q40 -10 64 6 M-4 -120 q-36 6 -60 -8" fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      <text x={1120} y={420} textAnchor="middle" fontSize={34} fontWeight={700} fill={INK} fontFamily="'Noto Serif', serif">
        Vân Cát
      </text>
    </At>
    <At beat={beat} from={3} until={3}>
      <Figure x={820} y={760} s={0.85} robe={RED} khan={GOLD} />
      <Figure x={940} y={760} s={0.8} robe={BLUE} khan={INK} flip />
      <Figure x={880} y={780} s={0.4} robe={GOLD} khan={INK} />
    </At>
    <At beat={beat} from={4}>
      <path d="M760 0 L840 0 L980 900 L620 900Z" fill="#fff6d6" opacity={0.6} className="film-pulse" />
      <g className="film-ascend">
        <Figure x={800} y={760} s={0.85} robe={RED} khan={GOLD} />
      </g>
    </At>
  </g>
);

const SceneReturn: React.FC<{ beat: number }> = ({ beat }) => (
  <g>
    <rect width={1600} height={900} fill="#f1ddb0" />
    <Mountain d="M-40 560 L200 260 L420 520 L640 300 L900 560Z" fill="#7aa35f" />
    <Mountain d="M800 560 L1040 280 L1260 500 L1440 320 L1660 560Z" fill="#94b874" />
    <path d="M-20 900 Q400 600 800 640 T1640 560 V900Z" fill="#d9c18a" stroke={INK} strokeWidth={4} />
    <At beat={beat} from={0} until={1}>
      <g className="film-walkacross">
        <Figure x={0} y={720} s={0.7} robe={RED} khan={GOLD} />
      </g>
    </At>
    <At beat={beat} from={1} until={1}>
      <g transform="translate(1180 700)">
        <Figure x={0} y={0} s={0.75} robe={BLUE} khan={INK} flip />
        <g className="film-float">
          <rect x={-160} y={-360} width={110} height={150} fill="#fffaf0" stroke={INK} strokeWidth={3} transform="rotate(-8)" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={-140 + i * 22} y1={-340} x2={-140 + i * 22} y2={-230} stroke={INK} strokeWidth={3} transform="rotate(-8)" />
          ))}
        </g>
      </g>
    </At>
    <At beat={beat} from={2} until={2}>
      <rect width={1600} height={900} fill="#2a1410" opacity={0.75} />
      {[
        ['Tản Viên', GREEN, 'M-40 30 L0 -40 L40 30Z'],
        ['Thánh Gióng', '#8a5a2a', 'M-36 20 L-10 -36 L30 -30 L40 20Z'],
        ['Chử Đồng Tử', BLUE, 'M-40 10 Q0 -40 40 10 Q0 40 -40 10Z'],
        ['Liễu Hạnh', RED, 'M-30 30 L0 -40 L30 30 Q0 10 -30 30Z'],
      ].map(([n, c, d], i) => (
        <g key={n} transform={`translate(${260 + i * 360} 420)`}>
         <g className="film-pop" style={{ animationDelay: `${i * 0.35}s` }}>
          <circle r={120} fill={c} stroke={GOLD} strokeWidth={8} />
          <path d={d} fill="#fff4dc" stroke={INK} strokeWidth={4} transform="scale(1.6)" />
          <text y={180} textAnchor="middle" fontSize={34} fontWeight={700} fill="#fff4dc" fontFamily="'Noto Serif', serif">
            {n}
          </text>
         </g>
        </g>
      ))}
      <text x={800} y={180} textAnchor="middle" fontSize={44} fontWeight={700} fill={GOLD} fontFamily="'Noto Serif', serif">
        Tứ bất tử · The Four Immortals
      </text>
    </At>
    <At beat={beat} from={3}>
      <rect width={1600} height={900} fill="#2a1a2e" opacity={0.55} />
      <path d="M1340 120 a70 70 0 1 0 50 120 a56 56 0 1 1 -50 -120z" fill="#fff3c4" />
      <Temple x={800} y={700} s={1.1} label="PHỦ DẦY" />
      {[360, 520, 1080, 1240].map((x, i) => (
        <Lantern key={x} x={x} y={300} s={1.1} className="film-swing" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
    </At>
  </g>
);

const SceneForest: React.FC<{ beat: number }> = ({ beat }) => (
  <g>
    <rect width={1600} height={900} fill="#efe2c0" />
    <g opacity={beat === 0 || beat >= 2 ? 1 : 0.35} className="film-fade">
      <rect width={800} height={900} fill="#d7e6b8" />
      <Mountain d="M-40 700 L180 260 L360 560 L520 200 L840 700Z" fill="#4f8a3e" />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i} transform={`translate(${60 + i * 110} ${660 + (i % 2) * 30})`} className="film-sway" style={{ animationDelay: `${i * 0.3}s` }}>
          <rect x={-6} y={-20} width={12} height={40} fill="#7a5230" stroke={INK} strokeWidth={3} />
          <path d="M0 -150 L50 -20 H-50Z" fill="#2f6b34" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <g transform="translate(560 780)" className="film-hop">
        <ellipse rx={50} ry={26} fill="#b8743a" stroke={INK} strokeWidth={4} />
        <path d="M40 -10 l26 -50 l14 10 l-14 46z" fill="#b8743a" stroke={INK} strokeWidth={4} />
        <path d="M66 -60 l-10 -30 M72 -56 l14 -30" stroke={INK} strokeWidth={4} />
        {[-30, -10, 20, 36].map((x) => (
          <line key={x} x1={x} y1={20} x2={x} y2={70} stroke={INK} strokeWidth={6} />
        ))}
      </g>
      <Figure x={330} y={600} s={0.9} robe={GREEN} khan={GOLD} />
      <text x={330} y={330} textAnchor="middle" fontSize={34} fontWeight={700} fill={INK} fontFamily="'Noto Serif', serif">
        Mẫu Thượng Ngàn
      </text>
    </g>
    <g opacity={beat === 1 || beat >= 2 ? 1 : 0.35} className="film-fade">
      <rect x={800} width={800} height={900} fill="#d9ecef" />
      <Waves y={560} fill="#7fb3c4" />
      <Dragon x={1250} y={680} s={0.8} color="#e8f3f5" className="film-swim" />
      <circle cx={1120} cy={420} r={26} fill="#fffaf0" stroke={INK} strokeWidth={4} className="film-pulse" />
      <Figure x={1220} y={520} s={0.9} robe="#fffaf0" khan={BLUE} />
      <text x={1220} y={250} textAnchor="middle" fontSize={34} fontWeight={700} fill={INK} fontFamily="'Noto Serif', serif">
        Mẫu Thoải
      </text>
    </g>
    <At beat={beat} from={2}>
      <rect y={760} width={1600} height={140} fill={GOLD} stroke={INK} strokeWidth={4} />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} transform={`translate(${100 + i * 175} 840)`}>
          <path d="M0 40 L-20 -40 M0 40 L0 -50 M0 40 L20 -40" stroke="#8a5a00" strokeWidth={6} />
          <rect x={-22} y={4} width={44} height={10} fill={RED} />
        </g>
      ))}
      <text x={800} y={740} textAnchor="middle" fontSize={34} fontWeight={700} fill={INK} fontFamily="'Noto Serif', serif">
        Mẫu Địa
      </text>
    </At>
  </g>
);

const SceneHauDong: React.FC<{ beat: number }> = ({ beat }) => (
  <g>
    <rect width={1600} height={900} fill="#3a120e" />
    <rect y={620} width={1600} height={280} fill="#5a2018" />
    <rect x={500} y={180} width={600} height={300} fill="#7d1414" stroke={GOLD} strokeWidth={6} />
    <Roof x={800} y={170} w={640} fill={RED} />
    {[560, 650, 950, 1040].map((x, i) => (
      <g key={x} transform={`translate(${x} 470)`}>
        <rect x={-8} y={-50} width={16} height={50} fill="#fff3d6" />
        <path d="M0 -50 q-12 -20 0 -40 q12 20 0 40z" fill={GOLD} className="film-flicker" style={{ animationDelay: `${i * 0.2}s` }} />
      </g>
    ))}
    <At beat={beat} from={0} until={0}>
      <Figure x={800} y={720} s={1.1} robe={RED} khan={GOLD} veil />
    </At>
    <At beat={beat} from={1}>
      <g transform="translate(260 760)">
        <Figure x={0} y={0} s={0.8} robe={BLUE} khan={INK} />
        <g transform="translate(40 -90) rotate(-30)">
          <circle r={44} fill="#b8743a" stroke={INK} strokeWidth={4} />
          <rect x={-6} y={-150} width={12} height={110} fill="#7a5230" stroke={INK} strokeWidth={3} />
        </g>
      </g>
      {Array.from({ length: 5 }, (_, i) => (
        <text key={i} x={330 + i * 40} y={560} fontSize={44} fill={GOLD} className="film-note" style={{ animationDelay: `${i * 0.6}s` }}>
          ♪
        </text>
      ))}
      <g transform="translate(1340 760)">
        <circle r={60} fill={RED} stroke={INK} strokeWidth={4} />
        <circle r={60} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="8 8" className="film-spin-slow" />
      </g>
    </At>
    <At beat={beat} from={1} until={1}>
      <g className="film-veilchange">
        <Figure x={800} y={720} s={1.1} robe={GREEN} khan={GOLD} veil />
      </g>
    </At>
    <At beat={beat} from={2} until={2}>
      <g className="film-dance">
        <Figure x={800} y={740} s={1.1} robe={GOLD} khan={RED} fans />
      </g>
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={160 + i * 95} y={-40} width={30} height={42} rx={4} fill={RED} stroke={GOLD} strokeWidth={3} className="film-fall" style={{ animationDelay: `${(i * 0.37) % 3}s` }} />
      ))}
    </At>
    <At beat={beat} from={3}>
      <circle cx={800} cy={560} r={260} fill="#fff1c4" opacity={0.18} className="film-pulse" />
      <Figure x={800} y={720} s={1.15} robe="#fffaf0" khan={RED} veil />
    </At>
  </g>
);

const SceneHeritage: React.FC<{ beat: number }> = ({ beat }) => (
  <g>
    <rect width={1600} height={900} fill={beat >= 2 ? '#2a1a2e' : '#f1ddb0'} className="film-bg" />
    <At beat={beat} from={0} until={0}>
      <Temple x={800} y={760} s={1} />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i} transform={`translate(${440 + i * 120} 820)`}>
          <rect x={-8} y={-40} width={16} height={40} fill="#fff3d6" stroke={INK} strokeWidth={2} />
          <path d="M0 -40 q-10 -18 0 -34 q10 16 0 34z" fill={GOLD} className="film-flicker" style={{ animationDelay: `${i * 0.25}s` }} />
        </g>
      ))}
    </At>
    <At beat={beat} from={1} until={1}>
      <g transform="translate(800 380)">
       <g className="film-pop">
        <circle r={200} fill="#fffaf0" stroke={INK} strokeWidth={6} />
        <circle r={170} fill="none" stroke={GOLD} strokeWidth={6} strokeDasharray="20 12" className="film-spin-slow" />
        <text y={-20} textAnchor="middle" fontSize={96} fontWeight={700} fill={RED} fontFamily="'Noto Serif', serif">
          2016
        </text>
        <text y={40} textAnchor="middle" fontSize={26} fill={INK} fontFamily="'Noto Serif', serif">
          Di sản văn hóa phi vật thể
        </text>
        <text y={76} textAnchor="middle" fontSize={22} fontStyle="italic" fill={INK} fontFamily="'Noto Serif', serif">
          Intangible cultural heritage
        </text>
       </g>
      </g>
      {Array.from({ length: 15 }, (_, i) => (
        <Figure key={i} x={80 + i * 104} y={900} s={0.34} robe={[RED, GREEN, '#f6f2ea', GOLD, BLUE][i % 5]} khan={[GOLD, RED][i % 2]} className="film-rise" />
      ))}
    </At>
    <At beat={beat} from={2}>
      <path d="M1340 120 a70 70 0 1 0 50 120 a56 56 0 1 1 -50 -120z" fill="#fff3c4" />
      <g transform="translate(800 760)">
        {[-430, -220, 220, 430].map((x) => (
          <rect key={x} x={x - 60} y={-260} width={120} height={260} fill="#efd38a" stroke={INK} strokeWidth={4} />
        ))}
        <rect x={-160} y={-300} width={320} height={300} fill="#efd38a" stroke={INK} strokeWidth={4} />
        <rect x={-90} y={-230} width={180} height={230} fill={RED} stroke={INK} strokeWidth={4} />
        <Roof x={0} y={-320} w={420} />
        <rect x={-120} y={-372} width={240} height={36} fill={RED} stroke={GOLD} strokeWidth={3} />
        <text y={-346} textAnchor="middle" fontSize={22} fontWeight={700} fill={GOLD} fontFamily="'Noto Serif', serif">
          PHỦ VÂN THỦY
        </text>
      </g>
    </At>
    <At beat={beat} from={3}>
      {Array.from({ length: 12 }, (_, i) => (
        <Lantern key={i} x={120 + i * 125} y={900} s={0.8} className="film-floatup" style={{ animationDelay: `${(i * 0.53) % 4}s` }} />
      ))}
    </At>
  </g>
);

const SCENES: Record<FilmChapter['id'], React.FC<{ beat: number }>> = {
  origins: SceneOrigins,
  palaces: ScenePalaces,
  cup: SceneCup,
  return: SceneReturn,
  forest: SceneForest,
  haudong: SceneHauDong,
  heritage: SceneHeritage,
};

/* ------------------------------------------------------------------ */
/* narrator                                                            */
/* ------------------------------------------------------------------ */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  const all = synth?.getVoices() ?? [];
  const mine = all.filter((v) => v.lang.toLowerCase().startsWith(lang));
  if (!mine.length) return null;
  const good = /natural|neural|google|online|premium|enhanced|samantha|daniel|libby|sonia|aria|jenny|linh|hoaimy|an\b/i;
  return mine.find((v) => good.test(v.name) && /en-gb|vi-vn/i.test(v.lang)) ?? mine.find((v) => good.test(v.name)) ?? mine[0];
}

const words = (t: string) => t.split(/\s+/).length;

export const LegendFilm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ch, setCh] = useState(0);
  const [ln, setLn] = useState(0);
  const [done, setDone] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [voiceOn, setVoiceOn] = useState(true);
  const [cc, setCc] = useState(true);
  const [voices, setVoices] = useState<{ en: boolean; vi: boolean }>({ en: false, vi: false });
  const token = useRef(0);

  useBackLayer(true, onClose);

  // voices load asynchronously in most browsers
  useEffect(() => {
    if (!synth) return;
    const upd = () => setVoices({ en: !!pickVoice('en'), vi: !!pickVoice('vi') });
    upd();
    synth.addEventListener?.('voiceschanged', upd);
    return () => {
      synth.removeEventListener?.('voiceschanged', upd);
      synth.cancel();
    };
  }, []);

  // chầu văn under the hầu đồng chapter only
  useEffect(() => {
    if (started && playing && FILM[ch].id === 'haudong') {
      soundService.startChauVan();
      return () => soundService.stopChauVan();
    }
  }, [started, playing, ch]);

  const next = useCallback(() => {
    setLn((l) => {
      if (l + 1 < FILM[ch].lines.length) return l + 1;
      if (ch + 1 < FILM.length) {
        setCh(ch + 1);
        return 0;
      }
      setPlaying(false);
      setDone(true);
      return l;
    });
  }, [ch]);

  // narrate the current line, then move on
  useEffect(() => {
    if (!started || !playing) return;
    const my = ++token.current;
    const line = FILM[ch].lines[ln];
    const text = line[lang];
    const advance = () => {
      if (token.current === my) window.setTimeout(() => token.current === my && next(), 650);
    };
    const voice = voiceOn ? pickVoice(lang) : null;
    let safety = 0;
    if (synth && voice) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = lang === 'vi' ? 0.95 : 0.92;
      u.pitch = 1;
      u.onend = advance;
      u.onerror = advance;
      synth.speak(u);
      safety = window.setTimeout(advance, (words(text) * 0.62 + 6) * 1000);
    } else {
      safety = window.setTimeout(advance, Math.max(3800, words(text) * 360 + 1400));
    }
    return () => {
      clearTimeout(safety);
      synth?.cancel();
    };
  }, [started, playing, ch, ln, lang, voiceOn, next]);

  // keys: space play/pause, arrows chapters, C captions
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') go(ch + 1);
      else if (e.key === 'ArrowLeft') go(ch - 1);
      else if (e.key === 'c' || e.key === 'C') setCc((v) => !v);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const go = (c: number) => {
    if (c < 0 || c >= FILM.length) return;
    token.current++;
    synth?.cancel();
    setDone(false);
    setCh(c);
    setLn(0);
  };
  const toggle = () => {
    if (!started) return start();
    if (done) return restart();
    setPlaying((p) => !p);
  };
  const start = () => {
    setStarted(true);
    setPlaying(true);
    soundService.playGreatBell();
  };
  const restart = () => {
    setDone(false);
    setCh(0);
    setLn(0);
    setPlaying(true);
  };

  const chapter = FILM[ch];
  const Scene = SCENES[chapter.id];
  const line = chapter.lines[ln];
  const total = useMemo(() => FILM.reduce((n, c) => n + c.lines.length, 0), []);
  const pos = FILM.slice(0, ch).reduce((n, c) => n + c.lines.length, 0) + ln + (done ? 1 : 0);
  const other: Lang = lang === 'en' ? 'vi' : 'en';

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col text-[#fbeed2]" role="dialog" aria-label={FILM_TITLE.en}>
      <style>{FILM_CSS}</style>
      {/* top bar */}
      <div className="flex items-center gap-2 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 bg-black/90 z-10">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#e9b84a] font-semibold truncate">
            {ch + 1}/{FILM.length} · {chapter.vi}
          </div>
          <div className="text-sm font-display truncate">{chapter.en}</div>
        </div>
        <button onClick={onClose} className="ml-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Close the film" title="Close (Esc)">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* picture */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-h-full overflow-hidden" aria-hidden>
          <defs>
            <clipPath id="film-clip">
              <rect width={1600} height={900} />
            </clipPath>
            <filter id="film-paper">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
              <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0.10 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <rect width={1600} height={900} fill={PAPER} />
          <g clipPath="url(#film-clip)">
            <g key={chapter.id} className="film-scene">
              <Scene beat={ln} />
            </g>
          </g>
          <rect width={1600} height={900} filter="url(#film-paper)" pointerEvents="none" />
          <rect x={10} y={10} width={1580} height={880} fill="none" stroke={INK} strokeWidth={8} opacity={0.6} />
        </svg>

        {!started && (
          <button onClick={start} className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55 cursor-pointer">
            <span className="text-xs uppercase tracking-[0.25em] text-[#e9b84a] font-semibold">{FILM_TITLE.vi}</span>
            <span className="font-display font-bold text-3xl sm:text-5xl text-center px-6">{FILM_TITLE.en}</span>
            <span className="mt-2 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#8e1b1b] to-[#b4301f] border border-[#e9b84a]/60 font-semibold shadow-2xl">
              <Play className="w-5 h-5" /> Watch · about 4 minutes
            </span>
            <span className="text-[12px] opacity-75 max-w-sm text-center px-6">
              Narrated by an AI voice{voices.en || voices.vi ? '' : ' (no voice found on this device, so subtitles only)'}. Legends differ from place to place; this tells the most widely shared versions.
            </span>
          </button>
        )}

        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <span className="font-display text-2xl sm:text-3xl">Hết · The end</span>
            <div className="flex gap-2">
              <button onClick={restart} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 font-semibold cursor-pointer">
                <RotateCcw className="w-4 h-4" /> Watch again
              </button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8e1b1b] to-[#b4301f] border border-[#e9b84a]/60 font-semibold cursor-pointer">
                Back to the temple
              </button>
            </div>
          </div>
        )}
      </div>

      {/* subtitles */}
      <div className="min-h-[5.5rem] sm:min-h-[6rem] px-4 py-2 bg-black/90 flex flex-col items-center justify-center text-center" aria-live="polite">
        {started && cc && !done && (
          <>
            <p className="text-[15px] sm:text-lg leading-snug max-w-3xl">{line[lang]}</p>
            <p className="mt-1 text-[12px] sm:text-sm leading-snug max-w-3xl text-[#e9c98a]/80 italic">{line[other]}</p>
          </>
        )}
      </div>

      {/* controls */}
      <div className="px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1 bg-black/90">
        <div className="flex gap-1 mb-2" aria-hidden>
          {FILM.map((c, i) => (
            <button key={c.id} onClick={() => go(i)} className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden cursor-pointer" title={c.en}>
              <span className="block h-full bg-[#e9b84a] transition-all" style={{ width: i < ch || done ? '100%' : i === ch ? `${(ln / c.lines.length) * 100}%` : '0%' }} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => go(ch - 1)} disabled={ch === 0} className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 cursor-pointer" aria-label="Previous chapter">
            <SkipBack className="w-5 h-5" />
          </button>
          <button onClick={toggle} className="p-2.5 rounded-full bg-[#8e1b1b] hover:bg-[#a5251f] cursor-pointer" aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button onClick={() => go(ch + 1)} disabled={ch === FILM.length - 1} className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 cursor-pointer" aria-label="Next chapter">
            <SkipForward className="w-5 h-5" />
          </button>
          <span className="ml-1 text-[11px] tabular-nums opacity-70">
            {Math.min(pos, total)}/{total}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex p-0.5 rounded-lg bg-white/10" role="group" aria-label="Narration language">
              {(['en', 'vi'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`px-2 py-1 rounded-md text-[12px] font-semibold cursor-pointer ${lang === l ? 'bg-[#e9b84a] text-[#2a1410]' : 'text-[#fbeed2]'}`}
                  title={l === 'vi' && !voices.vi ? 'No Vietnamese voice on this device: Vietnamese subtitles, no narration' : undefined}
                >
                  {l === 'en' ? 'English' : 'Tiếng Việt'}
                </button>
              ))}
            </div>
            <button onClick={() => setVoiceOn((v) => !v)} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" aria-label={voiceOn ? 'Mute the narrator' : 'Unmute the narrator'} aria-pressed={!voiceOn}>
              {voiceOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-60" />}
            </button>
            <button onClick={() => setCc((v) => !v)} className={`p-2 rounded-xl hover:bg-white/10 cursor-pointer ${cc ? 'text-[#e9b84a]' : 'opacity-60'}`} aria-label="Subtitles" aria-pressed={cc}>
              <Captions className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FILM_CSS = `
.film-scene { animation: film-in 0.9s ease-out both, film-kb 40s linear both; transform-origin: 800px 450px; }
@keyframes film-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes film-kb { from { transform: scale(1) } to { transform: scale(1.07) } }
.film-beat { opacity: 0; transition: opacity 0.9s ease; }
.film-beat.on { opacity: 1; }
.film-fade { transition: opacity 0.9s ease; }
.film-bg { transition: fill 1.2s ease; }
.film-sway { animation: film-sway 3s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes film-sway { from { transform: rotate(-4deg) } to { transform: rotate(4deg) } }
.film-pulse { animation: film-pulse 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes film-pulse { 0%,100% { opacity: .85; transform: scale(1) } 50% { opacity: 1; transform: scale(1.04) } }
.film-drift { animation: film-drift 9s ease-in-out infinite alternate; }
@keyframes film-drift { from { transform: translateX(-30px) } to { transform: translateX(30px) } }
.film-rain { animation: film-rain 0.8s linear infinite; }
@keyframes film-rain { from { transform: translate(340px, 200px) } to { transform: translate(330px, 240px) } }
.film-flash { animation: film-flash 2.2s steps(1) infinite; }
@keyframes film-flash { 0%, 60%, 100% { opacity: 1 } 30% { opacity: .1 } }
.film-rise { animation: film-rise 1.2s ease-out both; }
@keyframes film-rise { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: none } }
.film-swim { animation: film-swim 4s ease-in-out infinite alternate; }
@keyframes film-swim { from { transform: translateY(0) } to { transform: translateY(-24px) } }
.film-walk-left { animation: film-wl 6s ease-in-out infinite both; }
.film-walk-right { animation: film-wr 6s ease-in-out infinite both; }
@keyframes film-wl { 0% { opacity: 0; transform: translate(0,0) } 15% { opacity: 1 } 100% { opacity: 0; transform: translate(-420px,-120px) } }
@keyframes film-wr { 0% { opacity: 0; transform: translate(0,0) } 15% { opacity: 1 } 100% { opacity: 0; transform: translate(420px,40px) } }
.film-twinkle { animation: film-tw 2.4s ease-in-out infinite; }
@keyframes film-tw { 0%,100% { opacity: .2 } 50% { opacity: 1 } }
.film-spin-slow { animation: film-spin 30s linear infinite; transform-box: fill-box; transform-origin: center; }
@keyframes film-spin { to { transform: rotate(360deg) } }
.film-glow { filter: drop-shadow(0 0 18px rgba(255,214,120,.7)); transition: opacity 1s ease; }
.film-cupfall { animation: film-cupfall 1.6s cubic-bezier(.5,0,1,.5) 0.8s both; }
@keyframes film-cupfall { from { transform: translateY(0) rotate(0) } 95% { opacity: 1 } to { transform: translateY(220px) rotate(80deg); opacity: 0 } }
.film-shards { animation: film-shards 1.2s ease-out 2.3s both; }
@keyframes film-shards { from { opacity: 0; transform: translate(700px,600px) scale(.4) } to { opacity: 1; transform: translate(700px,600px) scale(1.4) } }
.film-descend { animation: film-descend 5s ease-in-out both; }
@keyframes film-descend { from { transform: translateY(-420px); opacity: 0 } 20% { opacity: 1 } to { transform: translateY(180px) } }
.film-ascend { animation: film-ascend 6s ease-in both; }
@keyframes film-ascend { from { transform: none } to { transform: translateY(-700px); opacity: 0 } }
.film-walkacross { animation: film-walk 14s linear both; }
@keyframes film-walk { from { transform: translate(-80px, 0) } to { transform: translate(1100px, -100px) } }
.film-float { animation: film-float 3s ease-in-out infinite alternate; }
@keyframes film-float { from { transform: translateY(0) rotate(-2deg) } to { transform: translateY(-20px) rotate(3deg) } }
.film-pop { animation: film-pop 0.8s cubic-bezier(.2,1.4,.4,1) both; transform-box: fill-box; transform-origin: center; }
@keyframes film-pop { from { opacity: 0; transform: scale(.4) } to { opacity: 1; transform: scale(1) } }
.film-swing { animation: film-swing 2.6s ease-in-out infinite alternate; transform-origin: 0 -60px; }
@keyframes film-swing { from { transform: rotate(-6deg) } to { transform: rotate(6deg) } }
.film-hop { animation: film-hop 1.4s ease-in-out infinite; }
@keyframes film-hop { 0%,100% { transform: translate(560px,780px) } 50% { transform: translate(560px,760px) } }
.film-flicker { animation: film-flicker .5s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes film-flicker { from { transform: scale(1,1); opacity: .9 } to { transform: scale(.85,1.12); opacity: 1 } }
.film-note { animation: film-note 3s ease-out infinite; }
@keyframes film-note { from { opacity: 0; transform: translateY(0) } 20% { opacity: 1 } to { opacity: 0; transform: translate(40px,-200px) } }
.film-veilchange { animation: film-veil 4s ease-in-out infinite; }
@keyframes film-veil { 0%,100% { opacity: 1 } 45%,55% { opacity: .2 } }
.film-dance { animation: film-dance 2.4s ease-in-out infinite; transform-origin: 800px 740px; }
@keyframes film-dance { 0%,100% { transform: rotate(-4deg) translateX(-20px) } 50% { transform: rotate(4deg) translateX(20px) } }
.film-fans { animation: film-fans 1.2s ease-in-out infinite alternate; }
@keyframes film-fans { from { transform: rotate(-6deg) } to { transform: rotate(6deg) } }
.film-fall { animation: film-fall 3.4s linear infinite; }
@keyframes film-fall { from { transform: translateY(0) rotate(0) } to { transform: translateY(960px) rotate(260deg) } }
.film-floatup { animation: film-floatup 7s ease-in infinite; }
@keyframes film-floatup { from { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } to { transform: translateY(-1000px); opacity: .2 } }
@media (prefers-reduced-motion: reduce) { .film-scene, .film-scene * { animation-duration: 0.01s !important; animation-iteration-count: 1 !important; } }
`;
