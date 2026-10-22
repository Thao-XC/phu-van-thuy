import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { TempleScene, type TimeOfDay } from './three/TempleScene';
import type { SpotDef } from './three/world/types';
import type { StoryCard } from './three/encounters/types';
import { Landing } from './components/Landing';
import { Dock, type RitualKey } from './components/Dock';
import { KeeperSheet } from './components/Keeper';
import { JournalSheet } from './components/Journal';
import { IncenseModal, AltarModal, XamModal, PetitionModal, StallModal } from './components/Rituals';
import { KhanArt } from './components/LocArt';
import { LuckChip, LuckToasts, CaptionBar, StoryCardSheet, LuckSheet } from './components/LuckAndLegends';
import { VirtualJoystick } from './components/VirtualJoystick';
import { soundService } from './services/soundService';
import { luckService } from './services/luckService';
import { storyService, useStory } from './services/storyService';
import { useBackLayer } from './services/backStack';
import { PALACES, type PalaceId } from './data/story';
import type { LocKind } from './data/rituals';

type Modal = 'keeper' | 'incense' | 'altar' | 'fortune' | 'furnace' | 'stall' | 'journal' | null;

const PROMPT: Record<string, string> = {
  gate: 'Vái before the gate',
  keeper: 'Talk to Bà Thủ Từ',
  incense: 'Light incense',
  altar: 'Pray at the altar',
  fortune: 'Ask the fortune sticks',
  furnace: 'Write & burn a petition',
  bell: 'Strike the great bell',
  stall: 'Receive lộc',
};

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
  const [time, setTime] = useState<TimeOfDay>('twilight');
  const [auto, setAuto] = useState(false);
  const [tour, setTour] = useState(false);
  const [muted, setMuted] = useState(soundService.getMuted());
  const [spots, setSpots] = useState<SpotDef[]>([]);
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<TempleScene | null>(null);
  // per-visit manners
  const visit = useRef({ incense: false, prayed: false, petition: false, lucky: 0, hoardWarned: false });

  const showCaption = useCallback((t: string, s = 4) => {
    setCaption(t);
    if (capTimer.current) clearTimeout(capTimer.current);
    capTimer.current = window.setTimeout(() => setCaption(null), s * 1000);
  }, []);

  /* ---------------- the 3D temple ---------------- */
  useEffect(() => {
    if (view !== 'temple' || !mount.current) return;
    visit.current = { incense: false, prayed: false, petition: false, lucky: 0, hoardWarned: false };
    const s = new TempleScene(mount.current, {
      onNearSpot: (id, name, type) => setNear(id && name && type ? { id, name, type } : null),
      onCaption: (t, sec) => showCaption(t, sec),
      onLuck: (d, reason) => luckService.change(d, reason),
      onSecret: (id, c, luck) => {
        const first = luckService.markFound(id);
        if (first) luckService.change(luck, `Discovered: ${c.title}`);
        storyService.saveCard(id, c);
        setCard({ card: c, luck, firstTime: first });
      },
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
    s.setTimeOfDay(time);
    scene.current = s;
    setSpots(s.spotList);
    soundService.startAmbient();
    return () => {
      soundService.stopAmbient();
      soundService.stopChauVan();
      s.dispose();
      scene.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

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
    if (k === 'keeper' || k === 'incense' || k === 'altar' || k === 'fortune' || k === 'furnace' || k === 'stall') setModal(k);
  };

  // keyboard: E to interact
  useEffect(() => {
    if (view !== 'temple') return;
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      if ((e.key === 'e' || e.key === 'E') && near && !modal && !inRealm) openRitual(near.type);
      else if (e.key === '1') changeTime('day');
      else if (e.key === '2') changeTime('twilight');
      else if (e.key === '3') changeTime('night');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const changeTime = (t: TimeOfDay) => {
    setTime(t);
    scene.current?.setTimeOfDay(t);
  };

  const ready = story.khan.length === 4 && !story.ceremony;

  if (view === 'landing')
    return (
      <Landing
        onEnter={() => {
          soundService.playGreatBell();
          setView('temple');
        }}
      />
    );

  return (
    <div className="fixed inset-0 bg-[#2a1410] overflow-hidden">
      <div ref={mount} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* top-left: back, place */}
      <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-30 flex items-center gap-2">
        <button
          onClick={() => (inRealm ? scene.current?.leaveLegend() : setView('landing'))}
          className="flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-xl bg-[#fbf3e2]/95 border border-[#d9c7a6] text-[#2a1d14] text-xs font-semibold shadow-md cursor-pointer hover:border-[#8e1b1b]"
          aria-label={inRealm ? 'Back to the temple' : 'Leave the temple'}
          title={inRealm ? 'Back to the temple (Esc)' : 'Leave (Esc)'}
        >
          <ArrowLeft className="w-4 h-4 text-[#8e1b1b]" />
          <span>{inRealm ? 'Temple' : 'Leave'}</span>
          <kbd className="hidden pointer-fine:inline ml-1 px-1 rounded border border-[#d9c7a6] text-[10px] text-[#6d5b49] font-sans">Esc</kbd>
        </button>
        <div className="hidden min-[520px]:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fbf3e2]/95 border border-[#d9c7a6] shadow-md text-xs">
          <span className="font-han text-[#8e1b1b] font-bold">雲水府</span>
          <span className="text-[#4a3826] font-semibold">Phủ Vân Thủy</span>
        </div>
      </div>

      {/* top-right: phúc, scarves, journal, sound */}
      <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-30 flex items-center gap-1.5 sm:gap-2">
        <LuckChip onClick={() => setShowPhuc(true)} compact />
        <button onClick={() => setModal('journal')} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-[#fbf3e2]/95 border border-[#d9c7a6] shadow-md cursor-pointer hover:border-[#8e1b1b]" aria-label={`Journal: ${story.khan.length} of 4 scarves`}>
          <span className="flex -space-x-2.5">
            {PALACES.map((p) => (
              <KhanArt key={p.id} color={p.color} size={24} dim={!story.khan.includes(p.id)} />
            ))}
          </span>
          <span className="text-xs font-bold tabular-nums text-[#4a3826]">{story.khan.length}/4</span>
          <BookOpen className="w-4 h-4 text-[#8e1b1b] hidden sm:block" />
        </button>
        <button
          onClick={() => {
            const m = !muted;
            setMuted(m);
            soundService.setMuted(m);
          }}
          className="p-2 rounded-xl bg-[#fbf3e2]/95 border border-[#d9c7a6] shadow-md cursor-pointer"
          aria-label={muted ? 'Sound on' : 'Sound off'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-[#8a7762]" /> : <Volume2 className="w-4 h-4 text-[#8e1b1b]" />}
        </button>
      </div>

      {/* first-time nudge */}
      {!story.started && !modal && !inRealm && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-[#2a1410]/80 text-[#fbeed2] text-[13px] shadow-lg backdrop-blur-sm text-center max-w-[92vw]">
          Walk through a side gate and find <b>Bà Thủ Từ</b>, the temple keeper, by the incense burner.
        </div>
      )}

      {!inRealm && (
        <Dock
          spots={spots}
          time={time}
          onTime={changeTime}
          auto={auto}
          onAuto={() => {
            const a = !auto;
            setAuto(a);
            if (scene.current) scene.current.isAutoCycleTime = a;
          }}
          tour={tour}
          onTour={() => {
            const t = !tour;
            setTour(t);
            if (scene.current) scene.current.isCinematicMode = t;
          }}
          onTeleport={(id) => scene.current?.teleportToSpot(id)}
          onRitual={openRitual}
          onBow={() => scene.current?.bow()}
        >
          {near && !modal && PROMPT[near.type] && (
            <button
              onClick={() => openRitual(near.type)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#8e1b1b] to-[#b4301f] text-[#fff4dc] font-semibold text-sm border border-[#e9b84a]/60 shadow-2xl cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform"
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
        <IncenseModal
          onClose={() => setModal(null)}
          onDone={(n) => {
            if (n % 2 === 0) luckService.change(-1, 'Incense is offered in odd numbers: one, three or five');
            else if (!visit.current.incense) luckService.change(2, `Lit ${n} stick${n > 1 ? 's' : ''} of incense with respect`);
            visit.current.incense = true;
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
      {modal === 'fortune' && <XamModal onClose={() => setModal(null)} phuc={luckService.get().value} onDrawn={(n) => storyService.saveXam(n)} />}
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
      {modal === 'journal' && <JournalSheet onClose={() => setModal(null)} onOpenCard={(c) => setCard({ card: c, luck: 0, firstTime: false })} />}

      <LuckToasts />
      <CaptionBar text={caption} />
      {card && <StoryCardSheet card={card.card} luck={card.luck} firstTime={card.firstTime} onClose={() => setCard(null)} />}
      {showPhuc && <LuckSheet onClose={() => setShowPhuc(false)} />}
    </div>
  );
}
