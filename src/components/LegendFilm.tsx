import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Captions, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { FILM, FILM_TITLE } from '../data/legendFilm';
import { useBackLayer } from '../services/backStack';
import { soundService } from '../services/soundService';
import { INK, InkDefs, Paper, PaperTop, CamCtx, S, L } from '../film/ink';
import { Cloud } from '../film/figures';
import { SCENES } from '../film/scenes';
import { FILM_CSS } from '../film/filmCss';

/**
 * "The Mothers of the Four Palaces": a narrated film about the real history and legends of
 * the Mother Goddesses, drawn as Đông Hồ woodblock prints.
 * Each chapter opens with a printed title card; each scene is "pressed" colour by colour;
 * the camera moves between shots in step with the narration.
 * The narrator is the device's synthesized voice (Web Speech); without one, lines advance on a timer.
 */

type Lang = 'en' | 'vi';
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
const CARD_MS = 3000;
const NUM = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám'];
/** ngũ cung: the five-note scale of Vietnamese folk music */
const PENTA = [261.6, 293.7, 349.2, 392.0, 440.0, 523.3, 587.3];

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  const all = synth?.getVoices() ?? [];
  const mine = all.filter((v) => v.lang.toLowerCase().startsWith(lang));
  if (!mine.length) return null;
  const good = /natural|neural|google|online|premium|enhanced|samantha|daniel|libby|sonia|aria|jenny|linh|hoaimy|an\b/i;
  return mine.find((v) => good.test(v.name) && /en-gb|vi-vn/i.test(v.lang)) ?? mine.find((v) => good.test(v.name)) ?? mine[0];
}
const words = (t: string) => t.split(/\s+/).length;

/** split a title into two short vertical columns for the corner inscription */
const columns = (t: string) => {
  const w = t.split(' ');
  if (w.length <= 2) return [t];
  const h = Math.ceil(w.length / 2);
  return [w.slice(0, h).join(' '), w.slice(h).join(' ')];
};

const TitleCard: React.FC<{ n: number; vi: string; en: string; show: boolean }> = ({ n, vi, en, show }) => (
  <g className={`titlecard ${show ? 'on' : ''}`} pointerEvents="none">
    <rect width="1600" height="900" fill={INK.diep} />
    <rect width="1600" height="900" fill="url(#tx-swirl)" opacity={0.06} />
    <g className="printing">
      <Cloud x={330} y={430} w={300} seed={91} f={INK.pink} />
      <Cloud x={1270} y={430} w={300} seed={92} f={INK.pink} />
      <S d="M600 300L1000 300L1000 306L600 306Z" f={INK.key} k={0} />
      <S d="M600 640L1000 640L1000 646L600 646Z" f={INK.key} k={0} />
      <g transform="translate(800 250)">
        <S d="M-46 -46L46 -46L46 46L-46 46Z" f={INK.son} k={0} />
        <L d="M-38 -38L38 -38L38 38L-38 38Z" w={3} c={INK.diep} />
        <text y={-6} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK.diep} fontFamily="'Noto Serif', serif">
          Hồi
        </text>
        <text y={24} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK.diep} fontFamily="'Noto Serif', serif">
          {NUM[n]}
        </text>
      </g>
      <text x={800} y={470} textAnchor="middle" fontSize={84} fontWeight={700} fontStyle="italic" fill={INK.key} fontFamily="'Noto Serif', serif" className="ink ink-p4">
        {vi}
      </text>
      <text x={800} y={560} textAnchor="middle" fontSize={36} fontStyle="italic" fill={INK.sonDeep} fontFamily="'Noto Serif', serif" className="ink ink-p1">
        {en}
      </text>
    </g>
  </g>
);

/** a sweep of điệp-paper clouds that covers the picture while it changes */
export const CloudWipe: React.FC = () => (
  <g className="cloudwipe" pointerEvents="none">
    <rect x={0} y={-60} width={2000} height={1020} fill={INK.diep} />
    <rect x={0} y={-60} width={2000} height={1020} fill="url(#tx-swirl)" opacity={0.08} />
    {[0, 150, 300, 450, 600, 750, 900].map((y, i) => (
      <g key={y}>
        <Cloud x={-40 + (i % 2) * 50} y={y} w={340} n={3} seed={100 + i} f={i % 3 === 1 ? INK.pink : INK.diep} />
        <Cloud x={2040 - (i % 2) * 50} y={y + 70} w={340} n={3} seed={120 + i} f={i % 3 === 0 ? INK.hoeLight : INK.diep} />
      </g>
    ))}
    {[200, 520, 840, 1160, 1480, 1800].map((x, i) => (
      <Cloud key={x} x={x} y={i % 2 ? 300 : 620} w={300} n={4} seed={140 + i} f={i % 2 ? INK.pink : INK.hoeLight} />
    ))}
  </g>
);

/** something always moving in the air: petals, fireflies or embers */
export const Ambient: React.FC<{ kind: 'petals' | 'motes' | 'embers' }> = ({ kind }) => (
  <g pointerEvents="none">
    {Array.from({ length: kind === 'petals' ? 14 : 22 }, (_, i) => {
      const x = (i * 337) % 1700 - 50;
      const delay = -((i * 1.37) % 9);
      if (kind === 'petals')
        return (
          <g key={i} transform={`translate(${x} -40)`}>
            <g className="amb-petal" style={{ animationDelay: `${delay}s`, animationDuration: `${8 + (i % 4)}s` }}>
              <path d="M0 0q9 -11 18 0q-9 11 -18 0Z" fill={i % 3 ? INK.pink : '#f6d9cc'} stroke={INK.key} strokeWidth={1.4} />
            </g>
          </g>
        );
      return (
        <g key={i} transform={`translate(${x} ${940})`}>
          <g className="amb-mote" style={{ animationDelay: `${delay}s`, animationDuration: `${7 + (i % 5)}s` }}>
            <circle r={kind === 'embers' ? 3.2 : 4} fill={kind === 'embers' ? '#ffd27a' : '#fff1b0'} />
            <circle r={12} fill="url(#glow-gold)" />
          </g>
        </g>
      );
    })}
  </g>
);

export const LegendFilm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ch, setCh] = useState(0);
  const [ln, setLn] = useState(0);
  const [card, setCard] = useState(false);
  const [done, setDone] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [voiceOn, setVoiceOn] = useState(true);
  const [music, setMusic] = useState(true);
  const [cc, setCc] = useState(true);
  const [voices, setVoices] = useState<{ en: boolean; vi: boolean }>({ en: false, vi: false });
  const token = useRef(0);

  useBackLayer(true, onClose);

  // dev only: jump to a shot for screenshots
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __film: unknown }).__film = {
      shot: (c: number, l: number) => {
        token.current++;
        setStarted(true);
        setPlaying(false);
        setCard(false);
        setCh(c);
        setLn(l);
      },
    };
  }, []);

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

  // each chapter opens with its printed title card
  useEffect(() => {
    if (!started) return;
    setCard(true);
    const t = window.setTimeout(() => setCard(false), CARD_MS);
    return () => clearTimeout(t);
  }, [ch, started]);

  // what's on screen trails the story by a beat: big changes happen behind a sweep of điệp clouds
  const [shown, setShown] = useState({ ch: 0, beat: 0, card: false });
  const [wipe, setWipe] = useState(0);
  useEffect(() => {
    const target = { ch, beat: card ? 0 : ln, card };
    if (target.ch === shown.ch && target.beat === shown.beat && target.card === shown.card) return;
    const big = !started || target.ch !== shown.ch || target.card !== shown.card || (SCENES[FILM[ch].id].wipeAt ?? []).includes(target.beat);
    if (!big || !started) {
      setShown(target);
      return;
    }
    setWipe((w) => w + 1);
    const t = window.setTimeout(() => setShown(target), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch, ln, card, started]);

  // music: chầu văn under the hầu đồng, a quiet pentatonic đàn nguyệt elsewhere
  const isHauDong = FILM[ch].id === 'haudong';
  useEffect(() => {
    if (!started || !playing || !music) return;
    if (isHauDong) {
      soundService.startChauVan();
      return () => soundService.stopChauVan();
    }
    let i = 0;
    const t = window.setInterval(() => {
      i++;
      if (Math.random() < 0.72) soundService.playLute(PENTA[Math.floor(Math.random() * PENTA.length)], undefined, 0.045);
      if (i % 4 === 0) soundService.playLute(PENTA[0] / 2, undefined, 0.035);
    }, 1350);
    return () => clearInterval(t);
  }, [started, playing, music, isHauDong]);

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
    if (!started || !playing || card) return;
    const my = ++token.current;
    const text = FILM[ch].lines[ln][lang];
    const advance = () => {
      if (token.current === my) window.setTimeout(() => token.current === my && next(), 900);
    };
    const voice = voiceOn ? pickVoice(lang) : null;
    let safety = 0;
    if (synth && voice) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = lang === 'vi' ? 0.95 : 0.9;
      u.pitch = 1;
      u.onend = advance;
      u.onerror = advance;
      synth.speak(u);
      safety = window.setTimeout(advance, (words(text) * 0.62 + 6) * 1000);
    } else {
      safety = window.setTimeout(advance, Math.max(4200, words(text) * 380 + 1600));
    }
    return () => {
      clearTimeout(safety);
      synth?.cancel();
    };
  }, [started, playing, card, ch, ln, lang, voiceOn, next]);

  // keys: space play/pause, arrows chapters, C captions, M music
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') go(ch + 1);
      else if (e.key === 'ArrowLeft') go(ch - 1);
      else if (e.key === 'c' || e.key === 'C') setCc((v) => !v);
      else if (e.key === 'm' || e.key === 'M') setMusic((v) => !v);
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
    if (!started) setStarted(true);
    setPlaying(true);
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
  const vChapter = FILM[shown.ch];
  const def = SCENES[vChapter.id];
  const beat = shown.beat;
  const cam = def.cams[Math.min(beat, def.cams.length - 1)];
  const line = chapter.lines[ln];
  const total = useMemo(() => FILM.reduce((n, c) => n + c.lines.length, 0), []);
  const pos = FILM.slice(0, ch).reduce((n, c) => n + c.lines.length, 0) + ln + (done ? 1 : 0);
  const other: Lang = lang === 'en' ? 'vi' : 'en';
  const Body = def.Body;

  return (
    <div className={`fixed inset-0 z-[60] bg-[#0f0a08] flex flex-col text-[#fbeed2] ${playing ? '' : 'film-paused'}`} role="dialog" aria-label={FILM_TITLE.en}>
      <style>{FILM_CSS}</style>
      {/* top bar */}
      <div className="flex items-center gap-2 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 z-10">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#e9b84a] font-semibold truncate">
            Hồi {NUM[ch]} · {chapter.vi}
          </div>
          <div className="text-sm font-display truncate">{chapter.en}</div>
        </div>
        <button onClick={onClose} className="ml-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Close the film" title="Close (Esc)">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* the print */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden px-2">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-h-full overflow-hidden drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]" aria-hidden>
          <InkDefs />
          <g clipPath="url(#film-clip)">
            <Paper wash={def.wash(beat)} />
            <CamCtx.Provider value={cam}>
              <g key={vChapter.id} className="printing">
                <g className="kb">
                  <Body beat={beat} />
                </g>
              </g>
            </CamCtx.Provider>
            <Ambient kind={def.ambient ?? 'petals'} key={`amb-${vChapter.id}`} />
            <PaperTop dim={def.dim?.(beat) ?? 0} />
            {started && <TitleCard key={`card-${shown.ch}`} n={shown.ch} vi={vChapter.vi} en={vChapter.en} show={shown.card} />}
            {wipe > 0 && <CloudWipe key={wipe} />}
          </g>
        </svg>

        {!started && (
          <button onClick={start} className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f0a08]/60 cursor-pointer">
            <span className="text-xs uppercase tracking-[0.25em] text-[#e9b84a] font-semibold">{FILM_TITLE.vi}</span>
            <span className="font-display font-bold text-3xl sm:text-5xl text-center px-6">{FILM_TITLE.en}</span>
            <span className="text-sm italic opacity-80">Told in the style of Đông Hồ woodblock prints</span>
            <span className="mt-2 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#8e1b1b] to-[#b4301f] border border-[#e9b84a]/60 font-semibold shadow-2xl">
              <Play className="w-5 h-5" /> Watch · about 5 minutes
              <kbd className="hidden pointer-fine:inline ml-1 px-1.5 rounded border border-white/30 text-[11px] font-sans">Space</kbd>
            </span>
            <span className="text-[12px] opacity-75 max-w-sm text-center px-6">
              Narrated by an AI voice{voices.en || voices.vi ? '' : ' (no voice found on this device, so subtitles only)'}. Legends differ from place to place; this tells the most widely shared versions.
            </span>
          </button>
        )}

        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f0a08]/70">
            <span className="w-16 h-16 bg-[#b8382b] text-[#f3ead6] flex items-center justify-center font-display font-bold text-2xl">Hết</span>
            <span className="font-display italic text-xl">The end</span>
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
      <div className="min-h-[5.5rem] sm:min-h-[6rem] px-4 py-2 flex flex-col items-center justify-center text-center" aria-live="polite">
        {started && cc && !done && !card && (
          <>
            <p className="text-[15px] sm:text-lg leading-snug max-w-3xl">{line[lang]}</p>
            <p className="mt-1 text-[12px] sm:text-sm leading-snug max-w-3xl text-[#e9c98a]/80 italic">{line[other]}</p>
          </>
        )}
      </div>

      {/* controls */}
      <div className="px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1">
        <div className="flex gap-1 mb-2">
          {FILM.map((c, i) => (
            <button key={c.id} onClick={() => go(i)} className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden cursor-pointer" title={`${i + 1}. ${c.vi} · ${c.en}`} aria-label={`Chapter ${i + 1}: ${c.en}`}>
              <span className="block h-full bg-[#e9b84a] transition-all" style={{ width: i < ch || done ? '100%' : i === ch ? `${(ln / c.lines.length) * 100}%` : '0%' }} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => go(ch - 1)} disabled={ch === 0} className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 cursor-pointer" aria-label="Previous chapter" title="Previous chapter (←)">
            <SkipBack className="w-5 h-5" />
          </button>
          <button onClick={toggle} className="p-2.5 rounded-full bg-[#8e1b1b] hover:bg-[#a5251f] cursor-pointer" aria-label={playing ? 'Pause' : 'Play'} title="Play / pause (Space)">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button onClick={() => go(ch + 1)} disabled={ch === FILM.length - 1} className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 cursor-pointer" aria-label="Next chapter" title="Next chapter (→)">
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
            <button onClick={() => setMusic((v) => !v)} className={`px-2 py-1.5 rounded-xl hover:bg-white/10 cursor-pointer text-[12px] font-semibold ${music ? 'text-[#e9b84a]' : 'opacity-60'}`} aria-pressed={music} title="Music (M)">
              ♪
            </button>
            <button onClick={() => setVoiceOn((v) => !v)} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" aria-label={voiceOn ? 'Mute the narrator' : 'Unmute the narrator'} aria-pressed={!voiceOn} title="Narrator">
              {voiceOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-60" />}
            </button>
            <button onClick={() => setCc((v) => !v)} className={`p-2 rounded-xl hover:bg-white/10 cursor-pointer ${cc ? 'text-[#e9b84a]' : 'opacity-60'}`} aria-label="Subtitles" aria-pressed={cc} title="Subtitles (C)">
              <Captions className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
