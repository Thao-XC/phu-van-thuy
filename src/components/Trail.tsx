import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Moon, Sparkles, Compass } from 'lucide-react';
import { PALACES, SECRETS, nextSecret } from '../data/story';
import { useStory } from '../services/storyService';
import { useLuck } from './LuckAndLegends';

/** What the story wants from you right now */
export function useStoryGoal(): { title: string; detail: string } {
  const story = useStory();
  if (!story.started) return { title: 'Meet the temple keeper', detail: 'Find Bà Thủ Từ by the incense burner in the courtyard.' };
  if (story.khan.length < 4) {
    const next = PALACES.find((p) => !story.khan.includes(p.id))!;
    return { title: `Return the scarves · ${story.khan.length}/4`, detail: `${next.vi}: ${next.hint}` };
  }
  if (!story.ceremony) return { title: 'The hầu đồng awaits', detail: 'All four scarves are home. Tell Bà Thủ Từ you are ready.' };
  return { title: 'The Mother is at peace', detail: 'Wander as long as you like. The grounds still keep secrets.' };
}

const warmth = (d: number | null) => {
  if (d == null) return null;
  if (d < 4) return { label: 'Right here', dots: 4, tone: 'text-[#d98b00]' };
  if (d < 10) return { label: 'Very close', dots: 3, tone: 'text-[#c47a00]' };
  if (d < 22) return { label: 'Getting warm', dots: 2, tone: 'text-[#8a6a2a]' };
  return { label: 'Somewhere else', dots: 1, tone: 'text-[#8a7762]' };
};

/**
 * Objective tracker, top-left under the back button: the story goal and the current secret's riddle.
 * Secrets unlock one at a time; a warmth meter tells you whether you're near.
 */
export const Tracker: React.FC<{ getDistance: () => number | null; isNight: boolean; onOpenTrail: () => void; onGuide: (what: 'story' | 'secret') => void }> = ({ getDistance, isNight, onOpenTrail, onGuide }) => {
  const goal = useStoryGoal();
  const { found } = useLuck();
  const secret = nextSecret(found);
  const idx = secret ? SECRETS.indexOf(secret) : SECRETS.length;
  // folded to one quiet line by default; it opens by itself for a few seconds when a new riddle wakes
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('pvt_tracker2') === '1';
    } catch {
      return false;
    }
  });
  const [peek, setPeek] = useState(false);
  const [dist, setDist] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => setDist(getDistance()), 400);
    return () => clearInterval(t);
  }, [getDistance]);
  // a little glow whenever a new riddle unlocks
  useEffect(() => {
    if (!found.length) return;
    setFlash(true);
    setPeek(true);
    const t = window.setTimeout(() => setFlash(false), 2400);
    const p = window.setTimeout(() => setPeek(false), 9000);
    return () => {
      clearTimeout(t);
      clearTimeout(p);
    };
  }, [found.length]);
  const toggle = () => {
    const o = !(open || peek);
    setOpen(o);
    setPeek(false);
    try {
      localStorage.setItem('pvt_tracker2', o ? '1' : '0');
    } catch {
      /* ignore */
    }
  };
  const w = secret && (secret.trigger !== 'night' || isNight) ? warmth(dist) : null;
  const shown = open || peek;

  return (
    <div className={`${shown ? 'w-[min(300px,calc(100vw-1.5rem))]' : 'w-auto max-w-[260px]'} rounded-2xl dh-paper border shadow-lg text-[#2a1d14] transition-shadow ${flash ? 'border-[#e0a92a] shadow-[0_0_0_3px_rgba(224,169,42,0.35)]' : 'border-[#211a15]'}`}>
      <button onClick={toggle} className="w-full flex items-center gap-2 px-3 py-1.5 cursor-pointer text-left" aria-expanded={shown} title={secret ? `✦ ${secret.riddle}` : goal.title}>
        <Compass className="w-4 h-4 text-[#8e1b1b] shrink-0" />
        <span className="text-[13px] font-semibold truncate">{goal.title}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[#8a5a00] shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          {Math.min(idx, SECRETS.length)}/{SECRETS.length}
        </span>
        {w && !shown && <span className={`w-1.5 h-1.5 rounded-full bg-current shrink-0 ${w.tone}`} aria-hidden />}
        {shown ? <ChevronUp className="w-4 h-4 text-[#8a7762] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#8a7762] shrink-0" />}
      </button>
      {shown && (
        <div className="px-3 pb-3 -mt-0.5 space-y-2">
          <div className="rounded-xl bg-[#fffaf0] border border-[#ecdcbc] p-2.5">
            {secret ? (
              <>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-bold text-[#8e1b1b]">
                  ✦ {idx + 1}/{SECRETS.length}
                  {secret.trigger === 'night' && (
                    <span className={`ml-auto flex items-center gap-1 normal-case tracking-normal font-semibold ${isNight ? 'text-[#4b5aa0]' : 'text-[#8a7762]'}`}>
                      <Moon className="w-3 h-3" /> {isNight ? 'Night has come' : 'Only at night'}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-snug italic font-display">“{secret.riddle}”</p>
                {w && (
                  <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold ${w.tone}`} aria-live="polite">
                    <span className="flex gap-0.5" aria-hidden>
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= w.dots ? 'bg-current' : 'bg-[#e6d8bf]'}`} />
                      ))}
                    </span>
                    {w.label}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] leading-snug">Every secret of Phủ Vân Thủy is yours. The grounds are quiet and grateful.</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#6d5b49]">
            <button onClick={() => onGuide('story')} className="flex items-center gap-1 cursor-pointer hover:text-[#8e1b1b]" title="The firefly shows you where to go">
              <kbd className="px-1 rounded border border-[#211a15]/40 font-sans">G</kbd> guide
            </button>
            <button onClick={onOpenTrail} className="flex items-center gap-1 cursor-pointer hover:text-[#8e1b1b]">
              <kbd className="px-1 rounded border border-[#211a15]/40 font-sans">T</kbd> trail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
