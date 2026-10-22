import React, { useId } from 'react';
import type { LocKind } from '../data/rituals';

/**
 * Hand-drawn SVG for the lộc and amulets, and the four palace scarves (khăn).
 * Each sits in a 60×80 box; pass `size` as the width in px.
 */
const Svg: React.FC<{ size: number; children: React.ReactNode; title?: string; h?: number }> = ({ size, children, title, h = 80 }) => (
  <svg viewBox={`0 0 60 ${h}`} width={size} height={(size * h) / 60} className="shrink-0 overflow-visible" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    {children}
  </svg>
);

const String_ = ({ c = '#c0262d' }: { c?: string }) => <path d="M24 16Q30 0 36 16" stroke={c} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
const Knot = ({ c = '#c0262d', y = 16 }: { c?: string; y?: number }) => <circle cx="30" cy={y} r="2.8" fill={c} />;
const Tassel = ({ c = '#f2c14e', y = 70 }: { c?: string; y?: number }) => (
  <g>
    <circle cx="30" cy={y} r="2.4" fill={c} />
    {[-3, -1.5, 0, 1.5, 3].map((dx) => (
      <path key={dx} d={`M30 ${y + 1}L${30 + dx * 1.2} ${y + 12}`} stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    ))}
  </g>
);

export const LocArt: React.FC<{ kind: LocKind; size?: number; title?: string }> = ({ kind, size = 56, title }) => {
  const id = useId().replace(/:/g, '');
  switch (kind) {
    case 'binh-an':
      return (
        <Svg size={size} title={title}>
          <String_ />
          <path d="M14 22Q30 14 46 22V62Q46 68 40 68H20Q14 68 14 62Z" fill="#c0262d" stroke="#7d1414" strokeWidth="1.6" />
          <path d="M18 25Q30 19 42 25V60Q42 64 38 64H22Q18 64 18 60Z" fill="none" stroke="#f2c14e" strokeWidth="0.8" strokeDasharray="1.5 1.3" />
          <circle cx="30" cy="42" r="10" fill="#fff6e0" stroke="#f2c14e" strokeWidth="1.2" />
          <text x="30" y="45" textAnchor="middle" fontSize="8" fontWeight="700" fill="#c0262d" fontFamily="'Noto Serif', serif">AN</text>
          <Knot />
          <Tassel y={70} />
        </Svg>
      );
    case 'tai-loc':
      return (
        <Svg size={size} title={title}>
          <defs>
            <pattern id={`b${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#d9a21a" />
              <path d="M0 4Q2 0 4 4T8 4" stroke="#f6dc7a" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <path d="M22 18Q30 22 38 18L44 26Q52 46 44 62Q38 70 30 70Q22 70 16 62Q8 46 16 26Z" fill={`url(#b${id})`} stroke="#8a5a00" strokeWidth="1.6" />
          <path d="M20 26Q30 31 40 26" stroke="#c0262d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="48" r="8" fill="#c0262d" />
          <text x="30" y="51" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#f6dc7a" fontFamily="'Noto Serif', serif">LỘC</text>
          <path d="M22 18Q30 8 38 18" stroke="#c0262d" strokeWidth="2.2" fill="none" />
          <Tassel c="#c0262d" y={72} />
        </Svg>
      );
    case 'chi-do':
      return (
        <Svg size={size} title={title}>
          <ellipse cx="30" cy="44" rx="20" ry="20" fill="none" stroke="#d6364b" strokeWidth="3.4" />
          <ellipse cx="30" cy="44" rx="20" ry="20" fill="none" stroke="#ff8a98" strokeWidth="1" strokeDasharray="2 3" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={30 + Math.cos(1.2 + i * 0.35) * 20} cy={44 + Math.sin(1.2 + i * 0.35) * 20} r={i === 1 ? 4 : 3} fill={i === 1 ? '#f2c14e' : '#d6364b'} stroke="#7d1414" strokeWidth="0.6" />
          ))}
          <path d="M26 24L22 14M34 24L38 14" stroke="#d6364b" strokeWidth="2" strokeLinecap="round" />
          <circle cx="30" cy="24" r="3.2" fill="#d6364b" />
          <path d="M23 40Q26 36 29 40Q32 44 30 47Q28 50 23 46Q20 43 23 40Z" fill="#ffb3c0" opacity="0.8" transform="translate(4 -2)" />
        </Svg>
      );
    case 'dong-tien':
      return (
        <Svg size={size} title={title}>
          <String_ />
          <path d="M30 16V28" stroke="#c0262d" strokeWidth="2.2" />
          <circle cx="30" cy="46" r="17" fill="#d9a21a" stroke="#8a5a00" strokeWidth="1.8" />
          <circle cx="30" cy="46" r="13.5" fill="none" stroke="#8a5a00" strokeWidth="0.8" />
          <rect x="25" y="41" width="10" height="10" fill="#fbf3e2" stroke="#8a5a00" strokeWidth="1.2" />
          {[['AN', 30, 38.5], ['LỘC', 30, 57.5], ['PHÚC', 19.6, 48.5], ['THỌ', 40.4, 48.5]].map(([c, x, y]) => (
            <text key={c as string} x={x as number} y={y as number} textAnchor="middle" fontSize="4" fontWeight="700" fill="#6b4500" fontFamily="'Noto Serif', serif">
              {c}
            </text>
          ))}
          <Knot />
          <path d="M30 63V72" stroke="#c0262d" strokeWidth="2.2" />
          <Tassel c="#c0262d" y={72} />
        </Svg>
      );
    case 'the-sen':
      return (
        <Svg size={size} title={title}>
          <String_ c="#7a5230" />
          <path d="M16 22L30 14L44 22V66Q44 70 40 70H20Q16 70 16 66Z" fill="#c9965e" stroke="#6b4426" strokeWidth="1.6" />
          <path d="M19 25L30 18.5L41 25V64Q41 67 38 67H22Q19 67 19 64Z" fill="none" stroke="#8a5a30" strokeWidth="0.6" />
          <circle cx="30" cy="22" r="1.8" fill="#6b4426" />
          {/* lotus */}
          <g transform="translate(30 48)">
            {[-40, -15, 15, 40].map((a) => (
              <ellipse key={a} rx="4" ry="10" fill="#f3a5bf" stroke="#c94a6a" strokeWidth="0.7" transform={`rotate(${a}) translate(0 -6)`} />
            ))}
            <ellipse rx="4.2" ry="11" fill="#fbd0dc" stroke="#c94a6a" strokeWidth="0.7" transform="translate(0 -6)" />
            <path d="M-12 6Q0 12 12 6" stroke="#4f8a3e" strokeWidth="2" fill="none" />
          </g>
          <text x="30" y="64" textAnchor="middle" fontSize="5" fontWeight="700" fill="#4a2f14" fontFamily="'Noto Serif', serif">TÂM AN</text>
        </Svg>
      );
    case 'quat':
      return (
        <Svg size={size} title={title}>
          <g transform="translate(30 62)">
            {Array.from({ length: 9 }, (_, i) => -64 + i * 16).map((a, i) => (
              <path key={a} d="M0 0L-5 -40L5 -40Z" fill={i % 2 ? '#3f9a5a' : '#2f8a4a'} stroke="#1f5a30" strokeWidth="0.5" transform={`rotate(${a})`} />
            ))}
            <path d="M-36 -18A40 40 0 0 1 36 -18" stroke="#f2c14e" strokeWidth="2" fill="none" transform="scale(1.04)" />
            <circle r="3" fill="#f2c14e" stroke="#8a5a00" strokeWidth="0.8" />
            <circle cx="-8" cy="-26" r="3" fill="#f3a5bf" />
            <circle cx="6" cy="-30" r="2.5" fill="#fbd0dc" />
            <circle cx="14" cy="-22" r="2.2" fill="#f3a5bf" />
          </g>
          <Tassel c="#c0262d" y={66} />
        </Svg>
      );
  }
};

/** A folded silk scarf (khăn) in a palace colour */
export const KhanArt: React.FC<{ color: string; size?: number; dim?: boolean; title?: string }> = ({ color, size = 56, dim, title }) => {
  const id = useId().replace(/:/g, '');
  const light = color === '#e9e6dc';
  return (
    <svg viewBox="0 0 60 50" width={size} height={(size * 50) / 60} className={`shrink-0 transition-opacity ${dim ? 'opacity-25 grayscale' : ''}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`k${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d="M6 14Q30 6 54 14L50 36Q30 44 10 36Z" fill={color} stroke={light ? '#a9a596' : '#00000044'} strokeWidth="1.2" />
      <path d="M6 14Q30 6 54 14L50 36Q30 44 10 36Z" fill={`url(#k${id})`} />
      <path d="M10 20Q30 13 50 20M11 27Q30 20 49 27" stroke={light ? '#c8c3b2' : '#ffffff55'} strokeWidth="1" fill="none" />
      <path d="M44 36L48 47M48 36L53 46" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 36Q30 44 52 36" stroke="#f2c14e" strokeWidth="1.4" fill="none" strokeDasharray="2 1.5" />
    </svg>
  );
};
