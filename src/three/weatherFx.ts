import * as THREE from 'three';
import type { Season, Sky } from '../services/weather';

/**
 * Rain, drizzle, storm and fog over the temple, and the season in its trees.
 * The rain is a box of falling streaks that follows the visitor; under the hall roof it stops.
 */
const RAIN: Record<Sky, { n: number; len: number; speed: number; opacity: number }> = {
  clear: { n: 0, len: 0, speed: 0, opacity: 0 },
  cloudy: { n: 0, len: 0, speed: 0, opacity: 0 },
  fog: { n: 0, len: 0, speed: 0, opacity: 0 },
  drizzle: { n: 900, len: 0.18, speed: 4, opacity: 0.35 },
  rain: { n: 2200, len: 0.55, speed: 13, opacity: 0.45 },
  storm: { n: 3400, len: 0.8, speed: 18, opacity: 0.55 },
};
/** how much each sky dims the sun, thickens the fog, and greys the colours */
export const SKY_LOOK: Record<Sky, { sun: number; fog: number; grey: number }> = {
  clear: { sun: 1, fog: 1, grey: 0 },
  cloudy: { sun: 0.6, fog: 1.25, grey: 0.35 },
  fog: { sun: 0.45, fog: 3.2, grey: 0.55 },
  drizzle: { sun: 0.5, fog: 1.8, grey: 0.5 },
  rain: { sun: 0.38, fog: 1.9, grey: 0.6 },
  storm: { sun: 0.25, fog: 2.1, grey: 0.72 },
};
/** each season's light and leaves: a colour the greens lean toward, and how far */
const SEASON_LOOK: Record<Season, { leaf: number; k: number; sat: number; light: number }> = {
  xuan: { leaf: 0x9ad06a, k: 0.18, sat: 1.05, light: 0xfff4ec },
  ha: { leaf: 0x2f7a35, k: 0.12, sat: 1.1, light: 0xfff6e0 },
  thu: { leaf: 0xc9a03a, k: 0.32, sat: 1, light: 0xffe8c4 },
  dong: { leaf: 0x6e7a62, k: 0.3, sat: 0.7, light: 0xe8eef4 },
};

export class WeatherFx {
  sky: Sky = 'clear';
  season: Season = 'thu';
  wind = 6;
  private rain: THREE.LineSegments | null = null;
  private pos: Float32Array | null = null;
  private vel: Float32Array | null = null;
  private flashT = 8;
  private greens: { m: THREE.MeshStandardMaterial; c: THREE.Color }[] | null = null;
  /** a lightning flash, 0..1, fading */
  flash = 0;

  constructor(private scene: THREE.Scene) {}

  set(sky: Sky, wind: number, season: Season) {
    this.sky = sky;
    this.wind = wind;
    this.season = season;
    this.buildRain();
    this.tintFoliage();
  }

  private buildRain() {
    if (this.rain) {
      this.scene.remove(this.rain);
      this.rain.geometry.dispose();
      this.rain = null;
    }
    const cfg = RAIN[this.sky];
    if (!cfg.n) return;
    this.pos = new Float32Array(cfg.n * 6);
    this.vel = new Float32Array(cfg.n);
    for (let i = 0; i < cfg.n; i++) {
      const x = (Math.random() - 0.5) * 34, y = Math.random() * 16, z = (Math.random() - 0.5) * 34;
      this.pos.set([x, y, z, x, y + cfg.len, z], i * 6);
      this.vel[i] = cfg.speed * (0.8 + Math.random() * 0.4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xc8d6e0, transparent: true, opacity: cfg.opacity, depthWrite: false }));
    this.rain.frustumCulled = false;
    this.scene.add(this.rain);
  }

  /** lean every green in the world a little toward the season's colour */
  private tintFoliage() {
    if (!this.greens) {
      this.greens = [];
      const seen = new Set<THREE.Material>();
      const hsl = { h: 0, s: 0, l: 0 };
      this.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!m || Array.isArray(m) || seen.has(m) || !(m as THREE.MeshStandardMaterial).isMeshStandardMaterial || m.map) return;
        seen.add(m);
        m.color.getHSL(hsl);
        if (hsl.h > 0.19 && hsl.h < 0.45 && hsl.s > 0.18 && hsl.l > 0.08) this.greens!.push({ m, c: m.color.clone() });
      });
    }
    const L = SEASON_LOOK[this.season];
    const target = new THREE.Color(L.leaf);
    const hsl = { h: 0, s: 0, l: 0 };
    this.greens.forEach(({ m, c }) => {
      m.color.copy(c).lerp(target, L.k);
      m.color.getHSL(hsl);
      m.color.setHSL(hsl.h, Math.min(1, hsl.s * L.sat), hsl.l);
    });
  }
  get light() {
    return SEASON_LOOK[this.season].light;
  }

  /** returns true at the moment lightning strikes */
  update(dt: number, at: THREE.Vector3, sheltered: boolean): boolean {
    let struck = false;
    if (this.rain && this.pos && this.vel) {
      this.rain.visible = !sheltered;
      this.rain.position.set(at.x, at.y - 6, at.z);
      const cfg = RAIN[this.sky];
      const slant = Math.min(0.5, this.wind / 60);
      for (let i = 0; i < this.vel.length; i++) {
        const o = i * 6;
        const dy = this.vel[i] * dt;
        let y = this.pos[o + 1] - dy;
        let x = this.pos[o] + dy * slant;
        if (y < 0) {
          y = 16;
          x = (Math.random() - 0.5) * 34;
          this.pos[o + 2] = this.pos[o + 5] = (Math.random() - 0.5) * 34;
        }
        this.pos[o] = x;
        this.pos[o + 1] = y;
        this.pos[o + 3] = x - cfg.len * slant;
        this.pos[o + 4] = y + cfg.len;
      }
      (this.rain.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
    // a storm throws lightning every so often
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.sky === 'storm') {
      this.flashT -= dt;
      if (this.flashT <= 0) {
        this.flashT = 7 + Math.random() * 12;
        this.flash = 1;
        struck = true;
      }
    }
    return struck;
  }
}
