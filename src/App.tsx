import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Volume2, VolumeX, Settings as Gear } from 'lucide-react';
import { Minimap, SettingsSheet, ControlsSheet, LanternSheet, loadSettings, saveSettings, type Settings } from './components/PcHud';
import { TempleScene, type TimeOfDay } from './three/TempleScene';
import type { SpotDef } from './three/world/types';
import type { StoryCard } from './three/encounters/types';
import { Landing } from './components/Landing';
import type { RitualKey } from './components/Dock';
import { PlacesPicker } from './components/Places';
import { PuppetSight, createPuppetBus } from './components/PuppetSight';
import { KeeperTalk } from './components/Keeper';
import { JournalSheet } from './components/Journal';
import { Tracker } from './components/Trail';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
const LegendFilm = lazy(() => import('./components/LegendFilm').then((m) => ({ default: m.LegendFilm })));
import { useCalendar, TempleClock, FestivalSheet, festivalKey, isFestivalDone, markFestivalDone } from './components/Calendar';
import { liveTimeOfDay, today, type Festival } from './services/lunar';
import { SECRETS, nextSecret } from './data/story';
import { AltarModal, PetitionModal, StallModal, XamSlip, drawXam } from './components/Rituals';
import { IncenseRitual, XamRitual } from './components/RitualStage';
import { HauDongSight, type CeremonyControl } from './components/HauDongSight';
import { PossessionVeil, createPossessBus } from './components/PossessionVeil';
import { daySchedule, hauDongState, fmtHour, hourOf } from './services/templeDay';
import { KhanArt } from './components/LocArt';
import { LuckChip, LuckToasts, CaptionBar, StoryCardSheet, LuckSheet } from './components/LuckAndLegends';
import { soundService } from './services/soundService';
import { luckService } from './services/luckService';
import { storyService, useStory } from './services/storyService';
import { useBackLayer } from './services/backStack';
import { PALACES, type PalaceId } from './data/story';
import { XAM_TIER, type LocKind, type Xam } from './data/rituals';

type Modal = 'keeper' | 'incense' | 'altar' | 'fortune' | 'furnace' | 'stall' | 'journal' | 'settings' | 'controls' | 'lantern' | 'film' | 'calendar' | 'haudong' | 'places' | 'puppets' | null;

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
  theatre: 'Watch the water puppets',
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
  // thanh đồng: inside the medium
  const possessBus = useMemo(() => createPossessBus(), []);
  const [possessing, setPossessing] = useState(false);
  const [touchWarn, setTouchWarn] = useState(0);
  // the key list shows for 20 seconds after arriving, then steps out of the way
  const [keysHint, setKeysHint] = useState(true);
  // talking to Bà Thủ Từ: face her, and keep her bubble over her head
  const puppetBus = useMemo(() => createPuppetBus(), []);
  const teuAnchor = useCallback(() => scene.current?.project('teu', 1.15) ?? null, []);
  const keeperAnchor = useCallback(() => scene.current?.project('keeper', 1.62) ?? null, []);
  useEffect(() => {
    scene.current?.talkTo(modal === 'keeper' ? 'keeper' : null, 1.42);
  }, [modal]);
  // first-person rites
  const [rite, setRite] = useState<string | null>(null);
  const [riteHint, setRiteHint] = useState<string | null>(null);
  const [xamCard, setXamCard] = useState<Xam | null>(null);
  const lastXam = useRef<Xam | null>(null);
  const riteDone = useRef<(r: { kind: string; n?: number }) => void>(() => {});
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
      onPuppet: (e) => puppetBus.emit(e),
      onPossess: (e) => {
        if (e.type === 'touch') {
          setTouchWarn((n) => n + 1);
          return;
        }
        if (e.type === 'phase' && e.phase === 'taken') {
          setPossessing(true);
          setWatchCtl(null);
          setModal((m) => (m === 'haudong' ? null : m));
        }
        if (e.type === 'phase' && e.phase === 'done') {
          window.setTimeout(() => setPossessing(false), 3800);
          try {
            const n = parseInt(localStorage.getItem('pvt_chosen') ?? '0', 10) || 0;
            localStorage.setItem('pvt_chosen', String(n + 1));
          } catch {
            /* ignore */
          }
        }
        possessBus.emit(e);
      },
      onRiteHint: setRiteHint,
      onRiteDone: (r) => riteDone.current(r),
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
    if (r) window.setTimeout(() => openRitualRef.current(r), 2500);
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
  const getSecretDir = useCallback(() => scene.current?.activeSecretDir ?? null, []);
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
  // Esc with nothing open: the first press only frees the mouse and asks; a second press within 3 s leaves
  const leaveAsk = useRef(0);
  useBackLayer(view === 'temple', () => {
    if (performance.now() - leaveAsk.current < 3000) return setView('landing');
    leaveAsk.current = performance.now();
    scene.current?.releasePointer();
    showCaption('Press Esc again to leave the temple.', 3);
  });
  useBackLayer(inRealm, () => scene.current?.leaveLegend());
  useBackLayer(possessing, () => scene.current?.skipPossession());

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

  const openRitualRef = useRef<(k: string) => void>(() => {});
  const openRitual = (k: RitualKey | string) => {
    if (k === 'gate') return scene.current?.bow();
    if (k === 'bell') return ringBell();
    if (k === 'river') return setModal('lantern');
    if (k === 'theatre') {
      // múa rối nước: sit on the bank and watch
      if (scene.current?.startPuppets()) setModal('puppets');
      return;
    }
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
    if (k === 'incense' || k === 'altar' || k === 'fortune') return beginRite(k);
    if (k === 'keeper' || k === 'furnace' || k === 'stall' || k === 'lantern') setModal(k as Modal);
  };

  useEffect(() => {
    if (view !== 'temple' || loading || arriving) return;
    setKeysHint(true);
    const t = window.setTimeout(() => setKeysHint(false), 20000);
    return () => clearTimeout(t);
  }, [view, loading, arriving]);
  // keyboard: E to interact. No dependency list on purpose: the handler reads a lot of current
  // state (near, modal, rite…), so it is re-attached after every render rather than going stale.
  useEffect(() => {
    if (view !== 'temple') return;
    const onKey = (e: KeyboardEvent) => {
      if (rite || possessing) return;
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') && near && !modal && !card && !inRealm && !arriving) {
        e.preventDefault();
        openRitual(near.type);
      } else if ((e.key === 'p' || e.key === 'P') && !modal && !card && !inRealm && !arriving) {
        if (near?.type === 'altar') beginRite('altar');
        else if (scene.current && !scene.current.inRite) {
          setRite('pray');
          scene.current.startRite('pray');
        }
      } else if ((e.key === 'f' || e.key === 'F') && !modal && !card && !inRealm && !arriving) {
        if (near?.type === 'fortune') beginRite('fortune');
        else {
          const sp = spots.find((x) => x.type === 'fortune');
          if (sp) scene.current?.guideTo(sp.at[0], sp.at[1]);
          showCaption('The fortune sticks wait on the red table inside the hall, on the right. The firefly will show you.', 4);
        }
      } else if ((e.key === 'l' || e.key === 'L') && !modal && !card && !inRealm) setModal('film');
      else if ((e.key === 'g' || e.key === 'G') && !modal && !card && !inRealm && !arriving) guide();
      else if ((e.key === 'j' || e.key === 'J') && !modal) openJournal();
      else if ((e.key === 't' || e.key === 'T') && !modal) openJournal('trail');
      else if ((e.key === 'm' || e.key === 'M') && !modal) setSettings((st) => ({ ...st, minimap: !st.minimap }));
      else if (e.key === '?' && !modal) setModal('controls');
      else if (e.key === '1' && !modal) changeTime('day');
      else if (e.key === '2' && !modal) changeTime('twilight');
      else if (e.key === '3' && !modal) changeTime('night');
      else if (e.key === '4' && !modal) {
        // follow the real clock again
        setAuto(false);
        if (scene.current) scene.current.isAutoCycleTime = false;
        setLive(true);
      } else if (e.key === '5' && !modal) {
        const a = !auto;
        setLive(false);
        setAuto(a);
        if (scene.current) scene.current.isAutoCycleTime = a;
        showCaption(a ? 'Time flows: day into dusk into night.' : 'Time holds still.', 2.5);
      } else if ((e.key === 'c' || e.key === 'C') && !modal && !inRealm) {
        const t = !tour;
        setTour(t);
        if (scene.current) scene.current.isCinematicMode = t;
      } else if (e.key === 'Tab' && !modal && !card && !inRealm && !arriving) {
        e.preventDefault();
        scene.current?.releasePointer();
        setModal('places');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  openRitualRef.current = (k) => openRitual(k);
  // rites done with your own hands, in the temple itself
  const beginRite = (k: 'incense' | 'altar' | 'fortune') => {
    const s = scene.current;
    if (!s || s.inRite) return;
    setRite(k);
    if (k === 'incense') s.startRite('incense');
    else if (k === 'altar') s.startRite('pray');
    else
      s.startRite('xam', () => {
        const x = drawXam(luckService.get().value);
        lastXam.current = x;
        return { n: x.n, verse: x.verse, color: XAM_TIER[x.tier].color };
      });
  };
  riteDone.current = (r) => {
    if (r.kind === 'incense' && r.n) {
      const n = r.n;
      if (n % 2 === 0) luckService.change(-1, 'Incense is offered in odd numbers: one, three or five');
      else if (!visit.current.incense) luckService.change(2, `Lit ${n} stick${n > 1 ? 's' : ''} of incense with respect`);
      visit.current.incense = true;
      showCaption(n % 2 ? 'The smoke rises straight up from the ash.' : 'An old woman smiles kindly: "Odd numbers, dear. Even numbers are kept for mourning."', 5);
      setRite(null);
    } else if (r.kind === 'bow') {
      const was = rite;
      setRite(null);
      if (was === 'altar') window.setTimeout(() => setModal('altar'), 300);
      else if (was === 'pray') showCaption('A quiet prayer, carried up with the incense smoke.', 3);
    } else if (r.kind === 'xam-drawn' && r.n) {
      storyService.saveXam(r.n);
      setXamCard(lastXam.current);
    } else if (r.kind === 'xam') {
      setXamCard(null);
      setRite(null);
    }
  };
  useBackLayer(view === 'temple' && !!rite, () => {
    scene.current?.cancelRite();
    setRite(null);
    setRiteHint(null);
    setXamCard(null);
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
        {modal === 'film' && (
          <ErrorBoundary onReset={() => setModal(null)}>
            <Suspense fallback={null}>
              <LegendFilm onClose={() => setModal(null)} />
            </Suspense>
          </ErrorBoundary>
        )}
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
      {possessing && <PossessionVeil bus={possessBus} />}
      {touchWarn > 0 && !possessing && (
        <div key={touchWarn} className="fixed inset-x-0 top-[40%] z-[46] text-center pointer-events-none touch-warn">
          <div className="font-display italic text-xl sm:text-2xl text-[#f0c9a8] [text-shadow:0_0_14px_#000]">…đừng chạm…</div>
          <div className="font-display italic text-sm text-[#d9b89a]/80 [text-shadow:0_0_8px_#000]">…do not touch…</div>
        </div>
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
      <div className={`fixed top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-30 flex items-center gap-2 ${modal === 'haudong' || modal === 'puppets' || possessing ? 'hidden' : ''}`}>
        <button
          onClick={() => (inRealm ? scene.current?.leaveLegend() : setView('landing'))}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl dh-paper border border-[#211a15] text-[#2a1d14] text-xs font-semibold shadow-md cursor-pointer hover:border-[#8e1b1b]"
          aria-label={inRealm ? 'Back to the temple' : 'Leave the temple'}
          title={inRealm ? 'Back to the temple (Esc)' : 'Leave (Esc)'}
        >
          <ArrowLeft className="w-4 h-4 text-[#8e1b1b]" />
          <kbd className="px-1 rounded border border-[#211a15] text-[10px] text-[#6d5b49] font-sans">Esc</kbd>
        </button>

      </div>

      {/* top-right: phúc, scarves, journal, sound */}
      <div className={`fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-30 flex items-center gap-1.5 sm:gap-2 ${modal === 'haudong' || modal === 'puppets' || possessing ? 'hidden' : ''}`}>
        <TempleClock lunar={cal.lunar} festival={cal.festival} tod={time} live={live} onClick={() => setModal('calendar')} />
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
      {!inRealm && !loading && !arriving && modal !== 'haudong' && modal !== 'puppets' && !rite && !possessing && (
        <div className={`fixed left-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+3rem)] z-20 ${modal ? 'hidden sm:block' : ''}`}>
          <Tracker getDistance={getSecretDistance} getDir={getSecretDir} isNight={time === 'night'} onOpenTrail={() => openJournal('trail')} onGuide={guide} />
        </div>
      )}

      {/* what your hands do next */}
      {riteHint && (
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 max-w-[min(620px,92vw)] px-4 py-1.5 rounded-full bg-[#140b08]/55 backdrop-blur-sm text-center pointer-events-none rite-hint" key={riteHint.replace(/[▮▯].*$/, '')}>
          <p className="text-[13px] leading-snug text-[#fbeed2]">
            {riteHint} <span className="opacity-60">· Esc</span>
          </p>
        </div>
      )}
      {xamCard && (
        <div className="fixed right-4 top-20 z-30 w-[min(360px,90vw)] dh-paper rounded-md p-3 fest-in max-h-[70vh] overflow-y-auto">
          <XamSlip x={xamCard} />
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
          <span className="w-2 h-2 rounded-full bg-[#ffd27a] animate-pulse" /> Hầu đồng · until {fmtHour(hd.on.to)}
        </button>
      )}

      {/* today's festival */}
      {festBanner && cal.festival && !modal && !inRealm && (
        <button onClick={() => setModal('calendar')} className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-md dh-seal text-center cursor-pointer fest-in max-w-[92vw]">
          <div className="dh-title text-lg leading-tight">{cal.festival.vi}</div>
          <div className="text-[12px] italic opacity-90">{cal.festival.en}</div>
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
              {(
                <>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">↑ ↓ ← →</span>Walk and turn (or WASD). Hold Shift to hurry.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Mouse</span>Click the view, then move to look around. Esc frees the mouse.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Space</span>Use what's in front of you, with your own hands. Click a golden marker to go there.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">B · P · F</span>Vái (bow) · pray · fortune sticks.</li>
                  <li className="flex gap-3"><span className="w-16 shrink-0 font-semibold text-[#8e1b1b]">Tab · J · L</span>Go to a place · journal · the legend film. <span className="text-[#6d5b49]">? shows every key.</span></li>
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
      {!inRealm && !arriving && modal !== 'haudong' && modal !== 'puppets' && !possessing && settings.minimap && spots.length > 0 && (
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
      {/* the keys, shown for a moment when you arrive, then just a whisper of "?" */}
      {!inRealm && !modal && !rite && !possessing && !arriving && !loading && (
        <div className={`fixed left-3 bottom-4 z-20 px-3 py-2 rounded-xl bg-[#2a1410]/60 text-[#fbeed2] text-[12px] backdrop-blur-sm pointer-events-none transition-opacity duration-1000 ${keysHint ? 'opacity-100' : 'opacity-0'}`}>
          ↑↓←→ walk · R turn back · Space use · B vái · P pray · F xăm · Tab places
        </div>
      )}
      {/* until the mouse is captured, say how to look around */}
      {!inRealm && !modal && !rite && !possessing && !arriving && !loading && !locked && !near && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-[#2a1410]/55 text-[#fbeed2] text-[12px] pointer-events-none">
          Click to look around · R turn back
        </div>
      )}
      {!inRealm && !modal && !rite && !possessing && !arriving && !loading && !keysHint && (
        <button onClick={() => setModal('controls')} className="fixed left-3 bottom-4 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-[#2a1410]/45 hover:bg-[#2a1410]/75 text-[#fbeed2]/80 text-[12px] font-bold cursor-pointer" title="Every key (?)" aria-label="Controls">
          ?
        </button>
      )}

      {/* what Space does here: a quiet hint, not a button */}
      {!inRealm && !arriving && !rite && !possessing && near && !modal && PROMPT[near.type] && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#140b08]/60 backdrop-blur-sm text-[#fbeed2] text-[13px] pointer-events-none">
          <kbd className="px-1.5 py-0.5 rounded bg-[#b8382b] text-[11px] font-bold text-[#f3ead6]">Space</kbd>
          {PROMPT[near.type]}
        </div>
      )}
      {modal === 'puppets' && (
        <PuppetSight
          bus={puppetBus}
          anchor={teuAnchor}
          onClose={() => {
            scene.current?.stopPuppets();
            setModal(null);
          }}
        />
      )}
      {modal === 'places' && (
        <PlacesPicker
          spots={spots}
          onClose={() => setModal(null)}
          onGo={(id) => {
            setModal(null);
            scene.current?.travelToSpot(id);
          }}
        />
      )}

      {/* sheets */}
      <ErrorBoundary key={modal ?? (card ? 'card' : 'none')} onReset={() => {
        setModal(null);
        setCard(null);
        setShowPhuc(false);
      }}>
      {modal === 'keeper' && (
        <KeeperTalk
          anchor={keeperAnchor}
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
          onTouch={(x, y) => !!scene.current?.touchMedium(x, y)}
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
      {modal === 'film' && (
          <ErrorBoundary onReset={() => setModal(null)}>
            <Suspense fallback={null}>
              <LegendFilm onClose={() => setModal(null)} />
            </Suspense>
          </ErrorBoundary>
        )}
      {modal === 'calendar' && <FestivalSheet onClose={() => setModal(null)} now={cal.now} lunar={cal.lunar} festival={cal.festival} onActivity={doFestival} schedule={sched} />}
      {modal === 'journal' && <JournalSheet onWatchFilm={() => setModal('film')} initial={journalTab} onClose={() => setModal(null)} onOpenCard={(c) => setCard({ card: c, luck: 0, firstTime: false })} />}

      <LuckToasts />
      <CaptionBar text={caption} />
      {card && <StoryCardSheet card={card.card} luck={card.luck} firstTime={card.firstTime} onClose={() => setCard(null)} />}
      {showPhuc && <LuckSheet onClose={() => setShowPhuc(false)} />}
      </ErrorBoundary>
    </div>
  );
}
