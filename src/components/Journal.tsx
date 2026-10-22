import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { KhanArt, LocArt } from './LocArt';
import { XamSlip } from './Rituals';
import { PALACES, LEGEND_INDEX, TOTAL_DISCOVERIES } from '../data/story';
import { LOC, XAM, type LocKind } from '../data/rituals';
import { useStory } from '../services/storyService';
import { useLuck } from './LuckAndLegends';
import type { StoryCard } from '../three/encounters/types';

/**
 * The pilgrim's journal: the four scarves, everything discovered, and the pouch.
 */
export const JournalSheet: React.FC<{ onClose: () => void; onOpenCard: (c: StoryCard) => void; initial?: 'story' | 'found' | 'pouch' }> = ({ onClose, onOpenCard, initial = 'story' }) => {
  const story = useStory();
  const { found } = useLuck();
  const [tab, setTab] = useState(initial);
  const [xamOpen, setXamOpen] = useState<number | null>(null);
  return (
    <Sheet onClose={onClose} size="lg" label="Journal" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <div className="text-center pr-6 sm:pr-0">
        <span className="text-xs uppercase tracking-[0.18em] text-[#8e1b1b] font-semibold">Sổ tay hành hương</span>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-[#2a1d14] mt-0.5">Your journal</h2>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#ece2cf]" role="tablist">
        {(
          [
            ['story', 'Scarves', `${story.khan.length}/4`],
            ['found', 'Discoveries', `${found.length}/${TOTAL_DISCOVERIES}`],
            ['pouch', 'Pouch', `${story.pouch.length}`],
          ] as const
        ).map(([k, l, c]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`py-2 rounded-lg text-sm font-semibold cursor-pointer ${tab === k ? 'bg-[#fffaf0] text-[#8e1b1b] shadow-sm' : 'text-[#5a4837]'}`}>
            {l} <span className="text-xs font-normal tabular-nums opacity-80">{c}</span>
          </button>
        ))}
      </div>

      {tab === 'story' && (
        <div className="mt-4 space-y-3 pb-1">
          {!story.started && <p className="text-sm text-[#5a4837] text-center">Speak with Bà Thủ Từ, the temple keeper in the courtyard, to begin.</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {PALACES.map((p) => {
              const done = story.khan.includes(p.id);
              return (
                <div key={p.id} className={`p-3 rounded-2xl border ${done ? 'bg-[#f1f7ee] border-[#b7d6b0]' : 'bg-[#fffaf0] border-[#e0d2ba]'}`}>
                  <div className="flex items-center gap-3">
                    <KhanArt color={p.color} size={52} dim={!done} />
                    <div>
                      <div className="font-display font-bold text-[#2a1d14]">
                        {p.vi} <span className="font-han font-normal text-[#8e1b1b]">{p.han}</span>
                      </div>
                      <div className="text-xs text-[#5a4837]">
                        {p.en} · {p.mother}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[13px] text-[#3d3124]">{done ? `The ${p.colorName} scarf is home.` : p.trial}</p>
                  {!done && story.started && <p className="mt-1 text-[12px] italic text-[#8a5a00]">Hint: {p.hint}</p>}
                </div>
              );
            })}
          </div>
          <div className={`p-3 rounded-2xl border text-center ${story.ceremony ? 'bg-[#fbeedd] border-[#d6b98c]' : 'bg-[#fffaf0] border-dashed border-[#d8c8ae]'}`}>
            <div className="font-display font-bold text-[#2a1d14]">Hầu đồng</div>
            <p className="text-[13px] text-[#3d3124]">{story.ceremony ? 'You saw the ceremony, and received lộc from the medium.' : story.khan.length === 4 ? 'Ready. Stand before the altar in the main hall.' : 'Bring all four scarves home to begin the ceremony.'}</p>
          </div>
        </div>
      )}

      {tab === 'found' && (
        <ul className="mt-4 space-y-2 pb-1">
          {LEGEND_INDEX.map((l) => {
            const isFound = found.includes(l.id);
            const card = story.cards[l.id];
            return (
              <li key={l.id}>
                <button
                  disabled={!isFound || !card}
                  onClick={() => card && onOpenCard(card)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${isFound ? 'bg-[#fffaf0] border-[#e0d2ba] hover:border-[#8e1b1b] cursor-pointer' : 'bg-[#f3ece0] border-[#e6dccb]'}`}
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base ${isFound ? 'bg-[#8e1b1b] text-[#fff4dc]' : 'bg-[#e0d4c0] text-[#8a7762]'}`}>
                    {isFound ? (l.kind === 'realm' ? '☯' : l.kind === 'ceremony' ? '🪕' : '✦') : <Lock className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#2a1d14]">{isFound ? l.title : l.kind === 'secret' ? 'A secret of the grounds' : l.title}</span>
                    <span className="block text-xs text-[#5a4837]">{isFound ? 'Tap to read again' : l.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'pouch' && (
        <div className="mt-4 space-y-5 pb-1">
          <section>
            <h3 className="text-sm font-semibold text-[#2a1d14] mb-2">Scarves of the four palaces</h3>
            <div className="flex gap-3 flex-wrap">
              {PALACES.map((p) => (
                <KhanArt key={p.id} color={p.color} size={56} dim={!story.khan.includes(p.id)} title={`${p.colorName} scarf`} />
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-[#2a1d14] mb-2">Lộc and charms</h3>
            {story.pouch.length === 0 ? (
              <p className="text-[13px] text-[#5a4837]">Nothing yet. Visit the lộc table by the gate.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {story.pouch.map((it) => {
                  const k = it.kind as LocKind;
                  return (
                    <div key={it.id} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#fffaf0] border border-[#e0d2ba] text-center">
                      <LocArt kind={k} size={40} />
                      <span className="text-[11px] font-semibold text-[#2a1d14] leading-tight">{LOC[k]?.vi}</span>
                      {it.forWhom && <span className="text-[11px] text-[#5a4837]">for {it.forWhom}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <section>
            <h3 className="text-sm font-semibold text-[#2a1d14] mb-2">Fortune sticks you drew</h3>
            {story.xam.length === 0 ? (
              <p className="text-[13px] text-[#5a4837]">None yet. The sticks wait on a table inside the main hall.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {story.xam.map((x) => (
                    <button key={x.at} onClick={() => setXamOpen(xamOpen === x.at ? null : x.at)} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${xamOpen === x.at ? 'bg-[#8e1b1b] text-white border-[#8e1b1b]' : 'bg-[#fffaf0] border-[#e0d2ba]'}`}>
                      Quẻ {x.n}
                    </button>
                  ))}
                </div>
                {xamOpen !== null && (() => {
                  const n = story.xam.find((x) => x.at === xamOpen)?.n;
                  const xx = XAM.find((q) => q.n === n);
                  return xx ? <XamSlip x={xx} /> : null;
                })()}
              </div>
            )}
          </section>
          {story.petitions.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[#2a1d14] mb-2">Petitions you burned</h3>
              <ul className="space-y-1.5">
                {story.petitions.map((p) => (
                  <li key={p.at} className="text-[13px] text-[#3d3124] p-2 rounded-lg bg-[#fffaf0] border border-[#e0d2ba]">
                    <span className="text-xs text-[#5a4837]">{new Date(p.at).toLocaleDateString()}</span> · {p.wish}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
};
