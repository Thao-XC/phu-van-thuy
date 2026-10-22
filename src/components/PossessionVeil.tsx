import { useEffect, useRef, useState } from 'react';
import type { PossessEvent, PossessPhase } from '../three/possession';

/** a tiny event bus from the scene to the veil */
export function createPossessBus() {
  const subs = new Set<(e: PossessEvent) => void>();
  return {
    emit: (e: PossessEvent) => subs.forEach((f) => f(e)),
    on: (f: (e: PossessEvent) => void) => {
      subs.add(f);
      return () => void subs.delete(f);
    },
  };
}
export type PossessBus = ReturnType<typeof createPossessBus>;

interface Line {
  id: number;
  vi: string;
  en: string;
  who: 'mau' | 'them' | 'you';
  x: number;
  y: number;
}

/** words that surface out of the dark one letter at a time, in no order */
function Surfacing({ text, slow = 1 }: { text: string; slow?: number }) {
  const delays = useRef(text.split('').map(() => Math.random() * 1.4 * slow));
  return (
    <>
      {text.split('').map((c, i) => (
        <span key={i} className="surface-ch" style={{ animationDelay: `${delays.current[i].toFixed(2)}s` }}>
          {c}
        </span>
      ))}
    </>
  );
}

/**
 * What you see from inside the medium: the red veil (khăn phủ diện) over your eyes, the
 * Mother's words surfacing, the shapes whispering at the edges, and nothing else.
 */
export function PossessionVeil({ bus }: { bus: PossessBus }) {
  const [phase, setPhase] = useState<PossessPhase>('taken');
  const [aura, setAura] = useState('#ffffff');
  const [mau, setMau] = useState<Line | null>(null);
  const [them, setThem] = useState<Line[]>([]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [breath, setBreath] = useState(0);
  const id = useRef(0);

  useEffect(
    () =>
      bus.on((e) => {
        if (e.type === 'phase') {
          setPhase(e.phase);
          if (e.aura) setAura(e.aura);
          if (e.phase === 'leave') {
            setMau(null);
            setThem([]);
          }
        } else if (e.type === 'prompt') setPrompt(e.text);
        else if (e.type === 'breath') setBreath(e.v);
        else if (e.type === 'line') {
          const l: Line = { id: ++id.current, vi: e.vi, en: e.en, who: e.who, x: 0, y: 0 };
          if (e.who === 'them') {
            // from the edges, never the middle
            const side = Math.random() < 0.5;
            l.x = side ? 4 + Math.random() * 18 : 62 + Math.random() * 18;
            l.y = 18 + Math.random() * 58;
            setThem((t) => [...t.slice(-2), l]);
            window.setTimeout(() => setThem((t) => t.filter((x) => x.id !== l.id)), 4200);
          } else {
            setMau(l);
            window.setTimeout(() => setMau((m) => (m?.id === l.id ? null : m)), 6500);
          }
        }
      }),
    [bus],
  );

  const veilDown = phase === 'taken' || phase === 'veil';
  const lifted = phase === 'lift' || phase === 'dance';
  return (
    <div className="fixed inset-0 z-[46] pointer-events-none select-none overflow-hidden" aria-live="polite">
      {/* the touch: a white flash */}
      {phase === 'taken' && <div className="absolute inset-0 bg-white possess-flash" />}

      {/* the red veil */}
      <div
        className={`absolute -inset-[6%] veil-cloth ${veilDown ? 'veil-down' : ''} ${lifted ? 'veil-lifted' : ''} ${phase === 'taken' ? 'veil-drop' : ''}`}
        style={{ opacity: phase === 'leave' || phase === 'wake' ? 0 : 1 }}
      />

      {/* the spirit's colour at the edges of sight */}
      {phase === 'dance' && (
        <div
          className="absolute inset-0 aura-edge"
          style={{ background: `radial-gradient(ellipse at center, transparent 45%, ${aura}22 78%, ${aura}66 100%)` }}
        />
      )}
      {phase === 'lift' && <div className="absolute inset-0 aura-flash" style={{ background: aura }} />}

      {/* She goes: black, all at once; then you wake */}
      {(phase === 'leave' || phase === 'wake' || phase === 'done') && <div className={`absolute inset-0 bg-black ${phase !== 'leave' ? 'wake-fade' : ''}`} />}

      {/* the Mother's words */}
      {mau && (
        <div key={mau.id} className={`absolute inset-x-0 ${phase === 'dance' ? 'top-[14%]' : 'top-[38%]'} text-center px-6 line-out`}>
          <div className="dh-title text-3xl sm:text-5xl text-[#f8e9c8] [text-shadow:0_0_24px_rgba(255,120,60,.85),0_0_2px_#000] leading-tight">
            <Surfacing text={mau.vi} />
          </div>
          <div className="mt-3 font-display italic text-base sm:text-xl text-[#e9c9a0]/85 [text-shadow:0_0_10px_#000]">
            <Surfacing text={mau.en} slow={1.6} />
          </div>
        </div>
      )}

      {/* the shapes, whispering */}
      {them.map((l) => (
        <div key={l.id} className="absolute max-w-[30vw] them-line" style={{ left: `${l.x}%`, top: `${l.y}%` }}>
          <div className="font-display italic text-sm sm:text-lg text-[#e0a27a]/80 [text-shadow:0_0_8px_#000]">{l.vi}</div>
          <div className="font-display italic text-xs sm:text-sm text-[#c99878]/60">{l.en}</div>
        </div>
      ))}

      {(phase === 'wake' || phase === 'done') && (
        <div className="absolute inset-x-0 top-[44%] text-center px-6 line-out">
          <div className="font-display italic text-lg sm:text-2xl text-[#f1dfc0]/90">Bạn đã đi đâu đó một lúc.</div>
          <div className="mt-1 font-display italic text-sm sm:text-base text-[#d6c2a0]/75">You were gone, for a moment.</div>
        </div>
      )}

      {/* a quiet prompt, and the breath you have given Her */}
      {prompt && (
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-center rite-hint" key={prompt}>
          <div className="px-4 py-1.5 rounded-full bg-black/40 text-[13px] text-[#f1dcc0]">{prompt}</div>
          {phase === 'veil' && (
            <div className="mx-auto mt-2 h-[2px] w-40 bg-white/10 rounded overflow-hidden">
              <div className="h-full bg-[#ffb070] transition-[width] duration-300" style={{ width: `${breath * 100}%` }} />
            </div>
          )}
        </div>
      )}
      {phase !== 'wake' && phase !== 'done' && (
        <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 text-[11px] text-[#d8b8a0]/45">
          <kbd className="px-1 rounded border border-current">Esc</kbd> tỉnh dậy · wake
        </div>
      )}
    </div>
  );
}
