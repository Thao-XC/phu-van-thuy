import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { KhanArt } from './LocArt';
import { KEEPER, PALACES } from '../data/story';
import { useStory } from '../services/storyService';
import { soundService } from '../services/soundService';

/** Simple portrait of Bà Thủ Từ, the temple keeper */
export const KeeperFace: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="shrink-0">
    <circle cx="32" cy="32" r="31" fill="#f6e3c8" stroke="#c99212" strokeWidth="2" />
    <path d="M10 64Q12 44 32 42Q52 44 54 64Z" fill="#6d2a6a" />
    <path d="M26 42L32 50L38 42" fill="#f2c14e" />
    <circle cx="32" cy="28" r="12" fill="#e9c39b" />
    {/* khăn vấn: the wrapped headband */}
    <path d="M18 24Q32 6 46 24Q46 18 32 14Q18 18 18 24Z" fill="#2a1a12" />
    <ellipse cx="32" cy="18" rx="15" ry="5" fill="#3a2418" />
    <circle cx="27.5" cy="29" r="1.3" fill="#2a1a12" />
    <circle cx="36.5" cy="29" r="1.3" fill="#2a1a12" />
    <path d="M28 35Q32 37.5 36 35" stroke="#a0453a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <circle cx="24" cy="33" r="2.2" fill="#f2a6a0" opacity="0.6" />
    <circle cx="40" cy="33" r="2.2" fill="#f2a6a0" opacity="0.6" />
  </svg>
);

type Msg = { from: 'you' | 'keeper'; text: string };

/** Offline answers, used when the AI keeper can't be reached */
function localReply(q: string): string {
  const s = q.toLowerCase();
  if (/incense|hương|nhang/.test(s)) return 'Odd numbers, one, three or five sticks. Light them at the great burner outside, hold them to your forehead and vái three times.';
  if (/door|cửa|gate|cổng/.test(s)) return 'The middle gate and the middle door are for the gods. People walk through the side ones, and step over the threshold, never on it.';
  if (/hầu đồng|len dong|lên đồng|medium|ceremony/.test(s)) return 'In hầu đồng a medium becomes the vessel for the spirits, one after another, dressed in each palace\'s colours, while the cung văn sing. Bring the four scarves home and you will see it tonight.';
  if (/xăm|fortune|stick/.test(s)) return 'Kneel at the little table inside the hall, shake the tube until one stick falls, then ask the coins whether it really is your answer.';
  if (/sớ|petition|burn/.test(s)) return 'Write your sớ with a clear heart, then burn it in the brick furnace. The smoke carries it up.';
  if (/mẫu|mother|liễu hạnh/.test(s)) return 'Mẫu Liễu Hạnh came down from Heaven because she broke a jade cup, they say, and she loved this world so much she kept coming back to it.';
  if (/tiger|hổ|snake|rắn|lốt/.test(s)) return 'The Five Tigers sleep under the altar and the two snakes climb the pillars. Look closely and be polite to them.';
  return 'Ask with a sincere heart and the Mothers listen, whatever the words. Is there something about the temple I can explain?';
}

export const KeeperSheet: React.FC<{ onClose: () => void; onStart: () => void }> = ({ onClose, onStart }) => {
  const story = useStory();
  const [line, setLine] = useState(0);
  const [tab, setTab] = useState<'story' | 'chat'>('story');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => listRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }), [msgs]);

  const intro = !story.started;
  const missing = PALACES.filter((p) => !story.khan.includes(p.id));

  const ask = async () => {
    const q = draft.trim();
    if (!q || busy) return;
    setDraft('');
    setMsgs((m) => [...m, { from: 'you', text: q }]);
    setBusy(true);
    let reply = '';
    try {
      const r = await fetch('/api/keeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: msgs.slice(-6), khan: story.khan }),
      });
      if (r.ok) reply = (await r.json()).reply ?? '';
    } catch {
      /* offline */
    }
    setMsgs((m) => [...m, { from: 'keeper', text: reply || localReply(q) }]);
    soundService.playMo();
    setBusy(false);
  };

  return (
    <Sheet onClose={onClose} size="md" label="Bà Thủ Từ" className="px-5 sm:px-7 pt-3 sm:pt-6" cardClassName={!intro && tab === 'chat' ? 'sm:h-[min(640px,86vh)]' : ''}>
      <div className="flex items-center gap-3 pr-8">
        <KeeperFace />
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#8e1b1b] font-semibold">Bà Thủ Từ</div>
          <h2 className="font-display font-bold text-xl text-[#2a1d14]">The temple keeper</h2>
        </div>
      </div>
      {!intro && (
        <div className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#ece2cf]" role="tablist">
          {(
            [
              ['story', 'The scarves'],
              ['chat', 'Ask her anything'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`py-2 rounded-lg text-sm font-semibold cursor-pointer ${tab === k ? 'bg-[#fffaf0] text-[#8e1b1b] shadow-sm' : 'text-[#5a4837]'}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {intro ? (
        <div className="mt-5">
          <p key={line} className="sheet-fade font-display text-[16px] leading-relaxed text-[#2a1d14] min-h-[6em]">
            "{KEEPER.intro[line]}"
          </p>
          {line === 2 && (
            <div className="flex justify-center gap-3 my-3">
              {PALACES.map((p) => (
                <KhanArt key={p.id} color={p.color} size={50} title={p.colorName} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-[#5a4837] tabular-nums">
              {line + 1} / {KEEPER.intro.length}
            </span>
            {line < KEEPER.intro.length - 1 ? (
              <button onClick={() => setLine(line + 1)} className="px-5 py-2.5 rounded-xl bg-[#8e1b1b] text-[#fff4dc] text-sm font-semibold cursor-pointer">
                Next
              </button>
            ) : (
              <button
                onClick={() => {
                  soundService.playGreatBell();
                  onStart();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#c99212] text-[#2a1410] text-sm font-bold cursor-pointer"
              >
                "I'll go."
              </button>
            )}
          </div>
        </div>
      ) : tab === 'story' ? (
        <div className="mt-4 space-y-3 pb-1">
          <p className="font-display text-[15px] leading-relaxed text-[#2a1d14]">
            "{story.ceremony ? KEEPER.after : missing.length === 0 ? KEEPER.ready : missing.length === 4 ? 'Where will you start? I can tell you where each palace hides.' : `${4 - missing.length} of four. The Mothers are pleased with you.`}"
          </p>
          <ul className="space-y-2">
            {PALACES.map((p) => {
              const done = story.khan.includes(p.id);
              return (
                <li key={p.id} className={`flex gap-3 items-center p-2.5 rounded-xl border ${done ? 'bg-[#f1f7ee] border-[#b7d6b0]' : 'bg-[#fffaf0] border-[#e0d2ba]'}`}>
                  <KhanArt color={p.color} size={44} dim={!done} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#2a1d14]">
                      {p.vi} <span className="font-normal text-[#5a4837]">· {p.en}</span>
                    </div>
                    <div className="text-[13px] text-[#3d3124] leading-snug">{done ? `The ${p.colorName} scarf is home.` : `"${KEEPER.hints[p.id]}"`}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-3 flex flex-col min-h-[300px] sm:min-h-0 sm:h-[calc(100%-150px)]">
          <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
            {msgs.length === 0 && <p className="text-[13px] text-[#5a4837]">Ask about the customs, the Mothers, the hầu đồng, or anything that's on your mind.</p>}
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.from === 'you' ? 'ml-auto bg-[#8e1b1b] text-[#fff4dc] rounded-br-md' : 'bg-[#f6eedf] text-[#2a1d14] rounded-bl-md'}`}>
                {m.text}
              </div>
            ))}
            {busy && <div className="text-xs text-[#5a4837]">Bà Thủ Từ is thinking…</div>}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 300))} placeholder="Ask in English or Tiếng Việt…" className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-[#fffaf0] border border-[#e0d2ba] text-sm focus:outline-none focus:border-[#8e1b1b]" />
            <button type="submit" disabled={!draft.trim() || busy} aria-label="Send" className="w-11 rounded-xl bg-[#8e1b1b] text-white flex items-center justify-center disabled:opacity-40 cursor-pointer">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </Sheet>
  );
};
