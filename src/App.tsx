import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Volume2, VolumeX, Settings as Gear, Keyboard } from 'lucide-react';
import { Minimap, SettingsSheet, ControlsSheet, LanternSheet, loadSettings, saveSettings, type Settings } from './components/PcHud';
import { TempleScene, type TimeOfDay } from './three/TempleScene';
import type { SpotDef } from './three/world/types';
import type { StoryCard } from './three/encounters/types';
import { Landing } from './components/Landing';
import { Dock, type RitualKey } from './components/Dock';
import { KeeperSheet } from './components/Keeper';
import { JournalSheet } from './components/Journal';
import { Tracker } from './components/Trail';
import { LegendFilm } from './components/LegendFilm';
import { useCalendar, CalendarChip, FestivalSheet, festivalKey, isFestivalDone, markFestivalDone } from './components/Calendar';
import { liveTimeOfDay, today, type Festival } from './services/lunar';
import { SECRETS, nextSecret } from './data/story';
import { AltarModal, PetitionModal, StallModal } from './components/Rituals';
import { IncenseRitual, XamRitual } from './components/RitualStage';
import { HauDongSight, type CeremonyControl } from './components/HauDongSight';
import { daySchedule, hauDongState, fmtHour, hourOf } from './services/templeDay';
import { KhanArt } from './components/LocArt';
import { LuckChip, LuckToasts, CaptionBar, StoryCardSheet, LuckSheet } from './components/LuckAndLegends';
import { VirtualJoystick } from './components/VirtualJoystick';
import { soundService } from './services/soundService';
import { luckService } from './services/luckService';
import { storyService, useStory } from './services/storyService';
import { useBackLayer } from './services/backStack';
import { PALACES, type PalaceId } from './data/story';
import type { LocKind } from './data/rituals';

type Modal = 'keeper' | 'incense' | 'altar' | 'fortune' | 'furnace' | 'stall' | 'journal' | 'settings' | 'controls' | 'lantern' | 'film' | 'calendar' | 'haudong' | null;

const PROMPT: Record<string, string> = {
  gate: 'Vái before the gate',
  keeper: 'Talk to Bà Thủ Từ',
  incense: 'Light incense',
  altar: 'Pray at the altar',
  fortune: 'Ask the fortune sticks',
  furnace: 'Write & burn a petition',
  bell: 'Strike the great bell',
  stall: 'Receive lộc',
  river: 'Float a lantern',
  haudong: 'Sit and watch the hầu đồng',
  theatre: 'Watch the legend of the Mothers',
};

/** the boat brings you only once per visit to the page */
let arrivedThisVisit = false;

export default function App() {
  const [view, setView] = useState<'landing' | 'temple'>(() => (new URLSearchParams(location.search).has('enter') ? 'temple' : 'landing'));
  const story = useStory();
  const [modal, setModal] = useState<Modal>(null);
  const [near, setNear] = useState<{ id: string; name: string; type: string } | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const capTimer = useRef<number | null>(null);
  const [card, setCard] = useState<{ card: StoryCard; luck: number; firstTime: boolean } | null>(null);
  const [showPhuc, setShowPhuc] = useState(false);
  const [inRealm, setInRealm] = useState(false);
  const [time, setTime] = useState<TimeOfDay>(() => liveTimeOfDay(today()));
  const [live, setLive] = useState(() => {
    try {
      return localStorage.getItem('pvt_live') !== '0';
    } catch {
      return true;
    }
  });
  const cal = useCalendar();
  const [festBanner, setFestBanner] = useState(false);
  // the temple's day: bells, offerings and hầu đồng sessions on the visitor's clock
  const sched = useMemo(() => daySchedule(cal.lunar.month, cal.lunar.day, cal.festival), [cal.lunar.month, cal.lunar.day, cal.festival]);
  const hd = hauDongState(cal.now, sched);
  const rung = useRef('');
  const [watchCtl, setWatchCtl] = useState<CeremonyControl | null>(null);
  const [gaze, setGaze] = useState(0);
  const [vision, setVision] = useState(false);
  const [auto, setAuto] = useState(false);
  const [tour, setTour] = useState(false);
  const [muted, setMuted] = useState(soundService.getMuted());
  const [spots, setSpots] = useState<SpotDef[]>([]);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [journalTab, setJournalTab] = useState<'story' | 'found' | 'trail' | 'pouch'>('story');
  const [tips, setTips] = useState(() => {
    try {
      return localStorage.getItem('pvt_tips') !== '1';
    } catch {
      return true;
    }
  });
  const [unlocked, setUnlocked] = useState(false);
  const [aim, setAim] = useState<string | null>(null);
  const [arriving, setArriving] = useState(false);
  const isPc = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<TempleScene | null>(null);
  const spotClick = useRef<(id: string) => void>(() => {});
  // per-visit manners
  const visit = useRef({ incense: false, prayed: false, petition: false, lucky: 0, hoardWarned: false, lantern: false });

  const showCaption = useCallback((t: string, s = 4) => {
    setCaption(t);
    if (capTimer.current) clearTimeout(capTimer.current);
    capTimer.current = window.setTimeout(() => setCaption(null), s * 1000);
  }, []);

  /* ---------------- the 3D temple ---------------- */
  useEffect(() => {
    if (view !== 'temple' || !mount.current) return;
    visit.current = { incense: false, prayed: false, petition: false, lucky: 0, hoardWarned: false, lantern: false };
    const s = new TempleScene(mount.current, {
      onNearSpot: (id, name, type) => setNear(id && name && type ? { id, name, type } : null),
      onCaption: (t, sec) => showCaption(t, sec),
      onLuck: (d, reason) => luckService.change(d, reason),
      onSecret: (id, c, luck) => {
        const first = luckService.markFound(id);
        if (first) luckService.change(luck, `Discovered: ${c.title}`);
        storyService.saveCard(id, c);
        setCard({ card: c, luck, firstTime: first });
        const found = luckService.get().found;
        scene.current?.setActiveSecret(nextSecret(found)?.id ?? null, found);
        if (first && SECRETS.some((x) => x.id === id)) setUnlocked(true);
      },
      onReady: () => setLoading(false),
      onGaze: setGaze,
      onVision: () => {
        setVision(true);
        soundService.playTempleGong();
        window.setTimeout(() => setVision(false), 5200);
      },
      onSpotClick: (id) => spotClick.current(id),
      onAim: setAim,
      onArrivalEnd: () => {
        arrivedThisVisit = true;
        setArriving(false);
      },
      onGuideArrive: () => showCaption('The firefly hovers here, waiting for you.', 3),
      canEnter: () => (storyService.get().started ? true : 'Something holds you back. Perhaps speak with the temple keeper first, by the incense burner.'),
      onEncounter: (e) => {
        if (e.type === 'start') {
          setInRealm(true);
          setModal(null);
        } else if (e.type === 'caption' && e.text) showCaption(e.text, e.seconds ?? 4);
        else if (e.type === 'end') {
          setInRealm(false);
          setCaption(null);
          soundService.stopChauVan();
          if (!e.card) return; // left early
          const first = luckService.markFound(e.id);
          if (e.id.startsWith('realm-')) {
            const pid = e.id.replace('realm-', '') as PalaceId;
            storyService.giveKhan(pid);
            if (first) luckService.change(4, `The ${PALACES.find((p) => p.id === pid)?.en} returned its scarf`);
          } else if (e.id === 'haudong') {
            storyService.finishCeremony();
            if (first) luckService.change(5, 'Received lộc from the medium at the hầu đồng');
          }
          storyService.saveCard(e.id, e.card);
          setCard({ card: e.card, luck: e.id === 'haudong' ? 5 : 4, firstTime: first });
        }
      },
    });
    // returning visitors reappear where they left off; first-timers arrive by boat
    let saved: { x: number; z: number; yaw: number } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem('pvt_pos') || 'null');
    } catch {
      /* ignore */
    }
    if (saved) {
      arrivedThisVisit = true;
      s.placePlayer(saved.x, saved.z, saved.yaw);
      window.setTimeout(() => showCaption('Welcome back. The Mothers kept your place.', 4), 1500);
    } else if (!arrivedThisVisit) {
      s.playArrival();
      setArriving(true);
    }
    soundService.setMood(time);
    const veil = window.setTimeout(() => setLoading(false), 9000); // never trap anyone behind the veil
    s.setTimeOfDay(time);
    s.onPointerLockChange = setLocked;
    {
      const found = luckService.get().found;
      s.setActiveSecret(nextSecret(found)?.id ?? null, found);
    }
    scene.current = s;
    setSpots(s.spotList);
    soundService.startAmbient();
    return () => {
      clearTimeout(veil);
      setLoading(true);
      soundService.stopAmbient();
      soundService.stopChauVan();
      s.dispose();
      scene.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // the temple follows the real clock
  useEffect(() => {
    try {
      localStorage.setItem('pvt_live', live ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (!live || view !== 'temple') return;
    const t = liveTimeOfDay(cal.now);
    if (t !== time) {
      setTime(t);
      soundService.setMood(t);
      scene.current?.setTimeOfDay(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, view, cal.now]);

  // dev: open a ritual straight away (?ritual=incense|fortune|haudong)
  useEffect(() => {
    if (!import.meta.env.DEV || view !== 'temple') return;
    const r = new URLSearchParams(location.search).get('ritual');
    if (r) window.setTimeout(() => setModal(r as Modal), 1500);
  }, [view]);

  // the hầu đồng is held (and heard) only during its sessions
  useEffect(() => {
    if (view !== 'temple') return;
    scene.current?.setCeremony(!!hd.on && !inRealm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, !!hd.on, inRealm, loading]);

  // the bells at dawn and dusk ring on their own
  useEffect(() => {
    if (view !== 'temple') return;
    const h = hourOf(cal.now);
    const bell = sched.find((x) => x.kind === 'bell' && h >= x.from && h < x.from + 1 / 30);
    const key = bell ? `${cal.now.toDateString()}-${bell.from}` : '';
    if (bell && rung.current !== key) {
      rung.current = key;
      soundService.playGreatBell();
      showCaption(bell.from < 12 ? 'The morning bell. Bà Thủ Từ lights the first incense of the day.' : 'The evening bell. The lanterns are being lit.', 5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cal.now]);

  // decorations and crowds for today's festival
  useEffect(() => {
    if (view !== 'temple') return;
    scene.current?.setFestival(cal.festival?.decor ?? null, !!cal.festival?.major);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cal.festival?.id]);

  // tell the visitor about today's festival once they're inside
  useEffect(() => {
    if (view !== 'temple' || arriving || tips || loading || !cal.festival) return;
    setFestBanner(true);
    const t = window.setTimeout(() => setFestBanner(false), 12000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, arriving, tips, loading, cal.festival?.id]);

  // remember where the visitor stands
  useEffect(() => {
    if (view !== 'temple') return;
    const t = window.setInterval(() => {
      const s = scene.current;
      if (!s || s.inRealm || s.arriving) return;
      try {
        localStorage.setItem('pvt_pos', JSON.stringify({ x: +s.playerPosition.x.toFixed(2), z: +s.playerPosition.z.toFixed(2), yaw: +s.playerRotationY.toFixed(3) }));
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(t);
  }, [view]);

  // apply settings to the scene
  useEffect(() => {
    const s = scene.current;
    if (!s) return;
    s.look.sensitivity = settings.sensitivity;
    s.look.invertY = settings.invertY;
    s.look.pointerLock = settings.pointerLock;
    s.setFov(settings.fov);
    s.setQuality(settings.quality);
    saveSettings(settings);
  }, [settings, view]);

  // give the mouse back whenever a panel opens, and stand still while it's open
  useEffect(() => {
    const busy = !!(modal || card || showPhuc || tips);
    if (busy) scene.current?.releasePointer();
    if (scene.current) scene.current.inputEnabled = !busy;
  }, [modal, card, showPhuc, tips, loading]);

  useEffect(() => {
    if (!unlocked || card || modal) return;
    const t = window.setTimeout(() => setUnlocked(false), 4200);
    return () => clearTimeout(t);
  }, [unlocked, card, modal]);
  const getSecretDistance = useCallback(() => scene.current?.activeSecretDistance ?? null, []);
  const openJournal = (t: typeof journalTab = 'story') => {
    setJournalTab(t);
    setModal('journal');
  };
  const closeTips = () => {
    setTips(false);
    try {
      localStorage.setItem('pvt_tips', '1');
    } catch {
      /* ignore */
    }
  };

  const getPlayer = useCallback(() => {
    const s = scene.current;
    return s && !s.inRealm ? { x: s.playerPosition.x, z: s.playerPosition.z, rotY: s.playerRotationY } : null;
  }, []);

  useBackLayer(view === 'temple' && tips && !loading && !arriving, () => closeTips());
  useEffect(() => {
    if (!tips || loading || arriving || view !== 'temple') return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeTips();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  useBackLayer(view === 'temple' && arriving, () => scene.current?.skipArrival());
  // Back / Esc: leave a realm first, then the temple itself
  useBackLayer(view === 'temple', () => setView('landing'));
  useBackLayer(inRealm, () => scene.current?.leaveLegend());

  /* ---------------- interactions ---------------- */
  const ringBell = () => {
    scene.current?.ringBell();
    if (!storyService.get().started) {
      showCaption('The bell\'s deep voice rolls out over the river and the paddies.', 4);
      return;
    }
    showCaption('The bell\'s voice climbs into the sky… and the sky answers.', 3);
    setTimeout(() => scene.current?.enterRealm('realm-thien'), 2200);
  };

  const openRitual = (k: RitualKey | string) => {
    if (k === 'gate') return scene.current?.bow();
    if (k === 'bell') return ringBell();
    if (k === 'river') return setModal('lantern');
    if (k === 'theatre') return setModal('film');
    if (k === 'haudong') {
      if (hd.on) {
        const c = scene.current?.startWatching();
        if (c) {
          setWatchCtl(c);
          setModal('haudong');
        }
        return;
      }
      return showCaption(hd.next ? `The mat is empty for now. The next hầu đồng begins at ${fmtHour(hd.next.from)}.` : 'The hall is quiet tonight. Hầu đồng is held again tomorrow morning.', 5);
    }
    if (k === 'keeper' || k === 'incense' || k === 'altar' || k === 'fortune' || k === 'furnace' || k === 'stall' || k === 'lantern') setModal(k as Modal);
  };

  // keyboard: E to interact
  useEffect(() => {
    if (view !== 'temple') return;
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && near && !modal && !card && !inRealm) openRitual(near.type);
      else if ((e.key === 'f' || e.key === 'F') && !modal && !card && !inRealm) setModal('film');
      else if ((e.key === 'g' || e.key === 'G') && !modal && !card && !inRealm && !arriving) guide();
      else if ((e.key === 'j' || e.key === 'J') && !modal) openJournal();
      else if ((e.key === 't' || e.key === 'T') && !modal) openJournal('trail');
      else if ((e.key === 'm' || e.key === 'M') && !modal) setSettings((st) => ({ ...st, minimap: !st.minimap }));
      else if (e.key === '?' && !modal) setModal('controls');
      else if (e.key === '1' && !modal) changeTime('day');
      else if (e.key === '2' && !modal) changeTime('twilight');
      else if (e.key === '3' && !modal) changeTime('night');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // clicking a golden marker: use it if you're there, otherwise travel to it first
  spotClick.current = (id: string) => {
    if (modal || card || inRealm) return;
    const spot = spots.find((x) => x.id === id);
    if (!spot) return;
    if (near?.id === id) return openRitual(spot.type);
    scene.current?.travelToSpot(id, () => spot.type !== 'view' && spot.type !== 'gate' && window.setTimeout(() => openRitual(spot.type), 450));
  };

  // the firefly guide: to the story's next step, or to the current secret
  const guide = (what: 'story' | 'secret' = 'story') => {
    const st = storyService.get();
    const sec = nextSecret(luckService.get().found);
    const spotAt = (id: string) => spots.find((x) => x.id === id)?.at ?? null;
    let at: [number, number] | null = null;
    if (what === 'secret' && sec) at = sec.at;
    else if (!st.started || (st.khan.length === 4 && !st.ceremony)) at = spotAt('keeper');
    else if (st.khan.length < 4) {
      const p = PALACES.find((x) => !st.khan.includes(x.id))!;
      at = spotAt({ thien: 'bell', 'thuong-ngan': 'grotto', thoai: 'pond', dia: 'banyan' }[p.id] ?? 'keeper');
    } else if (sec) at = sec.at;
    if (!at) return showCaption('The firefly circles you happily. Nothing left to find… for now.', 4);
    scene.current?.guideTo(at[0], at[1]);
    showCaption('The firefly darts ahead. Follow its light.', 3);
  };

  // today's festival activity: once per festival for phúc, then the ritual itself
  const doFestival = (f: Festival) => {
    setModal(null);
    const k = festivalKey(f, cal.lunar);
    if (!isFestivalDone(k)) {
      markFestivalDone(k);
      luckService.change(3, `Kept ${f.vi}`);
    }
    const r = f.activity.ritual;
    if (r === 'carp') {
      scene.current?.travelToSpot('river', () => window.setTimeout(() => scene.current?.releaseCarp(), 600));
      showCaption(f.activity.done, 5);
    } else if (r === 'star') {
      scene.current?.carryStar(true);
      showCaption(f.activity.done, 5);
    } else {
      window.setTimeout(() => setModal(r), 250);
    }
  };

  const changeTime = (t: TimeOfDay, manual = true) => {
    if (manual) setLive(false);
    soundService.setMood(t);
    setTime(t);
    scene.current?.setTimeOfDay(t);
  };

  const ready = story.khan.length === 4 && !story.ceremony;

  if (view === 'landing')
    return (
      <>
        <Landing
          onEnter={() => {
            soundService.playGreatBell();
            setView('temple');
          }}
          onWatch={() => setModal('film')}
        />
        {modal === 'film' && <LegendFilm onClose={() => setModal(null)} />}
      </>
    );

  return (
    <div className="fixed inset-0 bg-[#2a1410] overflow-hidden">
      <div ref={mount} className="absolute inset-0 cursor-grab active:cursor-grabbing" style={gaze > 0.02 ? { filter: 'url(#gaze-ripple)' } : undefined} />
      {/* the gaze trap: the edges of the world blur and ripple like water */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="gaze-ripple">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves={2} seed={3}>
            <animate attributeName="baseFrequency" dur="5s" values="0.008 0.014;0.011 0.02;0.008 0.014" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale={Math.round(gaze * 34)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {gaze > 0.02 && (
        <div
          className="fixed inset-0 z-10 pointer-events-none"
          style={{
            backdropFilter: `blur(${(gaze * 9).toFixed(1)}px)`,
            WebkitBackdropFilter: `blur(${(gaze * 9).toFixed(1)}px)`,
            maskImage: 'radial-gradient(ellipse at center, transparent 38%, black 82%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 38%, black 82%)',
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(120,10,10,${(gaze * 0.45).toFixed(2)}) 100%)`,
          }}
        />
      )}
      {vision && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none vision-in">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,200,120,.55),rgba(90,8,8,.85)_60%,rgba(0,0,0,.95))]" />
          <div className="relative text-center px-6">
            <div className="dh-title text-4xl sm:text-5xl text-[#fff1c4] drop-shadow-[0_0_30px_rgba(255,190,90,.9)]">Mẫu nhìn con</div>
            <p className="mt-3 font-display italic text-lg text-[#f3d9a0]">For a moment, the Mother looks back. Then the trance lets you go.</p>
          </div>
        </div>
      )}

      {/* top-left: back, place */}
      <div className={`fixed top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-30 flex items-center gap-2 ${modal === 'haudong' ? 'hidden' : ''}`}>
        <button
          onClick={() => (inRealm ? scene.current?.leaveLegend() : setView('landing'))}
          className="flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-xl dh-paper border border-[#211a15] text-[#2a1d14] text-xs font-semibold shadow-md cursor-pointer hover:border-[#8e1b1b]"
          aria-label={inRealm ? 'Back to the temple' : 'Leave the temple'}
          title={inRealm ? 'Back to the temple (Esc)' : 'Leave (Esc)'}
        >
          <ArrowLeft className="w-4 h-4 text-[#8e1b1b]" />
          <span>{inRealm ? 'Temple' : 'Leave'}</span>
          <kbd className="hidden pointer-fine:inline ml-1 px-1 rounded border border-[#211a15] text-[10px] text-[#6d5b49] font-sans">Esc</kbd>
        </button>
        <div className="hidden min-[520px]:flex items-center gap-2 px-3 py-2 rounded-xl dh-paper border border-[#211a15] shadow-md text-xs">
          <span className="text-[#4a3826] font-semibold">Phủ Vân Thủy</span>
        </div>

      </div>

      {/* top-right: phúc, scarves, journal, sound */}
      <div className={`fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-30 flex items-center gap-1.5 sm:gap-2 ${modal === 'haudong' ? 'hidden' : ''}`}>
        <CalendarChip now={cal.now} lunar={cal.lunar} festival={cal.festival} onClick={() => setModal('calendar')} />
        <LuckChip onClick={() => setShowPhuc(true)} compact />
        <button onClick={() => openJournal()} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl dh-paper border border-[#211a15] shadow-md cursor-pointer hover:border-[#8e1b1b]" aria-label={`Journal: ${story.khan.length} of 4 scarves`}>
          <span className="flex -space-x-2.5">
            {PALACES.map((p) => (
              <KhanArt key={p.id} color={p.color} size={24} dim={!story.khan.includes(p.id)} />
            ))}
          </span>
          <span className="text-xs font-bold tabular-nums text-[#4a3826]">{story.khan.length}/4</span>
          <BookOpen className="w-4 h-4 text-[#8e1b1b] hidden sm:block" />
        </button>
        <button onClick={() => setModal('controls')} className="hidden pointer-fine:flex p-2 rounded-xl dh-paper border border-[#211a15] shadow-md cursor-pointer" aria-label="Controls" title="Controls (?)">
          <Keyboard className="w-4 h-4 text-[#4a3826]" />
        </button>
        <button onClick={() => setModal('settings')} className="p-2 rounded-xl dh-paper border border-[#211a15] shadow-md cursor-pointer" aria-label="Settings" title="Settings">
          <Gear className="w-4 h-4 text-[#4a3826]" />
        </button>
        <button
          onClick={() => {
            const m = !muted;
            setMuted(m);
            soundService.setMuted(m);
          }}
          className="p-2 rounded-xl dh-paper border border-[#211a15] shadow-md cursor-pointer"
          aria-label={muted ? 'Sound on' : 'Sound off'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-[#8a7762]" /> : <Volume2 className="w-4 h-4 text-[#8e1b1b]" />}
        </button>
      </div>

      {/* objective tracker: story goal + the current secret's riddle */}
      {!inRealm && !loading && !arriving && modal !== 'haudong' && (
        <div className={`fixed left-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+3rem)] z-20 ${modal ? 'hidden sm:block' : ''}`}>
          <Tracker getDistance={getSecretDistance} isNight={time === 'night'} onOpenTrail={() => openJournal('trail')} onGuide={guide} />
        </div>
      )}

      {/* a hầu đồng is happening right now */}
      {hd.on && !inRealm && !arriving && !modal && !festBanner && (
        <button
          onClick={() => {
            const seat = spots.find((x) => x.id === 'seat');
            if (seat) scene.current?.guideTo(seat.at[0], seat.at[1]);
            showCaption('Chầu văn drifts from the main hall. The firefly shows you to the mat.', 4);
          }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full dh-seal text-[12px] font-semibold cursor-pointer flex items-center gap-2"
          title="Find the mat at the back of the courtyard"
        >
          <span className="w-2 h-2 rounded-full bg-[#ffd27a] animate-pulse" /> Hầu đồng now in the main hall · until {fmtHour(hd.on.to)}
        </button>
      )}

      {/* today's festival */}
      {festBanner && cal.festival && !modal && !inRealm && (
        <button onClick={() => setModal('calendar')} className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-md dh-seal text-center cursor-pointer fest-in max-w-[92vw]">
          <div className="text-[11px] uppercase tracking-[0.2em] opacity-90">Hôm nay · today</div>
          <div className="dh-title text-lg leading-tight">{cal.festival.vi}</div>
          <div className="text-[12px] italic opacity-90">{cal.festival.en} · see what's happening</div>
        </button>
      )}

      {/* arrival by boat: letterbox, a printed title, skip */}
      {arriving && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[11vh] bg-black arrive-bar-top" />
          <div className="absolute inset-x-0 bottom-0 h-[14vh] bg-black arrive-bar-bottom" />
          <div className="absolute left-1/2 bottom-[17vh] -translate-x-1/2 arrive-title text-center">
            <div className="dh-paper px-8 py-4 rounded-sm">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#8f2a21] font-semibold">Phủ thờ Mẫu</div>
              <div className="dh-title text-3xl sm:text-4xl text-[#211a15] mt-1">Phủ Vân Thủy</div>
              <div className="font-display italic text-sm text-[#4a3826] mt-1">Dusk, on a river bend beneath the mountains</div>
            </div>
          </div>
          <button onClick={() => scene.current?.skipArrival()} className="pointer-events-auto absolute right-4 bottom-[3.5vh] px-3 py-1.5 rounded text-[13px] text-[#fbeed2] border border-white/30 hover:bg-white/10 cursor-pointer">
            Skip <kbd className="hidden pointer-fine:inline ml-1 px-1 rounded border border-white/30 text-[10px] font-sans">Space</kbd>
          </button>
        </div>
      )}

      {/* loading veil until the first frame is drawn */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#2a1410] text-[#fbeed2]" role="status">
          <span className="font-display font-bold text-4xl text-[#e9b84a] animate-pulse">Phủ Vân Thủy</span>
          <span className="mt-2 font-display italic text-lg">The Cloud &amp; Water Temple</span>
          <span className="mt-1 text-[13px] opacity-70">The mist is lifting…</span>
        </div>
      )}

      {/* first visit: how to move */}
      {tips && !loading && !arriving && !inRealm && !modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#2a1410]/55 backdrop-blur-[2px] p-4" onClick={closeTips}>
          <div className="w-[min(420px,100%)] rounded-lg dh-paper p-5 text-[#2a1d14]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How to explore">
            <div className="text-xs uppercase tracking-[0.18em] text-[#8e1b1b] font-semibold text-center">Chào mừng</div>
            <h2 className="mt-1 text-xl font-display font-bold text-center">How to explore</h2>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {isPc ? (
                <>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">↑ ↓ ← →</span>Walk and turn (or WASD). Hold Shift to hurry.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Mouse</span>Click the view, then move to look around. Esc frees the mouse.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Click</span>A golden marker to go there. E or Enter uses what's in front of you.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">J · T · F</span>Journal · secret trail · the legend film. <span className="text-[#6d5b49]">? shows every key.</span></li>
                </>
              ) : (
                <>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Left</span>Drag the joystick to walk.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Right</span>Drag anywhere to look around.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Tap</span>The red button that appears near places to use them.</li>
                </>
              )}
              <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">✦</span>Secrets wake one at a time. Follow the riddle in the top-left card; a golden shimmer shows when you're close.</li>
            </ul>
            <button onClick={closeTips} className="mt-5 w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#8e1b1b] to-[#b4301f] text-[#fff4dc] font-semibold cursor-pointer">
              Step inside
            </button>
          </div>
        </div>
      )}

      {/* a new riddle wakes after each secret card is closed */}
      {unlocked && !card && !modal && !inRealm && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-2xl bg-[#2a1410]/85 text-[#fbeed2] text-center shadow-2xl backdrop-blur-sm animate-[fadeUp_0.5s_ease-out] pointer-events-none">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#e9b84a] font-semibold">✦ {nextSecret(luckService.get().found) ? 'A new riddle wakes' : 'The trail is complete'}</div>
          <div className="mt-1 text-sm font-display italic max-w-[80vw]">{nextSecret(luckService.get().found)?.riddle ?? 'Every secret of the grounds is yours.'}</div>
        </div>
      )}

      {/* PC: minimap under the top bar, crosshair while the mouse is captured, key hints */}
      {!inRealm && !arriving && modal !== 'haudong' && settings.minimap && spots.length > 0 && (
        <div className="hidden lg:block fixed right-3 top-16 z-20">
          <Minimap spots={spots} getPlayer={getPlayer} onGo={(id) => scene.current?.teleportToSpot(id)} near={near?.id} />
        </div>
      )}
      {locked && <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 rounded-full pointer-events-none transition-all ${aim ? 'w-4 h-4 border-2 border-[#f2c14e] bg-[#f2c14e]/30' : 'w-1.5 h-1.5 bg-white/90 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]'}`} aria-hidden />}
      {locked && aim && (
        <div className="fixed left-1/2 top-[calc(50%+1.4rem)] -translate-x-1/2 z-20 px-3 py-1 rounded-lg bg-[#2a1410]/80 text-[#fbeed2] text-[12px] font-semibold pointer-events-none whitespace-nowrap">
          Click: go to {spots.find((x) => x.id === aim)?.vi}
        </div>
      )}
      {isPc && !inRealm && !modal && (
        <div className="hidden lg:flex fixed left-3 bottom-4 z-20 flex-col gap-1 px-3 py-2 rounded-xl bg-[#2a1410]/70 text-[#fbeed2] text-[12px] backdrop-blur-sm pointer-events-none">
          <span>{locked ? 'Mouse captured · Esc to release' : 'Click the view to look around'}</span>
          <span className="opacity-80">↑↓←→ move · E use · F film · ? all keys</span>
        </div>
      )}

      {!inRealm && !arriving && modal !== 'haudong' && (
        <Dock
          spots={spots}
          time={time}
          onTime={changeTime}
          auto={auto}
          live={live}
          onLive={() => {
            setAuto(false);
            if (scene.current) scene.current.isAutoCycleTime = false;
            setLive(true);
          }}
          onAuto={() => {
            const a = !auto;
            setLive(false);
            setAuto(a);
            if (scene.current) scene.current.isAutoCycleTime = a;
          }}
          tour={tour}
          onTour={() => {
            const t = !tour;
            setTour(t);
            if (scene.current) scene.current.isCinematicMode = t;
          }}
          onTeleport={(id) => scene.current?.travelToSpot(id)}
          onRitual={openRitual}
          onBow={() => scene.current?.bow()}
        >
          {near && !modal && PROMPT[near.type] && (
            <button
              onClick={() => openRitual(near.type)}
              className="px-5 py-2.5 rounded-md dh-seal font-semibold text-sm cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform"
            >
              <span className="pointer-coarse:hidden opacity-80">[E] </span>
              {PROMPT[near.type]}
            </button>
          )}
        </Dock>
      )}

      <VirtualJoystick
        onMove={(v) => {
          if (scene.current) scene.current.joystickVector = v;
        }}
      />

      {/* sheets */}
      {modal === 'keeper' && (
        <KeeperSheet
          onClose={() => setModal(null)}
          onStart={() => {
            storyService.start();
            luckService.change(1, 'Agreed to help the temple keeper');
          }}
        />
      )}
      {modal === 'incense' && (
        <IncenseRitual
          onClose={() => setModal(null)}
          onDone={(n) => {
            if (n % 2 === 0) luckService.change(-1, 'Incense is offered in odd numbers: one, three or five');
            else if (!visit.current.incense) luckService.change(2, `Lit ${n} stick${n > 1 ? 's' : ''} of incense with respect`);
            visit.current.incense = true;
            scene.current?.bow();
          }}
        />
      )}
      {modal === 'haudong' && watchCtl && (
        <HauDongSight
          ctl={watchCtl}
          onClose={() => {
            scene.current?.stopWatching();
            setWatchCtl(null);
            setModal(null);
          }}
          onBlessed={() => {
            const k = `pvt_hd_${new Date().toDateString()}`;
            try {
              if (!localStorage.getItem(k)) {
                localStorage.setItem(k, '1');
                luckService.change(2, 'Sat quietly through a hầu đồng and received lộc');
              }
            } catch {
              /* ignore */
            }
          }}
        />
      )}
      {modal === 'altar' && (
        <AltarModal
          onClose={() => setModal(null)}
          incenseDone={visit.current.incense}
          ready={ready}
          onPrayed={() => {
            if (!visit.current.prayed) luckService.change(visit.current.incense ? 2 : 1, visit.current.incense ? 'Lit incense, then prayed at the altar: the proper order' : 'Prayed at the altar');
            visit.current.prayed = true;
          }}
          onBegin={() => {
            setModal(null);
            scene.current?.enterRealm('haudong');
          }}
        />
      )}
      {modal === 'fortune' && <XamRitual onClose={() => setModal(null)} phuc={luckService.get().value} onDrawn={(n) => storyService.saveXam(n)} />}
      {modal === 'furnace' && (
        <PetitionModal
          onClose={() => setModal(null)}
          onBurned={(name, wish) => {
            storyService.savePetition({ name, wish });
            if (!visit.current.petition) luckService.change(1, 'Burned a sincere petition (sớ)');
            visit.current.petition = true;
          }}
        />
      )}
      {modal === 'stall' && (
        <StallModal
          onClose={() => setModal(null)}
          onReceive={(k: LocKind, who) => {
            storyService.receive(k, who);
            visit.current.lucky++;
            if (visit.current.lucky > 3 && !visit.current.hoardWarned) {
              visit.current.hoardWarned = true;
              luckService.change(-1, 'Lộc is meant to be shared, not hoarded');
            }
          }}
        />
      )}
      {modal === 'settings' && <SettingsSheet value={settings} onChange={setSettings} onClose={() => setModal(null)} />}
      {modal === 'controls' && <ControlsSheet onClose={() => setModal(null)} />}
      {modal === 'lantern' && (
        <LanternSheet
          night={time !== 'day'}
          onClose={() => setModal(null)}
          onRelease={(c) => {
            scene.current?.floatLantern(c);
            if (!visit.current.lantern) luckService.change(1, 'Set a lotus lantern on the river');
            visit.current.lantern = true;
          }}
        />
      )}
      {modal === 'film' && <LegendFilm onClose={() => setModal(null)} />}
      {modal === 'calendar' && <FestivalSheet onClose={() => setModal(null)} now={cal.now} lunar={cal.lunar} festival={cal.festival} onActivity={doFestival} schedule={sched} />}
      {modal === 'journal' && <JournalSheet onWatchFilm={() => setModal('film')} initial={journalTab} onClose={() => setModal(null)} onOpenCard={(c) => setCard({ card: c, luck: 0, firstTime: false })} />}

      <LuckToasts />
      <CaptionBar text={caption} />
      {card && <StoryCardSheet card={card.card} luck={card.luck} firstTime={card.firstTime} onClose={() => setCard(null)} />}
      {showPhuc && <LuckSheet onClose={() => setShowPhuc(false)} />}
    </div>
  );
}
