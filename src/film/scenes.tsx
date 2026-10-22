import React from 'react';
import type { FilmScene } from '../data/legendFilm';
import { INK, S, L, K, circ, ell, Layer, At, Inscription, type Cam } from './ink';
import {
  Person,
  Child,
  Buffalo,
  Crane,
  Carp,
  Deer,
  Dragon,
  Cloud,
  Mountain,
  Waves,
  Sun,
  Moon,
  Bamboo,
  Lotus,
  LotusLeaf,
  Pine,
  Lantern,
  Candle,
  Roof,
  TempleFront,
  Flag,
  Throne,
  Envelope,
  House,
} from './figures';

export interface SceneDef {
  /** the pigment wash of the paper, per beat */
  wash: (beat: number) => string;
  /** darken for night / the old days */
  dim?: (beat: number) => number;
  cams: Cam[];
  Body: React.FC<{ beat: number }>;
  /** beats where the picture changes completely: hidden behind a cloud sweep */
  wipeAt?: number[];
  /** what floats in the air */
  ambient?: 'petals' | 'motes' | 'embers';
}

const Label: React.FC<{ x: number; y: number; vi: string; en?: string; c?: string }> = ({ x, y, vi, en, c = INK.son }) => (
  <g transform={`translate(${x} ${y})`}>
    <S d={`M${-vi.length * 9 - 24} -30L${vi.length * 9 + 24} -30L${vi.length * 9 + 24} ${en ? 28 : 12}L${-vi.length * 9 - 24} ${en ? 28 : 12}Z`} f={c} k={3.5} />
    <text y={-2} textAnchor="middle" fontSize={26} fontWeight={700} fill={INK.diep} fontFamily="'Noto Serif', serif" className="ink ink-p4">
      {vi}
    </text>
    {en && (
      <text y={20} textAnchor="middle" fontSize={15} fontStyle="italic" fill={INK.diep} fontFamily="'Noto Serif', serif" className="ink ink-p4">
        {en}
      </text>
    )}
  </g>
);

/* ================================================================== */
/* 1 · Before memory                                                   */
/* ================================================================== */
const Origins: React.FC<{ beat: number }> = ({ beat }) => (
  <>
    <Layer depth={0.25}>
      <Sun x={1290} y={190} r={66} />
      <Cloud x={380} y={170} w={280} seed={2} className="a-drift" />
      <Cloud x={980} y={120} w={220} n={3} seed={5} className="a-drift2" />
    </Layer>
    <Layer depth={0.5}>
      <Mountain x={250} base={580} w={560} h={300} f={INK.greenLight} />
      <Mountain x={760} base={580} w={640} h={380} />
      <Mountain x={1320} base={580} w={600} h={290} f={INK.greenLight} />
    </Layer>
    <Layer depth={0.8}>
      <S d="M-300 560Q400 520 800 545T1900 540L1900 1200L-300 1200Z" f={INK.greenLight} tex="tx-grass" />
      <L d="M-300 640Q400 600 800 625T1900 620M-300 730Q400 690 800 715T1900 710M-300 830Q400 790 800 815T1900 810" w={3} />
    </Layer>
    <Layer>
      <At beat={beat} from={0} until={1}>
        <Bamboo x={160} base={900} h={420} lean={26} />
        <Bamboo x={230} base={910} h={360} lean={-10} delay={0.7} />
        <Buffalo x={800} y={860} s={0.95} className="a-plod">
          <Child x={-20} y={-150} s={0.8} arms="flute" />
          <g className="a-notes">
            <text x={60} y={-300} fontSize={40} fill={INK.key}>
              ♪
            </text>
            <text x={110} y={-340} fontSize={32} fill={INK.key}>
              ♫
            </text>
          </g>
        </Buffalo>
        <Crane x={1300} y={420} s={0.5} className="a-fly" />
        <Crane x={1420} y={470} s={0.4} className="a-fly" style={{ animationDelay: '0.6s' }} />
      </At>
      <At beat={beat} from={1} until={1}>
        {[
          { x: 260, n: 'Bà Mây', en: 'Cloud', robe: INK.diep },
          { x: 620, n: 'Bà Mưa', en: 'Rain', robe: INK.chamLight },
          { x: 980, n: 'Bà Sấm', en: 'Thunder', robe: INK.son },
          { x: 1340, n: 'Bà Chớp', en: 'Lightning', robe: INK.hoe },
        ].map((sp, i) => (
          <g key={sp.n} className="a-hover" style={{ animationDelay: `${i * 0.5}s` }}>
            {i === 1 && <L d="M590 330l-12 70M620 330l-12 80M650 330l-12 70" w={3.5} c={INK.cham} className="a-rain" />}
            {i === 3 && <S d="M1340 330l-34 70h30l-24 80l70 -110h-34l26 -40z" f={INK.hoe} k={4} className="a-flash" />}
            <Person x={sp.x} y={250} s={0.42} robe={sp.robe} accent={INK.son} head="crown" pose={i === 2 ? 'wave' : 'open'} />
            {i === 2 && <S d={circ(sp.x + 58, 150, 26)} f={INK.son} tex="tx-swirl" className="a-drum" />}
            <Cloud x={sp.x} y={262} w={240} n={4} seed={i + 3} />
            <Label x={sp.x} y={345} vi={sp.n} en={sp.en} />
          </g>
        ))}
      </At>
      <At beat={beat} from={2} until={2}>
        <Mountain x={330} base={930} w={620} h={470} trees={false} />
        <Person x={330} y={470} s={0.78} robe={INK.diep} accent={INK.son} sash={INK.hoe} head="crown" pose="open" />
        <Crane x={140} y={260} s={0.55} className="a-fly" />
        <Crane x={520} y={200} s={0.45} flip className="a-fly" style={{ animationDelay: '0.4s' }} />
        <Inscription x={110} y={520} lines={['Âu Cơ']} size={36} seal={false} />
        <Waves x0={800} x1={1700} y={560} h={360} />
        <Dragon x={1240} y={660} s={0.82} color={INK.green} />
        <Inscription x={1520} y={330} lines={['Lạc', 'Long Quân']} size={34} seal={false} />
      </At>
      <At beat={beat} from={3}>
        <circle cx={800} cy={560} r={230} fill="url(#glow-gold)" className="a-glow" />
        <g className="a-pulse" style={{ transformOrigin: '800px 560px' }}>
          <S d={ell(800, 560, 150, 116)} f={INK.diep} k={5} />
          {Array.from({ length: 100 }, (_, i) => {
            const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 100) * 128;
            return <S key={i} d={ell(800 + Math.cos(a) * r, 560 + Math.sin(a) * r * 0.78, 7, 9)} f={i % 3 ? INK.hoeLight : INK.pink} k={1.6} tight />;
          })}
        </g>
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <Child x={760} y={760} s={0.36} bib={INK.green} className="a-walkL" style={{ animationDelay: `${i * 0.9}s` }} />
            <Child x={840} y={760} s={0.36} bib={INK.cham} className="a-walkR" style={{ animationDelay: `${i * 0.9 + 0.45}s` }} />
          </g>
        ))}
        <Label x={420} y={300} vi="Lên núi" en="to the mountains" c={INK.green} />
        <Label x={1180} y={300} vi="Xuống biển" en="to the sea" c={INK.cham} />
      </At>
    </Layer>
  </>
);

/* ================================================================== */
/* 2 · The Four Palaces                                                */
/* ================================================================== */
const PALACES = [
  { c: INK.son, vi: 'Thiên phủ', en: 'Heaven' },
  { c: INK.green, vi: 'Nhạc phủ', en: 'Mountains & forests' },
  { c: INK.diep, vi: 'Thoải phủ', en: 'Waters' },
  { c: INK.hoe, vi: 'Địa phủ', en: 'Earth' },
];
const Palaces: React.FC<{ beat: number }> = ({ beat }) => (
  <>
    <Layer depth={0.4}>
      <Cloud x={230} y={130} w={300} seed={11} className="a-drift" />
      <Cloud x={1380} y={120} w={300} seed={12} className="a-drift2" />
    </Layer>
    <Layer>
      <Lotus x={800} y={190} s={1.15} />
      <At beat={beat} from={1}>
        {PALACES.map((p, i) => {
          const cx = 260 + i * 360;
          const lit = beat >= 4 || (i < 3 ? beat >= 2 : beat >= 3);
          return (
            <g key={p.vi} style={{ opacity: lit ? 1 : 0.42, transition: 'opacity 1.2s ease' }}>
              {lit && <circle cx={cx} cy={470} r={220} fill="url(#glow-gold)" className="a-glow" />}
              <S d={`M${cx - 150} 700L${cx - 150} 360Q${cx - 150} 250 ${cx} 250Q${cx + 150} 250 ${cx + 150} 360L${cx + 150} 700Z`} f={p.c} tex={p.c === INK.diep ? 'tx-scales' : 'tx-swirl'} k={6} />
              <S d={`M${cx - 116} 690L${cx - 116} 370Q${cx - 116} 286 ${cx} 286Q${cx + 116} 286 ${cx + 116} 370L${cx + 116} 690Z`} f={INK.diep} k={4} />
              <Throne x={cx} y={668} s={0.62} />
              <Person x={cx} y={668} s={0.6} seated robe={p.c === INK.diep ? '#f7f2e6' : p.c} accent={p.c === INK.hoe ? INK.son : INK.hoe} sash={p.c === INK.son ? INK.hoe : INK.son} head="crown" />
              <Label x={cx} y={752} vi={p.vi} en={p.en} c={p.c === INK.diep ? INK.cham : p.c === INK.hoe ? INK.brown : p.c} />
            </g>
          );
        })}
      </At>
      <At beat={beat} from={4}>
        <S d="M-100 820L1700 820L1700 1100L-100 1100Z" f={INK.sonDeep} tex="tx-rings" />
        {[
          { x: 200, head: 'scholar' as const, robe: INK.cham, n: 'Quan Lớn' },
          { x: 500, head: 'crown' as const, robe: INK.son, n: 'Chầu Bà' },
          { x: 800, head: 'scholar' as const, robe: INK.hoe, n: 'Ông Hoàng' },
          { x: 1100, head: 'khan' as const, robe: INK.green, n: 'Cô' },
        ].map((c, i) => (
          <g key={c.n}>
            <Person x={c.x - 50} y={1000} s={0.36} robe={c.robe} accent={INK.diep} head={c.head} pose="joined" />
            <Person x={c.x + 50} y={1000} s={0.36} robe={c.robe} accent={INK.diep} head={c.head} pose="joined" style={{ animationDelay: `${i * 0.2}s` }} />
            <Label x={c.x} y={1040} vi={c.n} c={INK.key} />
          </g>
        ))}
        <Child x={1360} y={1000} s={0.5} arms="up" />
        <Child x={1440} y={1000} s={0.5} arms="up" bib={INK.green} />
        <Label x={1400} y={1040} vi="Cậu" c={INK.key} />
      </At>
    </Layer>
  </>
);

/* ================================================================== */
/* 3 · The broken jade cup                                             */
/* ================================================================== */
const JadeCup: React.FC = () => <S d="M-16 -14L16 -14L11 4Q0 10 -11 4Z" f="#93c9ac" k={3} />;
const Cup: React.FC<{ beat: number }> = ({ beat }) => (
  <>
    {/* heaven, y 0..900 */}
    <Layer depth={0.5}>
      <Cloud x={200} y={160} w={260} seed={21} className="a-drift" />
      <Cloud x={1400} y={200} w={300} seed={22} className="a-drift2" />
      <Cloud x={300} y={1060} w={320} seed={23} className="a-drift2" />
      <Cloud x={1300} y={1150} w={300} seed={24} className="a-drift" />
      <Crane x={420} y={1250} s={0.5} className="a-fly" />
    </Layer>
    <Layer>
      <Roof x={800} y={230} w={760} h={80} f={INK.son} />
      {[480, 640, 960, 1120].map((x) => (
        <S key={x} d={`M${x - 14} 260L${x - 14} 640L${x + 14} 640L${x + 14} 260Z`} f={INK.sonDeep} k={3.5} />
      ))}
      <S d="M420 262L1180 262L1180 290L420 290Z" f={INK.hoe} tex="tx-hatch" />
      <Throne x={980} y={650} s={0.85} />
      <Person x={980} y={650} s={0.8} seated robe={INK.hoe} accent={INK.son} sash={INK.son} head="emperor" />
      <Inscription x={1220} y={360} lines={['Ngọc', 'Hoàng']} size={30} seal={false} />
      {[200, 470, 760, 1050, 1340].map((x, i) => (
        <Cloud key={x} x={x} y={760 + (i % 2) * 40} w={360} n={5} seed={30 + i} />
      ))}
      <At beat={beat} from={0} until={0}>
        <Person x={600} y={720} s={0.82} robe={INK.son} accent={INK.hoe} pose="offer">
          <JadeCup />
        </Person>
      </At>
      <At beat={beat} from={1} until={1}>
        <Person x={600} y={720} s={0.82} robe={INK.son} accent={INK.hoe} pose="offer" />
        <g transform="translate(600 620)">
          <g className="a-cupfall">
            <JadeCup />
          </g>
          <g className="a-burst" style={{ transformOrigin: '0px 110px' }}>
            <S d="M0 70L12 100L44 96L20 116L32 146L0 128L-32 146L-20 116L-44 96L-12 100Z" f={INK.hoeLight} k={3.5} />
          </g>
          {[
            [-60, -20],
            [-30, -50],
            [40, -40],
            [70, -10],
            [10, -60],
          ].map(([dx, dy], i) => (
            <g key={i} className="a-shard" style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, transform: 'translate(0px, 110px)' } as React.CSSProperties}>
              <S d="M0 0l14 -5l-4 14z" f="#93c9ac" k={2.4} tight />
            </g>
          ))}
        </g>
      </At>
      <At beat={beat} from={2} until={2}>
        <g className="a-descend">
          <Person x={800} y={640} s={0.8} robe={INK.son} accent={INK.hoe} pose="joined" />
          <Cloud x={800} y={660} w={280} n={4} seed={41} />
        </g>
      </At>
    </Layer>
    {/* earth, y 1100..2000 */}
    <Layer depth={0.6}>
      <Mountain x={300} base={1700} w={620} h={330} f={INK.greenLight} />
      <Mountain x={1300} base={1700} w={700} h={360} />
    </Layer>
    <Layer>
      <S d="M-200 1660Q600 1620 1800 1660L1800 2300L-200 2300Z" f={INK.greenLight} tex="tx-grass" />
      <Bamboo x={140} base={1980} h={460} lean={30} />
      <Bamboo x={220} base={1990} h={400} lean={-14} delay={0.5} />
      <Bamboo x={300} base={1985} h={430} lean={18} delay={1.1} />
      <House x={1180} y={1930} s={1} />
      <Bamboo x={1460} base={1990} h={420} lean={-20} delay={0.3} />
      <Inscription x={1520} y={1240} lines={['Làng', 'Vân Cát']} size={32} />
      <At beat={beat} from={3}>
        <Person x={660} y={1960} s={0.78} robe={INK.brown} accent={INK.son} sash={INK.son} pose={beat >= 4 ? 'joined' : 'open'} className={beat >= 4 ? 'a-ascend' : undefined} />
        <Person x={860} y={1960} s={0.8} robe={INK.cham} accent={INK.diep} sash={INK.son} head="topknot" pose={beat >= 4 ? 'bow' : 'open'} flip className={beat >= 4 ? 'a-bowdown' : undefined} />
        <Child x={760} y={1960} s={0.62} arms={beat >= 4 ? 'up' : 'side'} />
      </At>
      <At beat={beat} from={4}>
        <path d="M600 900L720 900L860 1980L460 1980Z" fill="#fff6d6" opacity={0.55} className="a-glow" />
      </At>
    </Layer>
  </>
);

/* ================================================================== */
/* 4 · She came back                                                   */
/* ================================================================== */
const Return: React.FC<{ beat: number }> = ({ beat }) => (
  <>
    <At beat={beat} from={0} until={1}>
      <Layer depth={0.35}>
        {[200, 700, 1200, 1700, 2200, 2700, 3200].map((x, i) => (
          <Mountain key={x} x={x} base={600} w={560} h={260 + (i % 3) * 60} f={i % 2 ? INK.greenLight : INK.green} />
        ))}
        <Cloud x={600} y={150} w={240} seed={51} className="a-drift" />
        <Cloud x={1800} y={170} w={280} seed={52} className="a-drift2" />
        <Cloud x={2700} y={140} w={240} seed={53} className="a-drift" />
      </Layer>
      <Layer>
        <S d="M-400 640Q800 600 1600 640T3600 620L3600 1200L-400 1200Z" f={INK.hoeLight} tex="tx-grass" />
        <S d="M-400 860Q300 760 900 800T2000 760T3600 770L3600 830Q2600 820 2000 830T900 870T-400 930Z" f="#d9b878" tex="tx-dots" />
        <S d="M1250 640Q1300 760 1180 900L1320 900Q1420 760 1350 640Z" f={INK.chamLight} tex="tx-wave" />
        {[160, 520, 980, 1560, 1900].map((x, i) => (
          <Bamboo key={x} x={x} base={790} h={300 + (i % 2) * 60} lean={i % 2 ? -16 : 18} delay={i * 0.3} />
        ))}
        <Pine x={2200} base={780} s={1.1} />
        <Pine x={2900} base={760} s={0.9} />
        <g transform="translate(2560 790)">
          {[-90, 90].map((x) => (
            <S key={x} d={`M${x - 8} 0L${x - 8} -180L${x + 8} -180L${x + 8} 0Z`} f={INK.son} k={3} />
          ))}
          <Roof x={0} y={-180} w={240} h={50} />
        </g>
        <At beat={beat} from={0} until={0}>
          <g className="a-walkacross">
            <Person x={260} y={850} s={0.62} robe={INK.son} accent={INK.hoe} pose="joined" />
          </g>
        </At>
        <At beat={beat} from={1} until={1}>
          <Person x={2300} y={810} s={0.66} robe={INK.cham} accent={INK.diep} sash={INK.hoe} head="scholar" pose="brush" />
          <Person x={2640} y={810} s={0.66} robe={INK.son} accent={INK.hoe} pose="open" flip />
          <g className="a-float">
            <S d="M2400 560L2520 560L2520 700L2400 700Z" f={INK.diep} k={3.5} />
            {[0, 1, 2, 3].map((i) => (
              <text key={i} x={2500 - i * 28} y={590} fontSize={20} fontWeight={700} fontStyle="italic" fill={INK.key} fontFamily="'Noto Serif', serif" writingMode="vertical-rl" className="ink ink-p4">
                {['Thơ', 'xướng', 'họa', 'vui'][i]}
              </text>
            ))}
          </g>
        </At>
      </Layer>
    </At>
    <At beat={beat} from={2} until={2}>
      <Layer depth={0}>
        <S d="M0 0L1600 0L1600 900L0 900Z" f={INK.son} tex="tx-swirl" k={0} />
        <Inscription x={800} y={130} lines={['Tứ bất tử']} size={44} seal={false} color={INK.diep} />
        {[
          { n: 'Tản Viên', en: 'god of the mountain', robe: INK.green, head: 'topknot' as const },
          { n: 'Thánh Gióng', en: 'the boy hero', robe: INK.son, head: 'boy' as const },
          { n: 'Chử Đồng Tử', en: 'the fisherman saint', robe: INK.brown, head: 'hat' as const },
          { n: 'Liễu Hạnh', en: 'the Mother', robe: INK.son, head: 'crown' as const },
        ].map((r, i) => (
          <g key={r.n} transform={`translate(${260 + i * 360} 470)`}>
            <g className="a-pop" style={{ animationDelay: `${0.3 + i * 0.5}s` }}>
              <S d={circ(0, 0, 150)} f={INK.hoe} k={7} />
              <clipPath id={`rc${i}`}>
                <circle r={122} />
              </clipPath>
              <S d={circ(0, 0, 124)} f={INK.diep} tex={i % 2 ? 'tx-dots' : 'tx-hatch'} k={4} />
              <g clipPath={`url(#rc${i})`}>
              {i === 0 && <Mountain x={0} base={90} w={220} h={170} f={INK.greenLight} trees={false} />}
              {i === 1 && <S d="M-80 90Q-60 -40 0 -80Q60 -40 80 90Z" f={INK.hoe} k={4} className="a-flame" style={{ transformOrigin: '0px 90px' }} />}
              {i === 2 && <Waves x0={-124} x1={124} y={40} h={84} f={INK.chamLight} />}
              {i === 3 && <circle r={110} fill="url(#glow-gold)" />}
              <Person x={0} y={110} s={0.5} robe={r.robe} accent={i === 3 ? INK.hoe : INK.diep} head={r.head} pose={i === 1 ? 'wave' : 'joined'} />
              </g>
              <Label x={0} y={196} vi={r.n} en={r.en} c={INK.key} />
            </g>
          </g>
        ))}
      </Layer>
    </At>
    <At beat={beat} from={3}>
      <Layer depth={0}>
        <S d="M0 0L1600 0L1600 900L0 900Z" f="#3a2a40" k={0} />
        <Moon x={1320} y={150} />
        <TempleFront x={800} y={820} s={1} name="PHỦ DẦY" />
        {[150, 300, 1300, 1450].map((x, i) => (
          <Flag key={x} x={x} base={880} h={320} c={[INK.son, INK.hoe, INK.green, INK.diep][i]} delay={i * 0.3} />
        ))}
        {[420, 560, 1040, 1180].map((x, i) => (
          <Lantern key={x} x={x} y={340} s={1} delay={i * 0.4} />
        ))}
        <g transform="translate(110 260)">
          <S d="M-34 0L34 0L34 360L-34 360Z" f={INK.son} k={4} />
          <Inscription x={0} y={50} lines={['Tháng Tám giỗ Cha']} size={30} seal={false} color={INK.hoeLight} />
        </g>
        <g transform="translate(1490 260)">
          <S d="M-34 0L34 0L34 360L-34 360Z" f={INK.son} k={4} />
          <Inscription x={0} y={50} lines={['Tháng Ba giỗ Mẹ']} size={30} seal={false} color={INK.hoeLight} />
        </g>
        {Array.from({ length: 9 }, (_, i) => (
          <Person key={i} x={330 + i * 118} y={905} s={0.3} robe={[INK.son, INK.cham, INK.brown, INK.green][i % 4]} accent={INK.hoe} pose="joined" />
        ))}
      </Layer>
    </At>
  </>
);

/* ================================================================== */
/* 5 · Mothers of forest and water                                     */
/* ================================================================== */
const Forest: React.FC<{ beat: number }> = ({ beat }) => (
  <>
    <Layer depth={0.45}>
      <Mountain x={250} base={640} w={640} h={460} />
      <Mountain x={800} base={640} w={700} h={520} f={INK.greenLight} />
      <Mountain x={1350} base={640} w={560} h={380} />
      <Cloud x={2200} y={160} w={300} seed={61} className="a-drift" />
      <Moon x={2900} y={170} />
    </Layer>
    <Layer>
      {/* the forest */}
      <S d="M-200 620Q800 580 1700 620L1700 1000L-200 1000Z" f={INK.greenLight} tex="tx-grass" />
      <Pine x={180} base={760} s={1.2} />
      <Pine x={1420} base={770} s={1.1} />
      <Bamboo x={340} base={800} h={380} lean={20} />
      <Bamboo x={1250} base={800} h={360} lean={-18} delay={0.6} />
      <S d="M620 760Q640 650 800 640Q960 650 980 760Z" f={INK.gray} tex="tx-hatch" />
      <Person x={800} y={700} s={0.78} seated robe={INK.green} accent={INK.hoe} head="crown" />
      <Deer x={470} y={850} s={0.85} className="a-plod" />
      <Deer x={1130} y={860} s={0.75} flip />
      <Crane x={1180} y={300} s={0.5} className="a-fly" />
      <Inscription x={1530} y={120} lines={['Mẫu', 'Thượng Ngàn']} size={30} />
      {/* the waters */}
      <S d="M1650 0L3400 0L3400 600L1650 600Z" f={INK.chamLight} opacity={0.35} k={0} />
      <Waves x0={1640} x1={3400} y={580} h={500} />
      <Lotus x={2400} y={600} s={1.4} />
      <Person x={2400} y={520} s={0.78} robe="#f7f2e6" accent={INK.cham} sash={INK.chamLight} head="crown" pose="open" />
      <Dragon x={2430} y={760} s={0.95} color={INK.chamLight} speed={0.8} />
      <Carp x={1980} y={700} s={0.8} className="a-jump" />
      <Carp x={2860} y={710} s={0.8} flip c={INK.hoe} className="a-jump" style={{ animationDelay: '1.3s' }} />
      <Inscription x={3130} y={140} lines={['Mẫu', 'Thoải']} size={34} />
      {/* the earth */}
      <S d="M600 1000L2600 1000L2600 1900L600 1900Z" f={INK.hoe} tex="tx-grass" k={0} />
      <Cloud x={1000} y={1010} w={420} seed={71} />
      <Cloud x={2200} y={1020} w={420} seed={72} />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`translate(${960 + i * 100 + (i > 3 ? 280 : 0)} ${1700 + (i % 2) * 40})`} className="a-sway" style={{ transformOrigin: '0px 0px', animationDelay: `${i * 0.25}s` }}>
          <L d="M0 0L-20 -90M0 0L0 -100M0 0L20 -90" w={6} c={INK.brown} />
          <S d="M-16 -50L16 -50L14 -38L-14 -38Z" f={INK.son} k={2.5} />
        </g>
      ))}
      <Throne x={1600} y={1560} s={0.75} />
      <Person x={1600} y={1560} s={0.74} seated robe={INK.hoe} accent={INK.son} head="crown" />
      <Buffalo x={1180} y={1860} s={0.6} className="a-plod" />
      <Person x={2050} y={1860} s={0.45} robe={INK.brown} accent={INK.son} head="hat" pose="open" />
      <Candle x={2300} y={1820} s={0.9} />
      <Inscription x={2470} y={1150} lines={['Mẫu', 'Địa']} size={34} />
    </Layer>
  </>
);

/* ================================================================== */
/* 6 · Hầu đồng                                                        */
/* ================================================================== */
const HauDong: React.FC<{ beat: number }> = ({ beat }) => (
  <>
    <Layer depth={0.6}>
      <Roof x={800} y={160} w={1000} h={70} f={INK.sonDeep} />
      <S d="M330 190L1270 190L1270 470L330 470Z" f={INK.sonDeep} tex="tx-swirl" />
      <S d="M370 220L1230 220L1230 300L370 300Z" f={INK.hoe} tex="tx-hatch" />
      <S d="M350 400L1250 400L1250 440L350 440Z" f={INK.hoe} tex="tx-hatch" />
      {[
        [620, INK.green],
        [800, INK.son],
        [980, '#f7f2e6'],
      ].map(([x, c]) => (
        <Person key={x as number} x={x as number} y={398} s={0.3} seated robe={c as string} accent={INK.hoe} head="crown" idle={false} />
      ))}
      {[420, 500, 1100, 1180].map((x, i) => (
        <Candle key={x} x={x} y={398} s={0.8} delay={i * 0.17} />
      ))}
      <Lotus x={560} y={300} s={0.5} />
      <Lotus x={1040} y={300} s={0.5} />
      {[230, 1370].map((x, i) => (
        <Lantern key={x} x={x} y={250} s={1.1} delay={i * 0.5} />
      ))}
    </Layer>
    <Layer>
      <S d="M380 760L1220 760L1300 900L300 900Z" f={INK.son} tex="tx-rings" />
      {/* musicians */}
      <Person x={230} y={860} s={0.72} seated robe={INK.cham} accent={INK.diep} head="scholar" pose="lute" />
      <Person x={420} y={870} s={0.62} seated robe={INK.brown} accent={INK.hoe} head="topknot" pose="joined" />
      <g transform="translate(1380 860)">
        <S d="M-70 0L-70 -100L70 -100L70 0Z" f={INK.son} tex="tx-dots" />
        <S d={ell(0, -100, 70, 22)} f={INK.diep} k={4} className="a-drumskin" />
      </g>
      <Person x={1220} y={870} s={0.62} seated robe={INK.cham} accent={INK.diep} head="topknot" pose="open" />
      <g className="a-notes">
        {['♪', '♫', '♪', '♬'].map((n, i) => (
          <text key={i} x={300 + i * 40} y={560 - (i % 2) * 40} fontSize={40} fill={INK.diep} style={{ animationDelay: `${i * 0.5}s` }} className="a-note">
            {n}
          </text>
        ))}
      </g>
      <At beat={beat} from={0} until={1}>
        <Person x={800} y={850} s={0.95} seated robe={INK.son} accent={INK.hoe} head="veil" robeClass={beat === 1 ? 'a-robes' : undefined} />
        <Person x={600} y={870} s={0.55} seated robe={INK.diep} accent={INK.son} pose="offer" />
        <Person x={1000} y={870} s={0.55} seated robe={INK.diep} accent={INK.son} pose="offer" flip />
      </At>
      <At beat={beat} from={1} until={1}>
        <g className="a-veilspin" style={{ transformOrigin: '800px 600px' }}>
          <S d="M740 560Q800 520 860 560L880 640Q800 670 720 640Z" f={INK.son} tex="tx-swirl" />
        </g>
      </At>
      <At beat={beat} from={2} until={2}>
        <g className="a-dance" style={{ transformOrigin: '800px 860px' }}>
          <Person x={800} y={860} s={0.92} robe={INK.green} accent={INK.pink} sash={INK.hoe} head="khan" pose="fans" />
        </g>
        {Array.from({ length: 16 }, (_, i) => (
          <Envelope key={i} x={200 + i * 80} y={-40} delay={(i * 0.43) % 3.4} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <Person key={i} x={250 + i * 180} y={980} s={0.34} robe={[INK.son, INK.cham, INK.brown][i % 3]} accent={INK.hoe} pose="open" />
        ))}
      </At>
      <At beat={beat} from={3}>
        <circle cx={800} cy={640} r={320} fill="url(#glow-gold)" className="a-glow" />
        <g className="a-spin-slow" style={{ transformOrigin: '800px 640px' }}>
          <L d={`${circ(800, 640, 240)}`} w={3} c={INK.hoeLight} />
          {Array.from({ length: 16 }, (_, i) => (
            <S key={i} d={circ(800 + Math.cos((i / 16) * Math.PI * 2) * 240, 640 + Math.sin((i / 16) * Math.PI * 2) * 240, 7)} f={INK.hoe} k={2} tight />
          ))}
        </g>
        <Person x={800} y={850} s={0.98} seated robe="#f7f2e6" accent={INK.son} sash={INK.son} head="veil" />
        <Person x={600} y={870} s={0.55} seated robe={INK.diep} accent={INK.son} pose="bow" className="a-bowdown" />
        <Person x={1000} y={870} s={0.55} seated robe={INK.diep} accent={INK.son} pose="bow" flip className="a-bowdown" />
      </At>
    </Layer>
  </>
);

/* ================================================================== */
/* 7 · A living heritage                                               */
/* ================================================================== */
const Heritage: React.FC<{ beat: number }> = ({ beat }) => (
  <>
    <At beat={beat} from={0} until={0}>
      <Layer>
        <S d="M200 120L1400 120L1400 900L200 900Z" f="#9d8a6e" tex="tx-hatch" k={0} />
        <S d="M1060 220L1260 220L1260 420L1060 420Z" f="#2d2a3a" k={5} />
        <Moon x={1160} y={320} r={40} />
        <L d="M1160 220L1160 420M1060 320L1260 320" w={5} />
        <S d="M420 640L940 640L940 680L420 680Z" f={INK.brown} k={4} />
        <L d="M450 680L450 860M910 680L910 860" w={8} />
        <Candle x={680} y={640} s={1.1} />
        <L d="M600 640l0 -60M610 640l0 -58" w={3} c={INK.son} />
        <L d="M604 580q-14 -30 4 -58q16 -26 -2 -58" w={2.4} c="#d8cfc0" className="a-smoke" />
        <Person x={520} y={880} s={0.8} seated robe={INK.brown} accent={INK.cham} sash={INK.cham} pose="joined" />
        <S d="M820 860L960 860L960 820L820 820Z" f={INK.diep} tex="tx-hatch" />
      </Layer>
    </At>
    <At beat={beat} from={1} until={1}>
      <Layer>
        {Array.from({ length: 22 }, (_, i) => (
          <g key={i} transform={`translate(${60 + i * 72} -30)`}>
            <g className="a-fall" style={{ animationDelay: `${(i * 0.37) % 4}s` }}>
              <S d="M0 0q10 -12 20 0q-10 12 -20 0Z" f={INK.pink} k={2} tight />
            </g>
          </g>
        ))}
        <g transform="translate(800 400)">
          <g className="a-pop">
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 30})`}>
                <S d="M0 -150Q-30 -200 0 -250Q30 -200 0 -150Z" f={i % 2 ? INK.pink : INK.hoe} k={3.5} />
              </g>
            ))}
            <S d={circ(0, 0, 160)} f={INK.diep} k={7} />
            <L d={circ(0, 0, 140)} w={2.5} />
            <text y={-6} textAnchor="middle" fontSize={92} fontWeight={700} fill={INK.son} fontFamily="'Noto Serif', serif" className="ink ink-p4">
              2016
            </text>
            <text y={44} textAnchor="middle" fontSize={20} fontWeight={700} fill={INK.key} fontFamily="'Noto Serif', serif" className="ink ink-p4">
              Di sản văn hóa phi vật thể
            </text>
            <text y={74} textAnchor="middle" fontSize={17} fontStyle="italic" fill={INK.key} fontFamily="'Noto Serif', serif" className="ink ink-p4">
              of humanity · của nhân loại
            </text>
          </g>
        </g>
        {Array.from({ length: 11 }, (_, i) => (
          <Person key={i} x={130 + i * 134} y={905} s={0.42} robe={[INK.son, INK.green, '#f7f2e6', INK.hoe, INK.cham][i % 5]} accent={[INK.hoe, INK.son][i % 2]} head={i % 4 === 3 ? 'topknot' : 'khan'} pose={i % 3 === 0 ? 'wave' : 'open'} />
        ))}
        {[260, 800, 1340].map((x, i) => (
          <Flag key={x} x={x} base={760} h={220} c={[INK.son, INK.hoe, INK.green][i]} delay={i * 0.4} />
        ))}
      </Layer>
    </At>
    <At beat={beat} from={2}>
      <Layer depth={0.4}>
        <Moon x={1300} y={150} />
        <Mountain x={240} base={620} w={600} h={300} f={INK.greenLight} />
        <Mountain x={1380} base={620} w={600} h={340} />
      </Layer>
      <Layer>
        <TempleFront x={800} y={720} s={0.86} name="PHỦ VÂN THỦY" />
        {[420, 1180].map((x, i) => (
          <Lantern key={x} x={x} y={430} s={0.9} delay={i * 0.6} />
        ))}
        <Waves x0={-200} x1={1800} y={760} h={400} />
        {beat >= 3 &&
          Array.from({ length: 9 }, (_, i) => (
            <g key={i} transform={`translate(${-60 - i * 190} ${830 + (i % 3) * 22})`}>
              <g className="a-floatx" style={{ animationDelay: `${i * 0.7}s` }}>
                <Lotus x={0} y={0} s={0.42} />
                <Candle x={0} y={-30} s={0.4} />
              </g>
            </g>
          ))}
        {beat >= 3 &&
          Array.from({ length: 10 }, (_, i) => (
            <g key={`s${i}`} transform={`translate(${120 + i * 150} ${980})`}>
              <g className="a-rise" style={{ animationDelay: `${(i * 0.83) % 5}s` }}>
                <Lantern x={0} y={0} s={0.55} className="" />
              </g>
            </g>
          ))}
      </Layer>
    </At>
  </>
);

export const SCENES: Record<FilmScene, SceneDef> = {
  origins: {
    wash: () => '#efdcae',
    cams: [{ x: 800, y: 470, z: 1 }, { x: 800, y: 300, z: 1.16 }, { x: 800, y: 450, z: 1 }, { x: 800, y: 520, z: 1.12 }],
    Body: Origins,
    wipeAt: [2, 3],
  },
  palaces: {
    wash: () => '#f0d3be',
    cams: [{ x: 800, y: 380, z: 1.25 }, { x: 800, y: 470, z: 1 }, { x: 620, y: 480, z: 1.22, t: 3.4 }, { x: 1300, y: 480, z: 1.55 }, { x: 800, y: 560, z: 0.9 }],
    Body: Palaces,
    ambient: 'motes',
  },
  cup: {
    wash: (b) => (b >= 3 ? '#ecd9a8' : '#f3d4c4'),
    cams: [{ x: 800, y: 470, z: 1 }, { x: 640, y: 640, z: 1.75 }, { x: 800, y: 1180, z: 0.82, t: 6.5 }, { x: 800, y: 1560, z: 1, t: 3 }, { x: 800, y: 1380, z: 0.86, t: 5 }],
    Body: Cup,
    wipeAt: [3],
  },
  return: {
    wash: (b) => (b === 3 ? '#cbb48c' : '#efe0bd'),
    dim: (b) => (b === 3 ? 0.12 : 0),
    cams: [{ x: 800, y: 480, z: 1 }, { x: 2470, y: 520, z: 1.05, t: 5.5 }, { x: 800, y: 450, z: 1 }, { x: 800, y: 450, z: 1 }],
    Body: Return,
    wipeAt: [2, 3],
    ambient: 'petals',
  },
  forest: {
    wash: () => '#e6e2bd',
    cams: [{ x: 800, y: 470, z: 1 }, { x: 2420, y: 470, z: 1, t: 4.5 }, { x: 1600, y: 1420, z: 1, t: 4.5 }],
    Body: Forest,
    ambient: 'petals',
  },
  haudong: {
    wash: () => '#b7553d',
    cams: [{ x: 800, y: 470, z: 1 }, { x: 800, y: 600, z: 1.35 }, { x: 800, y: 500, z: 1.06 }, { x: 800, y: 560, z: 1.28 }],
    Body: HauDong,
    wipeAt: [2, 3],
    ambient: 'embers',
  },
  heritage: {
    wash: (b) => (b === 0 ? '#cfc2a2' : b === 1 ? '#efdcae' : '#e7c79a'),
    dim: (b) => (b === 0 ? 0.22 : b >= 3 ? 0.18 : 0.05),
    cams: [{ x: 760, y: 560, z: 1.18 }, { x: 800, y: 450, z: 1 }, { x: 800, y: 470, z: 1 }, { x: 800, y: 400, z: 0.92, t: 5 }],
    Body: Heritage,
    wipeAt: [1, 2],
    ambient: 'motes',
  },
};
