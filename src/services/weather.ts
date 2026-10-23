import { useEffect, useState } from 'react';
import { today } from './lunar';

/**
 * The temple's weather and season, taken from the real sky over the Red River delta.
 *
 * Phủ Vân Thủy is fictional, but it sits where the Mother Goddess temples are: we read the
 * current weather at Phủ Dầy (Vụ Bản, Nam Định), the home of Mẫu Liễu Hạnh, from Open-Meteo
 * (free, no key, called from the player's browser). If the sky can't be reached, the season's
 * usual weather stands in.
 *
 * The north has four seasons:
 *   Xuân (Feb–Apr): drizzle and mist, peach blossom
 *   Hạ   (May–Jul): heat, sudden storms, lotus and flame trees
 *   Thu  (Aug–Oct): cool, clear and golden, leaves falling, milk-flower scent
 *   Đông (Nov–Jan): cold, grey, damp fog off the river
 */
export type Season = 'xuan' | 'ha' | 'thu' | 'dong';
export const SEASONS: Record<Season, { vi: string; en: string }> = {
  xuan: { vi: 'Mùa xuân', en: 'Spring' },
  ha: { vi: 'Mùa hạ', en: 'Summer' },
  thu: { vi: 'Mùa thu', en: 'Autumn' },
  dong: { vi: 'Mùa đông', en: 'Winter' },
};
export function seasonOf(d: Date): Season {
  const m = d.getMonth() + 1;
  if (m >= 2 && m <= 4) return 'xuan';
  if (m >= 5 && m <= 7) return 'ha';
  if (m >= 8 && m <= 10) return 'thu';
  return 'dong';
}

export type Sky = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm';
export const SKIES: Record<Sky, { vi: string; en: string }> = {
  clear: { vi: 'Trời quang', en: 'Clear' },
  cloudy: { vi: 'Nhiều mây', en: 'Cloudy' },
  fog: { vi: 'Sương mù', en: 'Fog' },
  drizzle: { vi: 'Mưa phùn', en: 'Drizzle' },
  rain: { vi: 'Mưa', en: 'Rain' },
  storm: { vi: 'Giông', en: 'Thunderstorm' },
};
export interface Weather {
  sky: Sky;
  tempC: number | null;
  /** km/h */
  wind: number;
  /** true when it came from the real sky, false when it's the season's usual */
  live: boolean;
  season: Season;
}
export const TEMPLE_PLACE = { lat: 20.36, lon: 106.09, name: 'Phủ Dầy, Nam Định' };

const skyOf = (code: number): Sky => {
  if (code >= 95) return 'storm';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 2) return 'cloudy';
  return 'clear';
};
const usual = (s: Season): Sky => ({ xuan: 'drizzle', ha: 'clear', thu: 'clear', dong: 'cloudy' } as const)[s];
const usualTemp = (s: Season) => ({ xuan: 20, ha: 31, thu: 26, dong: 17 })[s];

const KEY = 'pvt_weather';
const FRESH = 20 * 60 * 1000;

/** ?weather=rain (or clear, cloudy, fog, drizzle, storm) previews a sky; ?season=dong a season */
function overrides(): { sky?: Sky; season?: Season } {
  if (typeof location === 'undefined') return {};
  const q = new URLSearchParams(location.search);
  const sky = q.get('weather') as Sky | null;
  const season = q.get('season') as Season | null;
  return { sky: sky && sky in SKIES ? sky : undefined, season: season && season in SEASONS ? season : undefined };
}

export async function fetchWeather(): Promise<Weather> {
  const season = overrides().season ?? seasonOf(today());
  const o = overrides();
  if (o.sky) return { sky: o.sky, tempC: usualTemp(season), wind: o.sky === 'storm' ? 30 : 8, live: false, season };
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null') as (Weather & { at: number }) | null;
    if (c && Date.now() - c.at < FRESH) return { ...c, season };
  } catch {
    /* ignore */
  }
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${TEMPLE_PLACE.lat}&longitude=${TEMPLE_PLACE.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FBangkok`;
    const r = await fetch(u);
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number } };
    const cur = j.current ?? {};
    const w: Weather = { sky: skyOf(cur.weather_code ?? 0), tempC: cur.temperature_2m ?? null, wind: cur.wind_speed_10m ?? 0, live: true, season };
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...w, at: Date.now() }));
    } catch {
      /* ignore */
    }
    return w;
  } catch {
    return { sky: usual(season), tempC: usualTemp(season), wind: 6, live: false, season };
  }
}

/** the weather now, refreshed every 20 minutes */
export function useWeather() {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    let alive = true;
    const go = () => fetchWeather().then((x) => alive && setW(x));
    go();
    const t = window.setInterval(go, FRESH);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return w;
}

/** a line for the keeper's caption when you arrive */
export function weatherLine(w: Weather): string {
  const s = w.season, k = w.sky;
  if (k === 'storm') return 'A storm rolls over the delta. Thunder walks across the roof tiles.';
  if (k === 'rain') return s === 'ha' ? 'Summer rain, warm and heavy. The lotus leaves hold it like cups.' : 'Rain on the tiles and the river. The temple smells of wet stone and incense.';
  if (k === 'drizzle') return s === 'xuan' ? 'Mưa xuân: a fine spring drizzle, more mist than rain.' : 'A thin drizzle hangs over the courtyard.';
  if (k === 'fog') return 'Fog off the river. The far gate is a shadow.';
  if (s === 'thu') return k === 'clear' ? 'Autumn in the north: cool, clear air, and leaves turning gold.' : 'An autumn sky, soft and grey. Leaves drift down in the courtyard.';
  if (s === 'dong') return 'Winter in the north: a cold, damp grey. The braziers are lit early.';
  if (s === 'xuan') return 'Spring: peach blossom in the courtyard, and the air still cool.';
  return 'High summer: the heat shimmers, the cicadas never stop.';
}
