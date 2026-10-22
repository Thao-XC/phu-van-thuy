/**
 * Vietnamese lunar calendar (âm lịch), computed for UTC+7 with Hồ Ngọc Đức's astronomical method,
 * plus the festivals the temple keeps.
 */
const INT = Math.floor;
const TZ = 7;

function jdFromDate(dd: number, mm: number, yy: number) {
  const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}
function newMoon(k: number) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}
function sunLongitude(jdn: number) {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * INT(L / (Math.PI * 2));
  return L;
}
const sunLong = (day: number) => INT((sunLongitude(day - 0.5 - TZ / 24) / Math.PI) * 6);
const newMoonDay = (k: number) => INT(newMoon(k) + 0.5 + TZ / 24);
function month11(yy: number) {
  const k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
  const nm = newMoonDay(k);
  return sunLong(nm) >= 9 ? newMoonDay(k - 1) : nm;
}
function leapOffset(a11: number) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1;
  let arc = sunLong(newMoonDay(k + i));
  do {
    last = arc;
    i++;
    arc = sunLong(newMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

export function toLunar(d: Date): LunarDate {
  const dd = d.getDate(), mm = d.getMonth() + 1, yy = d.getFullYear();
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = newMoonDay(k);
  let a11 = month11(yy), b11 = a11, year: number;
  if (a11 >= monthStart) {
    year = yy;
    a11 = month11(yy - 1);
  } else {
    year = yy + 1;
    b11 = month11(yy + 1);
  }
  const day = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let leap = false, month = diff + 11;
  if (b11 - a11 > 365) {
    const lo = leapOffset(a11);
    if (diff >= lo) {
      month = diff + 10;
      if (diff === lo) leap = true;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) year -= 1;
  return { day, month, year, leap };
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const ANIMAL = ['Rat', 'Buffalo', 'Tiger', 'Cat', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
export const yearName = (y: number) => `${CAN[(y + 6) % 10]} ${CHI[(y + 8) % 12]}`;
export const yearAnimal = (y: number) => ANIMAL[(y + 8) % 12];

/* ------------------------------------------------------------------ */
/* festivals                                                            */
/* ------------------------------------------------------------------ */
export type Decor = 'tet' | 'lanterns' | 'flags' | 'riverlights' | 'stars' | 'carp' | 'quiet';
export interface Festival {
  id: string;
  vi: string;
  en: string;
  /** lunar month and first/last day */
  month: number;
  from: number;
  to: number;
  decor: Decor;
  /** what happens at the temple today */
  about: string;
  /** the one thing to do today (once per festival, for phúc) */
  activity: { label: string; ritual: 'stall' | 'lantern' | 'incense' | 'altar' | 'film' | 'keeper' | 'carp' | 'star'; done: string };
  /** a big day (vs. the everyday 1st and 15th) */
  major: boolean;
}

export const FESTIVALS: Festival[] = [
  {
    id: 'tet',
    vi: 'Tết Nguyên Đán',
    en: 'Lunar New Year',
    month: 1,
    from: 1,
    to: 3,
    decor: 'tet',
    major: true,
    about: 'The first days of the year. Peach blossoms at the gate, red couplets, and families coming to the Mothers for the first prayer of spring. Everyone leaves with a sprig of lộc: new buds for a new year.',
    activity: { label: 'Hái lộc đầu năm · pick a spring bud', ritual: 'stall', done: 'You picked a budding sprig of lộc for the new year.' },
  },
  {
    id: 'xuan',
    vi: 'Đi lễ đầu xuân',
    en: 'The spring pilgrimage',
    month: 1,
    from: 4,
    to: 14,
    decor: 'tet',
    major: false,
    about: 'All through the first month people visit temples to pray for the year ahead. The blossoms are still out and the courtyard is busy.',
    activity: { label: 'Offer incense for the year', ritual: 'incense', done: 'Your incense joins the spring smoke.' },
  },
  {
    id: 'thuong-nguyen',
    vi: 'Rằm tháng Giêng',
    en: 'First full moon of the year',
    month: 1,
    from: 15,
    to: 15,
    decor: 'lanterns',
    major: true,
    about: '"Lễ quanh năm không bằng rằm tháng Giêng": a whole year of prayers is not worth this one full moon. Lanterns everywhere, and the river full of light.',
    activity: { label: 'Float a lantern under the full moon', ritual: 'lantern', done: 'Your lantern drifts out under the first full moon.' },
  },
  {
    id: 'gio-mau',
    vi: 'Giỗ Mẫu · Lễ hội Phủ Dầy',
    en: "The Mother's anniversary",
    month: 3,
    from: 1,
    to: 10,
    decor: 'flags',
    major: true,
    about: '"Tháng Ba giỗ Mẹ." The third month belongs to Mẫu Liễu Hạnh, remembered on the 3rd day at Phủ Dầy and every Mother Goddess temple. Five-colour flags, chầu văn all day, and the legend told again.',
    activity: { label: "Watch the Mother's legend", ritual: 'film', done: 'You remembered the Mother on her day.' },
  },
  {
    id: 'doan-ngo',
    vi: 'Tết Đoan Ngọ',
    en: 'Double Fifth festival',
    month: 5,
    from: 5,
    to: 5,
    decor: 'quiet',
    major: false,
    about: 'Midsummer, "killing the inner worms" with sticky rice wine and sour fruit at noon. The keeper hangs fresh herbs over the doors.',
    activity: { label: 'Pray for good health', ritual: 'altar', done: 'A summer prayer for health.' },
  },
  {
    id: 'vu-lan',
    vi: 'Rằm tháng Bảy · Vu Lan',
    en: 'Ancestors’ day',
    month: 7,
    from: 14,
    to: 15,
    decor: 'riverlights',
    major: true,
    about: 'The full moon of the seventh month, for parents and ancestors and for the wandering souls with no one to remember them. Lanterns are set on the water to light their way.',
    activity: { label: 'Float a lantern for your ancestors', ritual: 'lantern', done: 'Your lantern carries a thought to those before you.' },
  },
  {
    id: 'trung-thu',
    vi: 'Tết Trung Thu',
    en: 'Mid-Autumn festival',
    month: 8,
    from: 14,
    to: 15,
    decor: 'stars',
    major: true,
    about: 'The brightest moon of the year, for children: star lanterns (đèn ông sao), mooncakes, and stories of Chú Cuội on the moon under his banyan.',
    activity: { label: 'Take a star lantern', ritual: 'star', done: 'You carry a little red star lantern tonight.' },
  },
  {
    id: 'gio-cha',
    vi: 'Giỗ Đức Thánh Trần',
    en: "The Father's anniversary",
    month: 8,
    from: 20,
    to: 20,
    decor: 'flags',
    major: false,
    about: '"Tháng Tám giỗ Cha." Trần Hưng Đạo, the general who drove back three Mongol invasions, is honoured as the Father, beside the Mother.',
    activity: { label: 'Offer incense to the Father', ritual: 'incense', done: 'You honoured the Father on his day.' },
  },
  {
    id: 'tao-quan',
    vi: 'Ông Công Ông Táo',
    en: 'Kitchen Gods’ day',
    month: 12,
    from: 23,
    to: 23,
    decor: 'carp',
    major: true,
    about: 'The Kitchen Gods ride carp up to heaven to report on the year. People release live carp into rivers and lakes to carry them.',
    activity: { label: 'Release a carp into the river', ritual: 'carp', done: 'Your carp flicks its tail and is gone, carrying the Kitchen Gods home.' },
  },
];

const RAM: Festival = {
  id: 'ram',
  vi: 'Ngày Rằm',
  en: 'Full moon day',
  month: 0,
  from: 15,
  to: 15,
  decor: 'lanterns',
  major: false,
  about: 'Every full moon the temple is busier: incense, fruit and flowers on the altars, lanterns lit early.',
  activity: { label: 'Offer incense on the full moon', ritual: 'incense', done: 'A full-moon prayer.' },
};
const MUNG1: Festival = {
  id: 'mung-mot',
  vi: 'Mùng Một',
  en: 'New moon day',
  month: 0,
  from: 1,
  to: 1,
  decor: 'quiet',
  major: false,
  about: 'The first day of every lunar month: a good day to begin things, and to visit the Mothers.',
  activity: { label: 'Pray at the altar for the month ahead', ritual: 'altar', done: 'A new-month prayer.' },
};

export function festivalOn(l: LunarDate): Festival | null {
  if (!l.leap) {
    const f = FESTIVALS.find((x) => x.month === l.month && l.day >= x.from && l.day <= x.to);
    if (f) return f;
  }
  if (l.day === 15) return RAM;
  if (l.day === 1) return MUNG1;
  return null;
}

/** the next major festival after today, and how many days away */
export function nextFestival(from: Date): { f: Festival; days: number; date: Date } | null {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 1; i < 400; i++) {
    d.setDate(d.getDate() + 1);
    const l = toLunar(d);
    const f = festivalOn(l);
    if (f && f.major && l.day === f.from) return { f, days: i, date: new Date(d) };
  }
  return null;
}

/** today, or a date given as ?date=YYYY-MM-DD (to preview festivals) */
export function today(): Date {
  try {
    const q = new URLSearchParams(location.search).get('date');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
      const [y, m, d] = q.split('-').map(Number);
      const now = new Date();
      return new Date(y, m - 1, d, now.getHours(), now.getMinutes());
    }
  } catch {
    /* ignore */
  }
  return new Date();
}

/** the real hour decides the temple's light */
export function liveTimeOfDay(d: Date): 'day' | 'twilight' | 'night' {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6.5 && h < 17) return 'day';
  if ((h >= 17 && h < 19) || (h >= 5 && h < 6.5)) return 'twilight';
  return 'night';
}
