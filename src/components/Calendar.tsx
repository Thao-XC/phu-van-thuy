import React, { useEffect, useMemo, useState } from 'react';
import { Sheet } from './ui/Sheet';
import { fmtHour, hourOf, type Session } from '../services/templeDay';
import { toLunar, yearName, yearAnimal, festivalOn, nextFestival, today, FESTIVALS, type Festival, type LunarDate } from '../services/lunar';

/**
 * The temple keeps the real calendar: today's lunar date, today's festival (if any),
 * and what's coming. Each festival's activity can be done once per lunar year.
 */
const KEY = 'pvt_festivals';
const doneSet = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};
export const festivalKey = (f: Festival, l: LunarDate) => `${f.id}-${l.year}-${f.month || l.month}`;
export const isFestivalDone = (k: string) => !!doneSet()[k];
export const markFestivalDone = (k: string) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...doneSet(), [k]: true }));
  } catch {
    /* ignore */
  }
};

export function useCalendar() {
  const [now, setNow] = useState(today);
  useEffect(() => {
    const t = window.setInterval(() => setNow(today()), 60_000);
    return () => clearInterval(t);
  }, []);
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  return useMemo(() => {
    const lunar = toLunar(now);
    return { now, lunar, festival: festivalOn(lunar), next: nextFestival(now) };
    // recompute the lunar parts once a day; `now` itself updates every minute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, now.getHours(), now.getMinutes()]);
}

const MONTHS = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Một', 'Chạp'];
export const lunarLabel = (l: LunarDate) => `${l.day} tháng ${MONTHS[l.month - 1]}${l.leap ? ' (nhuận)' : ''}`;

export const CalendarChip: React.FC<{ onClick: () => void; now: Date; lunar: LunarDate; festival: Festival | null }> = ({ onClick, now, lunar, festival }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-end leading-tight px-2.5 sm:px-3 py-1 rounded-md cursor-pointer ${festival?.major ? 'dh-seal' : 'dh-paper'}`}
    title={festival ? `${festival.vi} · ${festival.en}` : 'The temple calendar'}
    aria-label={`Today: ${now.toDateString()}, lunar ${lunarLabel(lunar)}${festival ? `, ${festival.en}` : ''}`}
  >
    <span className="text-[10px] sm:text-[11px] opacity-80 tabular-nums">{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    <span className="text-[11px] sm:text-xs font-display font-bold whitespace-nowrap">
      <span className="sm:hidden">{lunar.day}/{lunar.month} ÂL</span>
      <span className="hidden sm:inline">{lunarLabel(lunar)} ÂL</span>
      {festival && <span className="hidden lg:inline font-semibold"> · {festival.vi}</span>}
    </span>
  </button>
);

/** upcoming major festivals over the next year */
function upcoming(from: Date, n = 6) {
  const out: { f: Festival; days: number; date: Date }[] = [];
  let d = new Date(from);
  let offset = 0;
  while (out.length < n) {
    const x = nextFestival(d);
    if (!x) break;
    offset += x.days;
    out.push({ ...x, days: offset });
    d = x.date;
  }
  return out;
}

export const FestivalSheet: React.FC<{
  onClose: () => void;
  now: Date;
  lunar: LunarDate;
  festival: Festival | null;
  onActivity: (f: Festival) => void;
  schedule?: Session[];
}> = ({ onClose, now, lunar, festival, onActivity, schedule = [] }) => {
  const h = hourOf(now);
  const list = useMemo(() => upcoming(now), [now]);
  const done = festival ? isFestivalDone(festivalKey(festival, lunar)) : false;
  return (
    <Sheet onClose={onClose} size="md" label="The temple calendar" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <div className="text-center pr-6 sm:pr-0">
        <span className="text-xs uppercase tracking-[0.18em] text-[#8e1b1b] font-semibold">Âm lịch · lunar calendar</span>
        <h2 className="text-2xl dh-title text-[#211a15] mt-1">Ngày {lunarLabel(lunar)}</h2>
        <p className="text-sm text-[#5a4837] mt-0.5">
          Năm {yearName(lunar.year)} · Year of the {yearAnimal(lunar.year)} ·{' '}
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {festival ? (
        <section className={`mt-5 p-4 rounded-md ${festival.major ? 'border-2 border-[#b8382b] bg-[#fbe9df]' : 'border border-[#d9c7a6] bg-[#fffaf0]'}`}>
          <div className="text-[11px] uppercase tracking-[0.16em] font-bold text-[#b8382b]">Today at the temple</div>
          <h3 className="dh-title text-xl text-[#211a15] mt-0.5">{festival.vi}</h3>
          <div className="text-sm italic text-[#5a4837]">{festival.en}</div>
          <p className="mt-2 text-[14px] leading-relaxed text-[#2c241c]">{festival.about}</p>
          <button
            onClick={() => onActivity(festival)}
            className={`mt-3 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer ${done ? 'border-2 border-[#211a15] text-[#211a15]' : 'dh-seal'}`}
          >
            {done ? `✓ ${festival.activity.label} (again)` : festival.activity.label}
          </button>
        </section>
      ) : (
        <p className="mt-5 text-[14px] text-[#5a4837] text-center">An ordinary day. The temple is quiet, which is its own kind of gift.</p>
      )}

      {schedule.length > 0 && (
        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[#211a15] mb-2">Today at the temple</h3>
          <ol className="relative border-l-2 border-[#211a15] ml-2 space-y-1.5">
            {schedule.map((x) => {
              const nowOn = h >= x.from && h < x.to;
              const past = h >= x.to;
              return (
                <li key={x.from} className={`pl-4 relative ${past ? 'opacity-45' : ''}`}>
                  <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rotate-45 border-2 border-[#211a15] ${nowOn ? 'bg-[#b8382b]' : 'bg-[#f3ead6]'}`} />
                  <span className="text-xs tabular-nums font-semibold text-[#8e1b1b] mr-2">
                    {fmtHour(x.from)}–{fmtHour(x.to)}
                  </span>
                  <span className="text-[14px] text-[#211a15]">{x.label}</span>
                  {nowOn && <span className="ml-2 text-[11px] font-bold text-[#b8382b] uppercase tracking-wide">now</span>}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mt-5 pb-1">
        <h3 className="text-sm font-semibold text-[#211a15] mb-2">Coming up</h3>
        <ul className="divide-y divide-[#e6d8bf]">
          {list.map(({ f, days, date }) => (
            <li key={f.id + days} className="py-2 flex items-baseline gap-3">
              <span className="w-20 shrink-0 text-xs tabular-nums text-[#8e1b1b] font-semibold">{days === 1 ? 'tomorrow' : `in ${days} days`}</span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[#211a15]">{f.vi}</span>
                <span className="block text-xs text-[#5a4837]">
                  {f.en} · {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {f.from}/{f.month} âm lịch
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-[#8a7762]">
          The temple follows your clock: day, dusk and night are real, and the decorations change with the lunar calendar. {FESTIVALS.length} festivals a year, plus every new moon and full moon.
        </p>
      </section>
    </Sheet>
  );
};
