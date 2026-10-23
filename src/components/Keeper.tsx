import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KhanArt } from './LocArt';
import { KEEPER, PALACES } from '../data/story';
import { useStory } from '../services/storyService';
import { soundService } from '../services/soundService';
import { useBackLayer } from '../services/backStack';

/** Simple portrait of Bà Thủ Từ, the temple keeper */
export const KeeperFace: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="shrink-0">
    <circle cx="32" cy="32" r="31" fill="#f6e3c8" stroke="#c99212" strokeWidth="2" />
    <path d="M10 64Q12 44 32 42Q52 44 54 64Z" fill="#6d2a6a" />
    <path d="M26 42L32 50L38 42" fill="#f2c14e" />
    <circle cx="32" cy="28" r="12" fill="#e9c39b" />
    <path d="M18 24Q32 6 46 24Q46 18 32 14Q18 18 18 24Z" fill="#2a1a12" />
    <ellipse cx="32" cy="18" rx="15" ry="5" fill="#3a2418" />
    <circle cx="27.5" cy="29" r="1.3" fill="#2a1a12" />
    <circle cx="36.5" cy="29" r="1.3" fill="#2a1a12" />
    <path d="M28 35Q32 37.5 36 35" stroke="#a0453a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
);

type Msg = { from: 'you' | 'keeper'; text: string };
interface Line {
  text: string;
  khan?: boolean;
}

/** Offline answers, used when the AI keeper can't be reached */
function localReply(q: string): string {
  const s = q.toLowerCase();
  if (/incense|hương|nhang/.test(s)) return 'Odd numbers, one, three or five sticks. Light them at the great burner outside, hold them to your forehead and vái three times.';
  if (/door|cửa|gate|cổng/.test(s)) return 'The middle gate and the middle door are for the gods. People walk through the side ones, and step over the threshold, never on it.';
  if (/hầu đồng|len dong|lên đồng|medium|ceremony/.test(s)) return "In hầu đồng a medium becomes the vessel for the spirits, one after another, dressed in each palace's colours, while the cung văn sing. Bring the four scarves home and you will see it tonight.";
  if (/xăm|fortune|stick/.test(s)) return 'Kneel at the little table inside the hall, shake the tube until one stick falls, then ask the coins whether it really is your answer.';
  if (/sớ|petition|burn/.test(s)) return 'Write your sớ with a clear heart, then burn it in the brick furnace. The smoke carries it up.';
  if (/mẫu|mother|liễu hạnh/.test(s)) return 'Mẫu Liễu Hạnh came down from Heaven because she broke a jade cup, they say, and she loved this world so much she kept coming back to it.';
  if (/tiger|hổ|snake|rắn|lốt/.test(s)) return 'The Five Tigers sleep under the altar and the two snakes climb the pillars. Look closely and be polite to them.';
  return 'Ask with a sincere heart and the Mothers listen, whatever the words. Is there something about the temple I can explain?';
}
/** long answers are spoken a bubble at a time */
function chunk(text: string, max = 150): Line[] {
  const parts = text.replace(/\s+/g, ' ').trim().match(/[^.!?…]+[.!?…]*["”']?\s*/g) ?? [text];
  const out: string[] = [];
  parts.forEach((p) => {
    const last = out[out.length - 1];
    if (last && (last + p).length <= max) out[out.length - 1] = last + p;
    else out.push(p);
  });
  return out.map((t) => ({ text: t.trim() }));
}

/** the tail of a manga bubble, pointing down toward the speaker */
const Tail: React.FC<{ dx?: number; up?: boolean }> = ({ dx = 0, up }) => (
  <svg width="34" height="26" viewBox="0 0 34 26" className="absolute left-1/2 pointer-events-none" style={up ? { top: -23, transform: `translateX(calc(-50% + ${dx}px)) scaleY(-1)` } : { bottom: -23, transform: `translateX(calc(-50% + ${dx}px))` }} aria-hidden>
    <path d="M2 0 C 10 6, 14 14, 20 25 C 20 14, 24 6, 32 0" fill="#fffdf7" stroke="#16110d" strokeWidth="3" strokeLinejoin="round" />
    <rect x="3" y="-2" width="28" height="4" fill="#fffdf7" />
  </svg>
);

type Mode = 'say' | 'pledge' | 'menu' | 'ask' | 'waiting';
const MENU: [string, string][] = [
  ['Where are the scarves?', 'Khăn ở đâu ạ?'],
  ['May I ask you something?', 'Cho con hỏi…'],
  ['Goodbye', 'Con chào bà'],
];

/**
 * Talking with Bà Thủ Từ in the world: her words appear in a manga speech bubble over her head
 * as she says them; yours appear in a bubble at the bottom of your view. Keys only:
 * Space/Enter to go on, 1–3 (or ↑↓ + Enter) to answer, type to ask, Esc to step back.
 */
export const KeeperTalk: React.FC<{
  onClose: () => void;
  onStart: () => void;
  /** where her head is on screen right now */
  anchor: () => { x: number; y: number; on: boolean } | null;
}> = ({ onClose, onStart, anchor }) => {
  const story = useStory();
  const missing = PALACES.filter((p) => !story.khan.includes(p.id));
  const greeting = (): Line[] =>
    !story.started
      ? KEEPER.intro.map((t, i) => ({ text: t, khan: i === 2 }))
      : [{ text: story.ceremony ? KEEPER.after : missing.length === 0 ? KEEPER.ready : missing.length === 4 ? 'You came back. Where will you start? I can tell you where each palace hides.' : `${4 - missing.length} of four. The Mothers are pleased with you.` }];

  const [queue, setQueue] = useState<Line[]>(greeting);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [mode, setMode] = useState<Mode>('say');
  const after = useRef<Mode | 'close'>(story.started ? 'menu' : 'pledge');
  const [sel, setSel] = useState(0);
  const [draft, setDraft] = useState('');
  const [yourLine, setYourLine] = useState<string | null>(null);
  const msgs = useRef<Msg[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const line = queue[idx];
  const typing = mode === 'say' && line && shown < line.text.length;

  // her words come out at speaking pace
  useEffect(() => {
    if (mode !== 'say' || !line) return;
    if (shown >= line.text.length) return;
    const t = window.setTimeout(() => setShown((n) => Math.min(line.text.length, n + 3)), 16);
    return () => clearTimeout(t);
  }, [mode, line, shown]);

  const say = useCallback((lines: Line[], next: Mode | 'close') => {
    setQueue(lines);
    setIdx(0);
    setShown(0);
    setMode('say');
    after.current = next;
  }, []);

  const advance = useCallback(() => {
    if (mode !== 'say' || !line) return;
    if (shown < line.text.length) return setShown(line.text.length);
    if (idx < queue.length - 1) {
      setIdx(idx + 1);
      setShown(0);
      return;
    }
    const n = after.current;
    if (n === 'close') return onClose();
    setYourLine(null);
    setSel(0);
    setMode(n);
  }, [mode, line, shown, idx, queue.length, onClose]);

  const choose = useCallback(
    (i: number) => {
      if (mode === 'pledge') {
        setYourLine('"I\'ll go."');
        soundService.playGreatBell();
        onStart();
        return say([{ text: 'Then go with the Mothers. Light incense first, and walk calmly. Come back to me if you lose your way.' }], 'close');
      }
      if (mode !== 'menu') return;
      setYourLine(MENU[i][0]);
      if (i === 0) {
        const hints = missing.length ? missing.map((p) => ({ text: `${p.vi}: ${KEEPER.hints[p.id]}` })) : [{ text: story.ceremony ? KEEPER.after : KEEPER.ready }];
        say(hints, 'menu');
      } else if (i === 1) {
        setYourLine(null);
        setMode('ask');
      } else say([{ text: 'Đi bình an nhé, con. Go in peace.' }], 'close');
    },
    [mode, missing, story.ceremony, onStart, say],
  );

  const ask = async () => {
    const q = draft.trim();
    if (!q) return;
    setDraft('');
    setYourLine(q);
    setMode('waiting');
    let reply = '';
    try {
      const r = await fetch(import.meta.env.VITE_KEEPER_URL || './api/keeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: msgs.current.slice(-6), khan: story.khan }),
      });
      if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) {
        const body = await r.json();
        if (typeof body?.reply === 'string') reply = body.reply;
      }
    } catch {
      /* offline */
    }
    reply = reply || localReply(q);
    msgs.current.push({ from: 'you', text: q }, { from: 'keeper', text: reply });
    soundService.playMo();
    say(chunk(reply), 'ask');
  };

  useEffect(() => {
    if (mode === 'ask') window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [mode]);

  // keys
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      const key = e.key;
      if (mode === 'say' && (key === ' ' || key === 'Enter' || key === 'e' || key === 'E')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        advance();
      } else if (mode === 'say' && (key === 's' || key === 'S') && queue.length > 1) {
        // skip the rest of what she's saying
        e.preventDefault();
        e.stopImmediatePropagation();
        setIdx(queue.length - 1);
        setShown(queue[queue.length - 1].text.length);
      } else if (mode === 'pledge' && (key === ' ' || key === 'Enter' || key === '1')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        choose(0);
      } else if (mode === 'menu') {
        if (/^[1-3]$/.test(key)) choose(Number(key) - 1);
        else if (key === 'ArrowDown' || key === 's' || key === 'S') setSel((v) => (v + 1) % 3);
        else if (key === 'ArrowUp' || key === 'w' || key === 'W') setSel((v) => (v + 2) % 3);
        else if (key === ' ' || key === 'Enter') choose(sel);
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [mode, advance, choose, sel, queue]);

  // Esc: from asking, back to the questions; otherwise end the conversation
  useBackLayer(true, () => {
    if (mode === 'ask') {
      inputRef.current?.blur();
      setMode('menu');
    } else onClose();
  });

  // follow her head around the screen
  const bubble = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: innerWidth / 2, y: innerHeight * 0.3, dx: 0, on: true });
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = anchor();
      const el = bubble.current;
      const w = el?.offsetWidth ?? 340, h = el?.offsetHeight ?? 120;
      if (a) {
        const x = a.on ? Math.max(w / 2 + 12, Math.min(innerWidth - w / 2 - 12, a.x)) : innerWidth / 2;
        const y = a.on ? Math.max(h + 16, Math.min(innerHeight - 140, a.y)) : h + 70;
        setPos((p) => (Math.abs(p.x - x) + Math.abs(p.y - y) < 0.5 && p.on === a.on ? p : { x, y, dx: Math.max(-w / 2 + 30, Math.min(w / 2 - 30, a.x - x)), on: a.on }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchor]);

  const herText = mode === 'waiting' ? '…' : line ? line.text.slice(0, mode === 'say' ? shown : line.text.length) : '';
  const showHer = mode === 'say' || mode === 'waiting' || ((mode === 'menu' || mode === 'pledge' || mode === 'ask') && line);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none select-none" role="dialog" aria-label="Talking with Bà Thủ Từ">
      {/* her bubble, over her head */}
      {showHer && (
        <div
          key={`${idx}-${queue.length}-${mode === 'waiting'}`}
          ref={bubble}
          className="absolute manga-pop"
          style={{ left: pos.x, top: pos.y - 18, transform: 'translate(-50%, -100%)', opacity: pos.on ? 1 : 0.92 }}
        >
          <div className="manga-bubble relative px-5 pt-3 pb-3 w-[min(340px,80vw)]">
            <span className="absolute -top-3.5 left-4 px-2 py-0.5 rounded-sm bg-[#8e1b1b] text-[#fff4dc] text-[11px] font-bold tracking-wide border-2 border-[#16110d]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
              Bà Thủ Từ
            </span>
            <p className="text-[18px] leading-snug min-h-[2.4em]" aria-live="polite">
              {herText}
              {typing && <span className="opacity-30">{line.text.slice(shown, shown + 1)}</span>}
            </p>
            {line?.khan && mode === 'say' && !typing && (
              <div className="flex justify-center gap-2 mt-1">
                {PALACES.map((p) => (
                  <KhanArt key={p.id} color={p.color} size={36} title={p.colorName} />
                ))}
              </div>
            )}
            {mode === 'say' && (
              <span className="absolute right-3 -bottom-7 flex gap-2 text-[11px] font-bold text-[#fffdf7] [text-shadow:0_1px_3px_#000]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                {queue.length > 1 && idx < queue.length - 1 && <span className="opacity-80">S skip</span>}
                <span className={typing ? 'opacity-60' : 'manga-next'}>▼ Space</span>
              </span>
            )}
            {pos.on && <Tail dx={pos.dx} />}
          </div>
        </div>
      )}

      {/* your bubble, at the bottom of your own view */}
      {(yourLine || mode === 'pledge' || mode === 'menu' || mode === 'ask') && (
        <div className="absolute left-1/2 bottom-[max(1.5rem,env(safe-area-inset-bottom))] manga-pop-you pointer-events-auto" style={{ transform: 'translateX(-50%)' }} key={mode + (yourLine ?? '')}>
          <div className="manga-bubble relative px-5 py-3 w-[min(420px,88vw)]">
            <Tail up />
            {mode === 'pledge' ? (
              <p className="text-[18px]">
                <kbd className="mr-2 px-1.5 rounded border-2 border-[#16110d] text-[13px]">Space</kbd>"I'll go."
              </p>
            ) : mode === 'menu' ? (
              <ol className="space-y-0.5">
                {MENU.map(([en, vi], i) => (
                  <li key={en} className={`flex items-baseline gap-2 px-2 py-0.5 rounded-lg ${i === sel ? 'bg-[#16110d] text-[#fffdf7]' : ''}`}>
                    <kbd className={`text-[13px] px-1.5 rounded border-2 ${i === sel ? 'border-[#fffdf7]' : 'border-[#16110d]'}`}>{i + 1}</kbd>
                    <span className="text-[18px]">{en}</span>
                    <span className="ml-auto text-[14px] opacity-60">{vi}</span>
                  </li>
                ))}
              </ol>
            ) : mode === 'ask' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 300))}
                  placeholder="Type your question, then Enter…"
                  className="flex-1 min-w-0 bg-transparent text-[18px] outline-none placeholder:text-[#16110d]/40"
                  style={{ fontFamily: 'inherit' }}
                />
                <span className="text-[12px] opacity-50 whitespace-nowrap" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                  Esc back
                </span>
              </form>
            ) : (
              <p className="text-[18px]">{yourLine}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
