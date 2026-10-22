import React, { createContext, useContext, useMemo } from 'react';

/**
 * The Đông Hồ "print kit".
 *
 * Real Đông Hồ prints are made one woodblock per colour on điệp paper (dó paper brushed with
 * crushed seashell, so it glints), with natural pigments: black from burnt bamboo leaves, red
 * from laterite (sỏi son), yellow from sophora flowers (hoa hòe), green from verdigris, indigo
 * from chàm leaves. The black key block is printed last, and the colour blocks never line up
 * perfectly with it.
 *
 * So every shape here is drawn twice: a flat colour block (slightly mis-registered, and printed
 * in its colour's pass) and a black key line on top. When a scene appears, the passes are
 * "pressed" one after another: yellow, red, green, indigo, then black.
 */

export const INK = {
  key: '#211a15',
  son: '#b8382b', // sỏi son red
  sonDeep: '#8f2a21',
  pink: '#e7a28f', // son on điệp
  hoe: '#e2b33b', // hoa hòe yellow
  hoeLight: '#f0d27e',
  green: '#4f8763', // verdigris
  greenLight: '#8db27a',
  cham: '#38597a', // chàm indigo
  chamLight: '#7f9fb4',
  diep: '#f3ead6', // seashell white
  skin: '#f5dcb8',
  brown: '#8b5d3b',
  gray: '#6d6a66',
  gold: '#d6a12b',
} as const;

type Pass = 0 | 1 | 2 | 3 | 4;
const PASS: Record<string, Pass> = {
  [INK.hoe]: 0,
  [INK.hoeLight]: 0,
  [INK.gold]: 0,
  [INK.skin]: 0,
  [INK.diep]: 0,
  [INK.son]: 1,
  [INK.sonDeep]: 1,
  [INK.pink]: 1,
  [INK.brown]: 1,
  [INK.green]: 2,
  [INK.greenLight]: 2,
  [INK.cham]: 3,
  [INK.chamLight]: 3,
  [INK.gray]: 3,
};
/** how far each colour block slips from the key block */
const MIS: Record<Pass, [number, number]> = { 0: [-2.5, 2], 1: [3, -2], 2: [2, 3], 3: [-3, -1.5], 4: [0, 0] };

export const passOf = (fill: string): Pass => PASS[fill] ?? 1;

interface ShapeProps {
  d: string;
  /** colour block fill (omit for line-only) */
  f?: string;
  /** key line width (0 = none) */
  k?: number;
  /** pattern overlay (an id from <InkDefs>) printed with the key block */
  tex?: string;
  className?: string;
  style?: React.CSSProperties;
  /** no mis-registration (for tiny details) */
  tight?: boolean;
  opacity?: number;
}

/** One printed shape: colour block + key line. */
export const S: React.FC<ShapeProps> = ({ d, f, k = 5, tex, className, style, tight, opacity }) => {
  const p = f ? passOf(f) : 4;
  const [mx, my] = tight ? [0, 0] : MIS[p];
  return (
    <g className={className} style={style} opacity={opacity}>
      {f && <path d={d} fill={f} transform={mx || my ? `translate(${mx} ${my})` : undefined} className={`ink ink-p${p}`} />}
      {tex && <path d={d} fill={`url(#${tex})`} className="ink ink-p4" />}
      {k > 0 && <path d={d} fill="none" stroke={INK.key} strokeWidth={k} strokeLinejoin="round" strokeLinecap="round" className="ink ink-p4" />}
    </g>
  );
};

/** Key-block line only (details, hatching) */
export const L: React.FC<{ d: string; w?: number; className?: string; c?: string; opacity?: number }> = ({ d, w = 4, className, c = INK.key, opacity }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" className={`ink ink-p4 ${className ?? ''}`} opacity={opacity} />
);

/** Solid key-block fill (hair, eyes, black animals) */
export const K: React.FC<{ d: string; className?: string; c?: string }> = ({ d, className, c = INK.key }) => <path d={d} fill={c} className={`ink ink-p4 ${className ?? ''}`} />;

export const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
export const ell = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

/** seeded random, so drawings are the same every time */
export function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/* ------------------------------------------------------------------ */
/* camera + parallax                                                    */
/* ------------------------------------------------------------------ */
export interface Cam {
  x: number;
  y: number;
  z: number;
  /** seconds for the move to this shot */
  t?: number;
}
export const CamCtx = createContext<Cam>({ x: 800, y: 450, z: 1 });

/** A parallax layer: depth 1 moves with the camera, smaller depths lag behind (far away), larger lead (close). */
export const Layer: React.FC<{ depth?: number; children: React.ReactNode }> = ({ depth = 1, children }) => {
  const c = useContext(CamCtx);
  const x = 800 + (c.x - 800) * depth;
  const y = 450 + (c.y - 450) * depth;
  const z = 1 + (c.z - 1) * depth;
  return (
    <g style={{ transform: `translate(800px, 450px) scale(${z}) translate(${-x}px, ${-y}px)`, transition: `transform ${c.t ?? 2.8}s cubic-bezier(.45,.05,.2,1)` }}>
      {children}
    </g>
  );
};

/** fades a group in when the narration reaches a beat (and out after `until`) */
export const At: React.FC<{ beat: number; from: number; until?: number; children: React.ReactNode; slow?: boolean }> = ({ beat, from, until, children, slow }) => {
  const on = beat >= from && (until === undefined || beat <= until);
  return (
    <g className={`beat ${on ? 'on' : ''} ${slow ? 'slow' : ''}`} aria-hidden={!on}>
      {children}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* paper, patterns, frame                                               */
/* ------------------------------------------------------------------ */
/** dó fibres and điệp glints, drawn once to two little textures */
export function usePaper() {
  return useMemo(() => {
    if (typeof document === 'undefined') return { fibre: '', glint: '' };
    const W = 800, H = 450;
    const a = document.createElement('canvas');
    a.width = W;
    a.height = H;
    const g = a.getContext('2d')!;
    const r = rng(7);
    // fibres
    for (let i = 0; i < 2600; i++) {
      const x = r() * W, y = r() * H, l = 3 + r() * 14, ang = r() * Math.PI;
      g.strokeStyle = `rgba(120,85,50,${0.04 + r() * 0.08})`;
      g.lineWidth = 0.6 + r() * 0.7;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(ang) * l * 0.5 + (r() - 0.5) * 3, y + Math.sin(ang) * l * 0.5, x + Math.cos(ang) * l, y + Math.sin(ang) * l);
      g.stroke();
    }
    // blotchy pigment absorption
    for (let i = 0; i < 70; i++) {
      const x = r() * W, y = r() * H, rr = 20 + r() * 70;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(140,100,60,${0.03 + r() * 0.04})`);
      gr.addColorStop(1, 'rgba(140,100,60,0)');
      g.fillStyle = gr;
      g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    const b = document.createElement('canvas');
    b.width = W;
    b.height = H;
    const h = b.getContext('2d')!;
    for (let i = 0; i < 1400; i++) {
      const x = r() * W, y = r() * H, s = 0.4 + r() * 1.3;
      h.fillStyle = r() < 0.3 ? `rgba(255,220,230,${0.25 + r() * 0.4})` : `rgba(255,255,250,${0.25 + r() * 0.5})`;
      h.beginPath();
      h.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * 3, 0, Math.PI * 2);
      h.fill();
    }
    return { fibre: a.toDataURL(), glint: b.toDataURL() };
  }, []);
}

/** shared patterns: key-block textures printed over colour blocks */
export const InkDefs: React.FC = () => (
  <defs>
    <pattern id="tx-dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="2.2" fill={INK.key} />
      <circle cx="16" cy="16" r="2.2" fill={INK.key} />
    </pattern>
    <pattern id="tx-rings" width="46" height="46" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="6" fill="none" stroke={INK.key} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="1.6" fill={INK.key} />
      <circle cx="35" cy="35" r="6" fill="none" stroke={INK.key} strokeWidth="2.2" />
      <circle cx="35" cy="35" r="1.6" fill={INK.key} />
    </pattern>
    <pattern id="tx-scales" width="26" height="16" patternUnits="userSpaceOnUse">
      <path d="M0 16a13 13 0 0 1 26 0M-13 8a13 13 0 0 1 26 0M13 8a13 13 0 0 1 26 0" fill="none" stroke={INK.key} strokeWidth="2.2" />
    </pattern>
    <pattern id="tx-hatch" width="18" height="12" patternUnits="userSpaceOnUse">
      <path d="M2 6q7 -4 14 0" fill="none" stroke={INK.key} strokeWidth="2" />
    </pattern>
    <pattern id="tx-grass" width="40" height="30" patternUnits="userSpaceOnUse">
      <path d="M8 26q2 -12 -2 -20M14 26q0 -10 6 -16M28 22q-2 -8 2 -14" fill="none" stroke={INK.key} strokeWidth="2" strokeLinecap="round" />
    </pattern>
    <pattern id="tx-swirl" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M30 30m-12 0a12 12 0 1 1 12 12a7 7 0 1 1 -7 -7a3 3 0 1 1 3 3" fill="none" stroke={INK.key} strokeWidth="2.2" />
    </pattern>
    <pattern id="tx-wave" width="120" height="44" patternUnits="userSpaceOnUse">
      <path d="M0 40q30 -36 60 0q30 -36 60 0M30 22q-8 -10 2 -14q8 -2 8 6" fill="none" stroke={INK.key} strokeWidth="3" strokeLinecap="round" />
      <path d="M-60 18q30 -36 60 0q30 -36 60 0q30 -36 60 0M90 0q-8 -10 2 -14" fill="none" stroke={INK.key} strokeWidth="3" strokeLinecap="round" />
      <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="120 0" dur="7s" repeatCount="indefinite" />
    </pattern>
    <pattern id="tx-wave-diep" width="120" height="44" patternUnits="userSpaceOnUse">
      <path d="M0 40q30 -36 60 0q30 -36 60 0" fill="none" stroke="#fff8ea" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="-120 0" dur="9s" repeatCount="indefinite" />
    </pattern>
    <radialGradient id="glow-gold">
      <stop offset="0" stopColor="#fff6d0" stopOpacity="0.95" />
      <stop offset="0.5" stopColor="#f4d27a" stopOpacity="0.45" />
      <stop offset="1" stopColor="#f4d27a" stopOpacity="0" />
    </radialGradient>
    <clipPath id="film-clip">
      <rect width="1600" height="900" />
    </clipPath>
  </defs>
);

/** The paper itself: a pigment wash, fibres, glints, and a printed double border */
export const Paper: React.FC<{ wash: string }> = ({ wash }) => <rect width="1600" height="900" fill={wash} style={{ transition: 'fill 1.4s ease' }} />;

export const PaperTop: React.FC<{ dim?: number }> = ({ dim = 0 }) => {
  const p = usePaper();
  return (
    <g pointerEvents="none">
      {p.fibre && <image href={p.fibre} width="1600" height="900" preserveAspectRatio="none" style={{ mixBlendMode: 'multiply' }} />}
      {p.glint && <image href={p.glint} width="1600" height="900" preserveAspectRatio="none" style={{ mixBlendMode: 'screen' }} className="glint" />}
      <rect width="1600" height="900" fill="#1a0f0a" opacity={dim} style={{ transition: 'opacity 1.4s ease' }} />
      {/* printed border, as on the prints themselves */}
      <rect x="14" y="14" width="1572" height="872" fill="none" stroke={INK.key} strokeWidth="7" />
      <rect x="26" y="26" width="1548" height="848" fill="none" stroke={INK.key} strokeWidth="2.5" />
    </g>
  );
};

/** a vertical calligraphy inscription, like the verses printed on the prints */
export const Inscription: React.FC<{ x: number; y: number; lines: string[]; size?: number; seal?: boolean; color?: string }> = ({ x, y, lines, size = 30, seal = true, color = INK.key }) => (
  <g transform={`translate(${x} ${y})`} className="ink ink-p4">
    {lines.map((col, ci) => (
      <g key={ci} transform={`translate(${-lines.slice(0, ci).reduce((w, c) => w + Math.max(...c.split(' ').map((x) => x.length)) * size * 0.62 + size * 0.5, 0)} 0)`}>
        {col.split(' ').map((w, i) => (
          <text key={i} y={i * size * 1.25} textAnchor="middle" fontSize={size} fontWeight={700} fontStyle="italic" fill={color} fontFamily="'Noto Serif', serif">
            {w}
          </text>
        ))}
      </g>
    ))}
    {seal && (
      <g transform={`translate(${-lines.reduce((w, c) => w + Math.max(...c.split(' ').map((x) => x.length)) * size * 0.62 + size * 0.5, 0) - size * 0.4} ${size * 0.2})`}>
        <rect x={-size * 0.55} y={-size * 0.9} width={size * 1.1} height={size * 1.1} fill={INK.son} className="ink ink-p1" />
        <text y={-size * 0.18} textAnchor="middle" fontSize={size * 0.42} fontWeight={700} fill={INK.diep} fontFamily="'Noto Serif', serif">
          Mẫu
        </text>
      </g>
    )}
  </g>
);
