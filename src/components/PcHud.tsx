import React, { useEffect, useRef, useState } from 'react';
import { Sheet } from './ui/Sheet';
import { WORLD } from '../three/world/phuVanThuy';
import type { SpotDef } from '../three/world/types';
import { soundService } from '../services/soundService';

/* ------------------------------------------------------------------ */
/* Settings (saved per browser)                                        */
/* ------------------------------------------------------------------ */
export interface Settings {
  sensitivity: number;
  invertY: boolean;
  pointerLock: boolean;
  quality: 'high' | 'low';
  fov: number;
  minimap: boolean;
}
const KEY = 'pvt_settings';
export const DEFAULT_SETTINGS: Settings = { sensitivity: 1, invertY: false, pointerLock: true, quality: 'high', fov: 62, minimap: true };
export function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export const SettingsSheet: React.FC<{ value: Settings; onChange: (s: Settings) => void; onClose: () => void }> = ({ value, onChange, onClose }) => {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...value, [k]: v });
  const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#ece2cf] last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[#2a1d14]">{label}</div>
        {hint && <div className="text-xs text-[#5a4837]">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
  const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onToggle} className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${on ? 'bg-[#8e1b1b]' : 'bg-[#d8cab2]'}`}>
      <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
  return (
    <Sheet onClose={onClose} size="md" label="Settings" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <h2 className="font-display font-bold text-xl text-[#2a1d14] pr-10">Settings</h2>
      <div className="mt-3">
        <Row label="Mouse sensitivity" hint="How fast the view turns">
          <input id="set-sens" type="range" min={0.3} max={2.5} step={0.1} value={value.sensitivity} onChange={(e) => set('sensitivity', Number(e.target.value))} className="w-36 accent-[#8e1b1b]" />
        </Row>
        <Row label="Invert vertical look">
          <Toggle on={value.invertY} onToggle={() => set('invertY', !value.invertY)} label="Invert vertical look" />
        </Row>
        <Row label="Capture the mouse" hint="Click the view to look around freely; Esc releases it">
          <Toggle on={value.pointerLock} onToggle={() => set('pointerLock', !value.pointerLock)} label="Capture the mouse" />
        </Row>
        <Row label="Field of view" hint={`${value.fov}°`}>
          <input id="set-fov" type="range" min={50} max={85} step={1} value={value.fov} onChange={(e) => set('fov', Number(e.target.value))} className="w-36 accent-[#8e1b1b]" />
        </Row>
        <Row label="Graphics" hint="Low is smoother on older laptops">
          <div className="flex p-0.5 rounded-lg bg-[#ece2cf]">
            {(['high', 'low'] as const).map((q) => (
              <button key={q} onClick={() => set('quality', q)} aria-pressed={value.quality === q} className={`px-3 py-1.5 rounded-md text-sm font-semibold cursor-pointer ${value.quality === q ? 'bg-[#fffaf0] text-[#8e1b1b] shadow-sm' : 'text-[#5a4837]'}`}>
                {q === 'high' ? 'High' : 'Low'}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Minimap">
          <Toggle on={value.minimap} onToggle={() => set('minimap', !value.minimap)} label="Minimap" />
        </Row>
      </div>
    </Sheet>
  );
};

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */
const KEYS: [string, string][] = [
  ['↑ / ↓', 'Walk forward and back'],
  ['← / →', 'Turn left and right'],
  ['W A S D', 'Walk and step sideways'],
  ['Shift', 'Hurry (not inside the temple!)'],
  ['Mouse', 'Click the view to look around; drag also works'],
  ['Click', 'A golden marker takes you to that place'],
  ['E / Enter', 'Use what is in front of you'],
  ['B', 'Vái: bow with joined hands'],
  ['PgUp / PgDn', 'Look up and down'],
  ['J', 'Journal'],
  ['T', 'Secret trail'],
  ['F', 'Film: the legend of the Mothers'],
  ['M', 'Minimap on/off'],
  ['H', 'Hide or show the control bar'],
  ['1 / 2 / 3', 'Day, dusk, night'],
  ['Esc', 'Release the mouse, then step back one level'],
  ['?', 'This list'],
];
export const ControlsSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Sheet onClose={onClose} size="md" label="Controls" className="px-5 sm:px-7 pt-3 sm:pt-6">
    <h2 className="font-display font-bold text-xl text-[#2a1d14] pr-10">Controls</h2>
    <dl className="mt-3 divide-y divide-[#ece2cf]">
      {KEYS.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2.5">
          <dt className="flex flex-wrap gap-1">
            {k.split(' / ').map((part) => (
              <kbd key={part} className="px-2 py-1 rounded-md border border-[#d8cab2] bg-[#fffaf0] text-xs font-semibold text-[#2a1d14] shadow-[0_1px_0_#d8cab2]">
                {part}
              </kbd>
            ))}
          </dt>
          <dd className="text-sm text-[#3d3124] text-right">{v}</dd>
        </div>
      ))}
    </dl>
  </Sheet>
);

/* ------------------------------------------------------------------ */
/* Minimap: the temple from above, north (toward the hall) up          */
/* ------------------------------------------------------------------ */
const X0 = -34, X1 = 34, Z0 = -26, Z1 = 68;
export const Minimap: React.FC<{ spots: SpotDef[]; getPlayer: () => { x: number; z: number; rotY: number } | null; onGo: (id: string) => void; near?: string | null }> = ({ spots, getPlayer, onGo, near }) => {
  const [p, setP] = useState<{ x: number; z: number; rotY: number } | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setP(getPlayer()), 120);
    return () => clearInterval(id);
  }, [getPlayer]);
  const W = 176, H = (W * (Z1 - Z0)) / (X1 - X0);
  const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
  const sz = (z: number) => ((z - Z0) / (Z1 - Z0)) * H;
  const { HALL, POND, BANYAN, GROTTO, BELL, GATE_Z } = WORLD;
  const inMap = p && p.x > X0 && p.x < X1 && p.z > Z0 && p.z < Z1;
  return (
    <div className="rounded-2xl bg-[#fbf3e2]/92 backdrop-blur-md border border-[#d9c7a6] shadow-lg p-2" aria-label="Minimap">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
        <rect width={W} height={H} rx="10" fill="#cfd8b0" />
        {/* river */}
        <rect x="0" y={sz(63)} width={W} height={H - sz(63)} fill="#7fb2ad" />
        {/* enclosure and courtyard */}
        <rect x={sx(-32)} y={sz(-24)} width={sx(32) - sx(-32)} height={sz(GATE_Z) - sz(-24)} fill="#c98a6a" stroke="#d9a441" strokeWidth="2" />
        {/* path */}
        <rect x={sx(-2)} y={sz(-2)} width={sx(2) - sx(-2)} height={sz(63) - sz(-2)} fill="#b9b3a6" />
        {/* gate */}
        <rect x={sx(-9)} y={sz(GATE_Z) - 3} width={sx(9) - sx(-9)} height="6" fill="#8e1b1b" />
        {/* hall */}
        <rect x={sx(-HALL.w / 2)} y={sz(HALL.z - HALL.d / 2)} width={sx(HALL.w / 2) - sx(-HALL.w / 2)} height={sz(HALL.z + HALL.d / 2) - sz(HALL.z - HALL.d / 2)} fill="#8e1b1b" rx="2" />
        <text x={sx(0)} y={sz(HALL.z) + 3} textAnchor="middle" fontSize="8" fill="#f8e7c0" fontWeight="700">
          Hall
        </text>
        {/* pond, banyan, grotto, bell */}
        <path d={`M${sx(POND.x - POND.r)} ${sz(POND.z - 0.5)} A${(sx(POND.r) - sx(0))} ${(sz(POND.r) - sz(0))} 0 0 0 ${sx(POND.x + POND.r)} ${sz(POND.z - 0.5)} Z`} fill="#4f9a8a" />
        <circle cx={sx(BANYAN.x)} cy={sz(BANYAN.z)} r="8" fill="#3f6b35" />
        <circle cx={sx(GROTTO.x)} cy={sz(GROTTO.z)} r="6" fill="#5f6b5a" />
        <rect x={sx(BELL.x) - 5} y={sz(BELL.z) - 5} width="10" height="10" fill="#6b4a2a" />
        {/* spots */}
        {spots
          .filter((s) => s.type !== 'view')
          .map((s) => (
            <g key={s.id} onClick={() => onGo(s.id)} className="cursor-pointer">
              <title>{`${s.vi} · ${s.name} (click to go)`}</title>
              <circle cx={sx(s.at[0])} cy={sz(s.at[1])} r={near === s.id ? 5 : 3.5} fill={near === s.id ? '#f2c14e' : '#fffaf0'} stroke="#2a1d14" strokeWidth="1" />
            </g>
          ))}
        {/* you */}
        {inMap && p && (
          <g transform={`translate(${sx(p.x)} ${sz(p.z)}) rotate(${(-p.rotY * 180) / Math.PI})`}>
            <path d="M0 -8 L5.5 5 L0 2.5 L-5.5 5 Z" fill="#8e1b1b" stroke="#fff" strokeWidth="1.4" />
          </g>
        )}
        <text x="6" y="12" fontSize="9" fill="#2a1d14" fontWeight="700">
          N ↑
        </text>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Thả đèn hoa đăng: float a lotus lantern on the river                */
/* ------------------------------------------------------------------ */
const LANTERN_COLOURS: { c: number; name: string; css: string }[] = [
  { c: 0xf3a5bf, name: 'Pink lotus', css: '#f3a5bf' },
  { c: 0xfbf3f0, name: 'White lotus', css: '#fbf3f0' },
  { c: 0xe0412a, name: 'Red', css: '#e0412a' },
  { c: 0xf2c14e, name: 'Gold', css: '#f2c14e' },
];
export const LanternSheet: React.FC<{ onClose: () => void; onRelease: (color: number, wish: string) => void; night: boolean }> = ({ onClose, onRelease, night }) => {
  const [c, setC] = useState(0);
  const [wish, setWish] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <Sheet onClose={onClose} size="md" label="Floating lanterns" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <div className="text-center pr-6 sm:pr-0">
        <span className="text-xs uppercase tracking-[0.18em] text-[#8e1b1b] font-semibold">Thả đèn hoa đăng</span>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-[#2a1d14] mt-0.5">Float a lantern on the river</h2>
        <p className="text-[13px] text-[#5a4837] mt-1 max-w-md mx-auto">
          On full-moon nights people set paper lotus lanterns on rivers and lakes, each carrying a wish or the memory of someone loved, and watch them drift away.
        </p>
      </div>
      {!done ? (
        <div className="mt-4 space-y-4">
          <div className="flex justify-center gap-3" role="radiogroup" aria-label="Lantern colour">
            {LANTERN_COLOURS.map((l, i) => (
              <button key={l.name} role="radio" aria-checked={c === i} onClick={() => setC(i)} className={`flex flex-col items-center gap-1 p-2 rounded-xl border cursor-pointer ${c === i ? 'border-[#8e1b1b] bg-[#fbeedd]' : 'border-[#e0d2ba] bg-[#fffaf0]'}`}>
                <svg width="44" height="34" viewBox="0 0 44 34" aria-hidden>
                  <ellipse cx="22" cy="28" rx="20" ry="5" fill="#4f8a3e" />
                  {[-14, -7, 0, 7, 14].map((x) => (
                    <ellipse key={x} cx={22 + x * 0.9} cy={18} rx="5" ry="11" fill={l.css} stroke="#00000022" transform={`rotate(${x * 1.6} ${22 + x * 0.9} 26)`} />
                  ))}
                  <rect x="20" y="10" width="4" height="8" fill="#fff2d0" />
                  <path d="M22 4 Q24 8 22 10 Q20 8 22 4Z" fill="#ffb02e" />
                </svg>
                <span className="text-[11px] font-semibold text-[#2a1d14]">{l.name}</span>
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-[#2a1d14]">A wish, or a name to remember <span className="font-normal text-[#5a4837]">(optional, not saved)</span></span>
            <textarea id="lantern-wish" ref={ref} value={wish} onChange={(e) => setWish(e.target.value.slice(0, 120))} rows={2} placeholder="For Bà ngoại, wherever she is…" className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#fffaf0] border border-[#e0d2ba] text-sm focus:outline-none focus:border-[#8e1b1b]" />
          </label>
          {!night && <p className="text-xs text-[#8a5a00] bg-[#fdf3d8] border border-[#ecd9a0] rounded-lg px-3 py-2">Lanterns are lovelier after dark. Try the Time tab (or press 3) for night.</p>}
          <button
            onClick={() => {
              soundService.playBellChime();
              onRelease(LANTERN_COLOURS[c].c, wish.trim());
              setDone(true);
            }}
            className="w-full py-3 rounded-xl bg-[#8e1b1b] hover:bg-[#7a1515] text-[#fff4dc] text-sm font-semibold cursor-pointer"
          >
            Set it on the water
          </button>
        </div>
      ) : (
        <div className="mt-6 text-center space-y-3 pb-1">
          <p className="font-display text-[15px] text-[#2a1d14]">The lantern turns slowly on the current and drifts out toward the middle of the river.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setDone(false); setWish(''); }} className="px-5 py-2.5 rounded-xl border border-[#d8cab2] text-sm font-semibold cursor-pointer">
              Another
            </button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-[#ece2cf] text-sm font-semibold cursor-pointer">
              Watch it go
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
