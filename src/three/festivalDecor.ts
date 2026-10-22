import * as THREE from 'three';
import type { VietKit } from './kit/vietnam';
import type { Decor } from '../services/lunar';
import { koi } from './encounters/figures';

/**
 * Decorations the temple puts up for the lunar calendar's days:
 * Tết peach blossoms, lantern strings, five-colour flags, lights on the river,
 * Mid-Autumn star lanterns, a basin of carp for the Kitchen Gods.
 */
type Ground = (x: number, z: number) => number;
export interface FestivalDecor {
  group: THREE.Group;
  update: (t: number, dt: number) => void;
  /** Kitchen Gods' day: let one carp go */
  releaseCarp?: () => void;
}

const FIVE = [0xd23a2a, 0xe8b830, 0x3f8a3a, 0xf3efe4, 0x2f5a8a];
const PATHS: [number, number][] = [
  // landing → gate, both sides
  ...Array.from({ length: 6 }, (_, i) => [-3.4, 60 - i * 3.4] as [number, number]),
  ...Array.from({ length: 6 }, (_, i) => [3.4, 60 - i * 3.4] as [number, number]),
  // courtyard → hall
  ...Array.from({ length: 6 }, (_, i) => [-5.6, 34 - i * 6] as [number, number]),
  ...Array.from({ length: 6 }, (_, i) => [5.6, 34 - i * 6] as [number, number]),
];

const std = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });

function pole(h: number) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, h, 6), std(0x5b3b22));
  m.position.y = h / 2;
  return m;
}

function starLantern(color: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.16 : 0.38;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false });
  geo.center();
  const m = new THREE.Mesh(geo, std(color, { emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.92 }));
  return m;
}

function peachTree(s = 1) {
  const g = new THREE.Group();
  const bark = std(0x4a3426, { flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.22 * s, 1.6 * s, 7), bark);
  trunk.position.y = 0.8 * s;
  g.add(trunk);
  const pink = std(0xf29bb8, { emissive: 0x5a1a2a, emissiveIntensity: 0.25, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.07 * s, 1.2 * s, 5), bark);
    br.position.set(Math.cos(a) * 0.35 * s, 1.9 * s, Math.sin(a) * 0.35 * s);
    br.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
    g.add(br);
    for (let k = 0; k < 7; k++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13 * s, 0), pink);
      b.position.set(Math.cos(a) * (0.5 + Math.random() * 0.5) * s, (2.0 + Math.random() * 0.8) * s, Math.sin(a) * (0.5 + Math.random() * 0.5) * s);
      g.add(b);
    }
  }
  // a red pot
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * s, 0.3 * s, 0.4 * s, 10), std(0xb8382b));
  pot.position.y = 0.2 * s;
  g.add(pot);
  return g;
}

export function buildFestivalDecor(kind: Decor, vk: VietKit, ground: Ground): FestivalDecor {
  const group = new THREE.Group();
  const anim: ((t: number, dt: number) => void)[] = [];

  if (kind === 'tet' || kind === 'lanterns' || kind === 'flags') {
    // lantern strings on poles along the paths
    PATHS.forEach(([x, z], i) => {
      const y0 = ground(x, z);
      const p = pole(3.4);
      p.position.set(x, y0, z);
      group.add(p);
      const l = vk.lantern(0.26, kind === 'flags' ? FIVE[i % 5] : 0xc81e1e);
      l.position.set(x, y0 + 3.0, z);
      group.add(l);
      anim.push((t) => (l.rotation.z = Math.sin(t * 1.3 + i) * 0.08));
    });
    // a few real lights so the paths glow at night
    [[0, 52], [0, 24], [0, 4]].forEach(([x, z]) => {
      const pl = new THREE.PointLight(0xffa860, 1.6, 16, 2);
      pl.position.set(x, ground(x, z) + 3, z);
      group.add(pl);
    });
  }
  if (kind === 'flags') {
    // five-colour flags (cờ ngũ hành) on tall poles
    for (let i = 0; i < 10; i++) {
      const x = i % 2 ? 9.5 : -9.5, z = 36 - Math.floor(i / 2) * 7;
      const y0 = ground(x, z);
      const p = pole(6);
      p.position.set(x, y0, z);
      group.add(p);
      const geo = new THREE.PlaneGeometry(1.6, 2.4, 8, 1);
      const flag = new THREE.Mesh(geo, std(FIVE[i % 5], { side: THREE.DoubleSide }));
      flag.position.set(x + (x > 0 ? -0.8 : 0.8), y0 + 4.6, z);
      group.add(flag);
      anim.push((t) => {
        const pos = geo.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < pos.count; k++) {
          const u = pos.getX(k) + 0.8;
          pos.setZ(k, Math.sin(t * 3 + u * 3 + i) * 0.15 * u);
        }
        pos.needsUpdate = true;
      });
    }
  }
  if (kind === 'tet') {
    [[-9, 43], [9, 43], [-8, 22], [8, 22], [-3.6, 0.5], [3.6, 0.5]].forEach(([x, z], i) => {
      const t = peachTree(i < 2 ? 1.25 : 1);
      t.position.set(x, ground(x, z), z);
      group.add(t);
    });
    // falling petals near the gate
    const n = 120;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 30, Math.random() * 6, 30 + Math.random() * 20], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xf6b3c8, size: 0.09 }));
    group.add(pts);
    anim.push((t, dt) => {
      for (let i = 0; i < n; i++) {
        let y = pos[i * 3 + 1] - dt * 0.5;
        if (y < 0) y = 6;
        pos[i * 3 + 1] = y;
        pos[i * 3] += Math.sin(t + i) * dt * 0.3;
      }
      geo.attributes.position.needsUpdate = true;
    });
  }
  if (kind === 'riverlights' || kind === 'lanterns') {
    // lotus lanterns drifting on the river
    const lots: THREE.Group[] = [];
    for (let i = 0; i < (kind === 'riverlights' ? 30 : 12); i++) {
      const g = new THREE.Group();
      const petals = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.2, 8, 1, true), std(i % 3 ? 0xf3a5bf : 0xf6efe6, { side: THREE.DoubleSide, emissive: 0x8a3a3a, emissiveIntensity: 0.3 }));
      petals.rotation.x = Math.PI;
      g.add(petals);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
      flame.position.y = 0.16;
      g.add(flame);
      g.position.set(-60 + Math.random() * 120, -0.3, 68 + Math.random() * 16);
      g.userData.speed = 0.4 + Math.random() * 0.5;
      lots.push(g);
      group.add(g);
    }
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0xffb070, 1.4, 12, 2);
      pl.position.set(-30 + i * 20, 0.6, 72);
      group.add(pl);
    }
    anim.push((t, dt) =>
      lots.forEach((g, i) => {
        g.position.x += g.userData.speed * dt;
        if (g.position.x > 60) g.position.x = -60;
        g.position.y = -0.3 + Math.sin(t * 1.4 + i) * 0.03;
      }),
    );
  }
  if (kind === 'stars') {
    // đèn ông sao along the paths and over the courtyard
    PATHS.forEach(([x, z], i) => {
      const y0 = ground(x, z);
      const p = pole(3.4);
      p.position.set(x, y0, z);
      group.add(p);
      const s = starLantern(i % 3 === 0 ? 0xe8b830 : 0xd23a2a);
      s.position.set(x, y0 + 3.1, z);
      group.add(s);
      anim.push((t) => (s.rotation.y = Math.sin(t * 0.8 + i) * 0.6));
    });
    [[0, 52], [0, 24], [0, 4]].forEach(([x, z]) => {
      const pl = new THREE.PointLight(0xffb070, 1.6, 16, 2);
      pl.position.set(x, ground(x, z) + 3, z);
      group.add(pl);
    });
  }

  let releaseCarp: (() => void) | undefined;
  if (kind === 'carp') {
    // a basin of carp by the landing, waiting to carry the Kitchen Gods
    const bx = 4.5, bz = 61;
    const y0 = ground(bx, bz);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 0.5, 18, 1, true), std(0x8a6a4a, { side: THREE.DoubleSide }));
    basin.position.set(bx, y0 + 0.25, bz);
    group.add(basin);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.95, 18), std(0x2f6f6a, { roughness: 0.1 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(bx, y0 + 0.42, bz);
    group.add(water);
    const fish = [0, 1, 2].map((i) => {
      const f = koi(0.45, [0xf2a23a, 0xd8461f]);
      f.position.set(bx, y0 + 0.4, bz);
      group.add(f);
      return { f, a: i * 2.1, free: false, t: 0 };
    });
    anim.push((t, dt) =>
      fish.forEach((c, i) => {
        if (c.free) {
          c.t += dt;
          const k = Math.min(1, c.t / 1.4);
          c.f.position.set(bx + (0 - bx) * k, y0 + 0.4 + Math.sin(k * Math.PI) * 2.2 - k * 1, bz + (72 - bz) * k);
          c.f.rotation.z = -k * 2.5;
          if (k >= 1) c.f.visible = false;
          return;
        }
        c.a += dt * (0.8 + i * 0.2);
        c.f.position.x = bx + Math.cos(c.a) * 0.55;
        c.f.position.z = bz + Math.sin(c.a) * 0.55;
        c.f.rotation.y = -c.a;
        c.f.userData.animate?.(t);
      }),
    );
    releaseCarp = () => {
      const c = fish.find((x) => !x.free);
      if (c) c.free = true;
    };
  }

  return {
    group,
    update: (t, dt) => anim.forEach((a) => a(t, dt)),
    releaseCarp,
  };
}

/** a star lantern held in the hand, for Mid-Autumn night */
export function heldStar() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 5), std(0x8a6a4a));
  stick.position.set(0, -0.15, 0);
  stick.rotation.z = 0.3;
  const s = starLantern(0xd23a2a);
  s.scale.setScalar(0.45);
  s.position.set(0.08, 0.1, 0);
  const pl = new THREE.PointLight(0xff7a50, 0.8, 5, 2);
  pl.position.copy(s.position);
  g.add(stick, s, pl);
  g.position.set(0.32, -0.28, -0.7);
  return g;
}
