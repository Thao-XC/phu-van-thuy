import type { Festival } from './lunar';

/**
 * A day at Phủ Vân Thủy, on the visitor's own clock.
 * Hầu đồng is held most evenings and mornings, longer on the 1st and 15th of the lunar month,
 * in the spring and autumn festival seasons, and all day on the great festivals.
 */
export interface Session {
  from: number; // hours, local
  to: number;
  label: string;
  vi: string;
  kind: 'haudong' | 'bell' | 'offering' | 'quiet';
}

export function daySchedule(lunarMonth: number, lunarDay: number, festival: Festival | null): Session[] {
  const big = !!festival?.major;
  const busy = big || lunarDay === 1 || lunarDay === 15 || lunarMonth <= 3 || lunarMonth === 8;
  const s: Session[] = [{ from: 5.5, to: 6, label: 'Morning bell and first incense', vi: 'Chuông sớm', kind: 'bell' }];
  if (big) s.push({ from: 8, to: 12, label: 'Hầu đồng (festival)', vi: 'Hầu đồng', kind: 'haudong' });
  else s.push({ from: 9, to: 11, label: 'Morning hầu đồng', vi: 'Hầu đồng sáng', kind: 'haudong' });
  s.push({ from: 12, to: 12.5, label: 'Midday offerings', vi: 'Dâng lễ trưa', kind: 'offering' });
  if (busy) s.push({ from: 14, to: 17, label: big ? 'Hầu đồng (festival)' : 'Afternoon hầu đồng', vi: 'Hầu đồng chiều', kind: 'haudong' });
  s.push({ from: 18, to: 18.5, label: 'Evening bell; lanterns lit', vi: 'Chuông chiều', kind: 'bell' });
  s.push({ from: 19, to: big ? 23 : 21.5, label: big ? 'Hầu đồng late into the night' : 'Evening hầu đồng', vi: 'Hầu đồng tối', kind: 'haudong' });
  s.push({ from: big ? 23 : 22, to: 24, label: 'Doors close; the temple sleeps', vi: 'Đóng cửa', kind: 'quiet' });
  return s;
}

export const hourOf = (d: Date) => d.getHours() + d.getMinutes() / 60;
export const fmtHour = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export function hauDongState(now: Date, sched: Session[]): { on: Session | null; next: Session | null } {
  const h = hourOf(now);
  const hd = sched.filter((x) => x.kind === 'haudong');
  return { on: hd.find((x) => h >= x.from && h < x.to) ?? null, next: hd.find((x) => x.from > h) ?? null };
}
