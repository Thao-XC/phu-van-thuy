import * as THREE from 'three';
import type { Architecture } from './architecture';
import type { KitMaterials } from './materials';
import { viTexture } from './materials';
import { sacredMother } from './mother';

/**
 * Vietnamese temple kit: upturned "đầu đao" roof corners, ridges with "lưỡng long chầu nguyệt"
 * (two dragons facing the moon), tam quan gates, ochre-walled halls with red lacquer and gold,
 * bronze incense burners, Mother Goddess altars, banyan trees, lotus ponds and karst mountains.
 */

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);

function noiseTex(base: string, spots: string[], size = 256, n = 1600) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    g.fillStyle = spots[i % spots.length];
    g.globalAlpha = 0.2 + Math.random() * 0.35;
    g.beginPath();
    g.arc(Math.random() * size, Math.random() * size, Math.random() * 2.4 + 0.4, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Bát Tràng-style red brick paving */
function brickTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7a3a28';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const l = 34 + Math.random() * 10;
      g.fillStyle = `hsl(${10 + Math.random() * 8}, 38%, ${l}%)`;
      g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29);
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** "Ngói mũi hài" fish-scale roof tiles */
function tileTex(base: string, line: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = line;
  g.lineWidth = 2;
  for (let y = 0; y < 8; y++)
    for (let x = -1; x < 9; x++) {
      g.beginPath();
      g.arc(x * 16 + (y % 2) * 8, y * 16 + 16, 8, Math.PI, 0);
      g.stroke();
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface VietMats {
  ochre: THREE.MeshStandardMaterial;
  lacquer: THREE.MeshStandardMaterial;
  darkLacquer: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  tile: THREE.MeshStandardMaterial;
  tileMoss: THREE.MeshStandardMaterial;
  brick: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  ceramic: THREE.MeshStandardMaterial;
  plasterWhite: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  candle: THREE.MeshBasicMaterial;
  karst: THREE.MeshStandardMaterial;
}

export function createVietMats(): VietMats {
  const brick = brickTex();
  brick.repeat.set(12, 12);
  return {
    ochre: std({ map: noiseTex('#d9a441', ['#c78f2f', '#e8b85a', '#b98432'], 256, 1200), color: 0xffffff, roughness: 0.9 }),
    lacquer: std({ color: 0x8e1b1b, roughness: 0.35, metalness: 0.05 }),
    darkLacquer: std({ color: 0x4a1410, roughness: 0.4 }),
    gold: std({ color: 0xd4a017, roughness: 0.35, metalness: 0.55, envMapIntensity: 0.6, emissive: 0x2a1600 }),
    tile: std({ map: tileTex('#7a3b2a', '#4e2318'), color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }),
    tileMoss: std({ map: tileTex('#5d4a36', '#36291d'), color: 0xbfc9a8, roughness: 0.9, side: THREE.DoubleSide }),
    brick: std({ map: brick, color: 0xffffff, roughness: 0.92 }),
    stone: std({ map: noiseTex('#8d918a', ['#777b74', '#a3a69e', '#6c6f69'], 256, 1500), color: 0xffffff, roughness: 0.95 }),
    bronze: std({ color: 0x5a4a32, roughness: 0.45, metalness: 0.7, envMapIntensity: 0.5 }),
    ceramic: std({ color: 0x3f7d6e, roughness: 0.35, metalness: 0.1 }),
    plasterWhite: std({ map: noiseTex('#e9e3d4', ['#d8d0bd', '#f4efe2'], 128, 500), color: 0xffffff, roughness: 0.9 }),
    wood: std({ color: 0x5a3a22, roughness: 0.8 }),
    candle: new THREE.MeshBasicMaterial({ color: 0xffc35a }),
    karst: std({ color: 0x6f7d6a, roughness: 1, flatShading: true }),
  };
}

const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 12) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
};
const tube = (pts: [number, number, number][], r: number, m: THREE.Material, taper = true) => {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geo = new THREE.TubeGeometry(curve, 24, r, 6, false);
  if (taper) {
    // thin towards the tip
    const p = geo.attributes.position;
    const segs = 25, ring = 7;
    for (let i = 0; i < segs; i++) {
      const k = 1 - (i / (segs - 1)) * 0.75;
      const c = curve.getPointAt(i / (segs - 1));
      for (let j = 0; j < ring; j++) {
        const idx = i * ring + j;
        p.setXYZ(idx, c.x + (p.getX(idx) - c.x) * k, c.y + (p.getY(idx) - c.y) * k, c.z + (p.getZ(idx) - c.z) * k);
      }
    }
    geo.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geo, m);
  mesh.castShadow = true;
  return mesh;
};

/** a texture with Vietnamese lettering, gold on red (or any colours) */
const hanTex = (text: string, vertical = true, bg = '#7d1414', fg = '#f2c14e') =>
  viTexture(text, bg, fg, vertical ? 128 : 640, vertical ? 768 : 168, vertical);

export class VietKit {
  readonly v: VietMats;
  constructor(public arch: Architecture, public m: KitMaterials) {
    this.v = createVietMats();
  }

  /* ------------------------------------------------------------------ */
  /* Roofs                                                               */
  /* ------------------------------------------------------------------ */
  /** A curled corner tip (đầu đao), pointing out along +x+z from the corner */
  dauDao(size = 1.4, m: THREE.Material = this.v.plasterWhite): THREE.Group {
    const g = new THREE.Group();
    const s = size;
    g.add(tube([[0, 0, 0], [0.45 * s, 0.18 * s, 0.45 * s], [0.8 * s, 0.6 * s, 0.8 * s], [0.78 * s, 1.15 * s, 0.78 * s], [0.5 * s, 1.35 * s, 0.5 * s], [0.38 * s, 1.15 * s, 0.38 * s]], 0.16 * s, m));
    // little flame curls along the tip
    g.add(tube([[0.6 * s, 0.4 * s, 0.6 * s], [0.95 * s, 0.75 * s, 0.6 * s], [1.0 * s, 1.1 * s, 0.75 * s]], 0.06 * s, m));
    g.add(tube([[0.6 * s, 0.4 * s, 0.6 * s], [0.6 * s, 0.75 * s, 0.95 * s], [0.75 * s, 1.1 * s, 1.0 * s]], 0.06 * s, m));
    return g;
  }

  /** Two dragons facing a flaming moon (lưỡng long chầu nguyệt) along a ridge of length len */
  ridgeDragons(len: number, scale = 1): THREE.Group {
    const g = new THREE.Group();
    const s = scale;
    const ceramic = this.v.ceramic;
    // the moon / pearl with its flame halo
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.42 * s, 14, 10), this.v.gold);
    moon.position.y = 0.75 * s;
    g.add(moon);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62 * s, 0.07 * s, 6, 16), std({ color: 0xe05a2a, roughness: 0.5 }));
    halo.position.y = 0.75 * s;
    g.add(halo);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.08 * s, 0.3 * s, 5), std({ color: 0xe05a2a }));
      f.position.set(Math.cos(a) * 0.78 * s, 0.75 * s + Math.sin(a) * 0.78 * s, 0);
      f.rotation.z = a - Math.PI / 2;
      g.add(f);
    }
    // the dragons: wavy bodies from each end toward the moon
    [-1, 1].forEach((side) => {
      const L = len / 2 - 0.9 * s;
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push([side * (L - t * (L - 1.0 * s)), 0.25 * s + Math.sin(t * Math.PI * 3) * 0.35 * s + t * 0.3 * s, 0]);
      }
      const body = tube(pts, 0.17 * s, ceramic);
      g.add(body);
      const hx = side * 1.0 * s;
      const head = box(0.5 * s, 0.35 * s, 0.38 * s, ceramic, hx, 0.85 * s, 0);
      g.add(head);
      const snout = box(0.28 * s, 0.2 * s, 0.3 * s, this.v.gold, hx - side * 0.32 * s, 0.82 * s, 0);
      g.add(snout);
      [-1, 1].forEach((zz) => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.35 * s, 5), this.v.gold);
        horn.position.set(hx + side * 0.12 * s, 1.12 * s, zz * 0.1 * s);
        horn.rotation.z = side * 0.6;
        g.add(horn);
      });
      // spines
      for (let i = 1; i < 8; i += 2) {
        const [x, y] = pts[i];
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.07 * s, 0.25 * s, 4), this.v.gold);
        sp.position.set(x, y + 0.2 * s, 0);
        g.add(sp);
      }
    });
    return g;
  }

  /**
   * Vietnamese hip roof: concave, with strongly upturned corners finished in đầu đao curls,
   * a thick ridge with curled ends and, optionally, dragons and a moon in the middle.
   */
  roof(o: { w: number; d: number; h?: number; tone?: 'tile' | 'moss'; dragons?: boolean; curl?: number }): THREE.Group {
    const g = new THREE.Group();
    const h = o.h ?? Math.min(o.w, o.d) * 0.42;
    const r = this.arch.roof({ w: o.w, d: o.d, h, kind: 'hip', curve: 1.3, lift: Math.min(o.w, o.d) * 0.045, thick: 0.3, ridge: false });
    const mat = o.tone === 'moss' ? this.v.tileMoss : this.v.tile;
    r.children.forEach((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.isMesh && mesh.material === this.arch.m.roof.tile) mesh.material = mat;
    });
    (r.children[0] as THREE.Mesh).material = mat;
    g.add(r);
    const heightAt = r.userData.heightAt as (x: number, z: number) => number;
    // ridge (bờ nóc) along the long side
    const long = o.w >= o.d;
    const rl = Math.max(0.8, Math.abs(o.w - o.d)) + 0.4;
    const ry = heightAt(0, 0);
    const ridge = box(long ? rl : 0.5, 0.45, long ? 0.5 : rl, this.v.plasterWhite, 0, ry + 0.15, 0);
    g.add(ridge);
    [-1, 1].forEach((s) => {
      const end = this.dauDao(0.9, this.v.plasterWhite);
      end.position.set(long ? (s * rl) / 2 : 0, ry + 0.25, long ? 0 : (s * rl) / 2);
      end.rotation.y = long ? (s > 0 ? Math.PI / 4 : (-3 * Math.PI) / 4) : s > 0 ? -Math.PI / 4 : (3 * Math.PI) / 4;
      g.add(end);
    });
    if (o.dragons && rl > 4) {
      const dr = this.ridgeDragons(rl, Math.min(1.3, rl / 7));
      dr.position.y = ry + 0.35;
      if (!long) dr.rotation.y = Math.PI / 2;
      g.add(dr);
    }
    // hip ridges and đầu đao at each corner
    const curl = Math.min(1.05, (o.curl ?? Math.min(o.w, o.d) * 0.2) * 0.6);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      const cx = (sx * o.w) / 2, cz = (sz * o.d) / 2;
      const cy = heightAt(cx * 0.985, cz * 0.985);
      // hip ridge from corner to ridge end
      const ex = long ? (sx * rl) / 2 : 0, ez = long ? 0 : (sz * rl) / 2;
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const x = cx + (ex - cx) * t, z = cz + (ez - cz) * t;
        pts.push([x, heightAt(x * 0.99, z * 0.99) + 0.12, z]);
      }
      g.add(tube(pts, 0.14, this.v.plasterWhite, false));
      const tip = this.dauDao(curl);
      tip.position.set(cx, cy, cz);
      tip.rotation.y = Math.atan2(sx, sz) - Math.PI / 4;
      g.add(tip);
    });
    g.userData.h = h;
    g.userData.heightAt = heightAt;
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Signs and ornaments                                                 */
  /* ------------------------------------------------------------------ */
  /** horizontal lacquered plaque (hoành phi) */
  plaque(text: string, w: number, h: number): THREE.Group {
    const g = new THREE.Group();
    g.add(box(w + 0.3, h + 0.3, 0.12, this.v.gold, 0, 0, -0.02));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: hanTex(text, false), roughness: 0.4 }));
    face.position.z = 0.05;
    g.add(face);
    return g;
  }

  /** a pair of vertical boards (câu đối) */
  couplet(text: string, h: number): THREE.Group {
    const g = new THREE.Group();
    g.add(box(0.5, h + 0.2, 0.08, this.v.gold, 0, 0, -0.02));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, h), new THREE.MeshStandardMaterial({ map: hanTex(text, true), roughness: 0.4 }));
    face.position.z = 0.03;
    g.add(face);
    return g;
  }

  /** red silk lantern (đèn lồng) with its own glow */
  lantern(r = 0.45, color = 0xc81e1e): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), std({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.35 }));
    body.scale.y = 0.85;
    g.add(body);
    [r * 0.85, -r * 0.85].forEach((y) => g.add(cyl(r * 0.45, r * 0.45, 0.08, this.v.gold, 0, y, 0, 10)));
    const tassel = cyl(0.03, 0.08, r * 1.2, std({ color: 0xf2c14e }), 0, -r * 1.5, 0, 6);
    g.add(tassel);
    g.userData.glowMat = body.material;
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Buildings                                                           */
  /* ------------------------------------------------------------------ */
  /** Trụ biểu: square gate pillar with a lantern top and a phoenix */
  gatePillar(h: number): THREE.Group {
    const g = new THREE.Group();
    g.add(box(1.1, 0.6, 1.1, this.v.stone, 0, 0.3, 0));
    g.add(box(0.8, h, 0.8, this.v.plasterWhite, 0, 0.6 + h / 2, 0));
    // lantern cage on top
    g.add(box(1.0, 0.25, 1.0, this.v.plasterWhite, 0, h + 0.75, 0));
    g.add(box(0.7, 0.8, 0.7, this.v.darkLacquer, 0, h + 1.25, 0));
    g.add(box(1.0, 0.25, 1.0, this.v.plasterWhite, 0, h + 1.75, 0));
    // lotus bud & phoenix
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), this.v.ceramic);
    bud.scale.y = 1.3;
    bud.position.y = h + 2.2;
    g.add(bud);
    const tail = tube([[0, h + 2.4, 0], [0, h + 2.8, -0.25], [0, h + 3.0, -0.6], [0, h + 2.7, -0.9]], 0.08, this.v.gold);
    g.add(tail);
    return g;
  }

  /**
   * Tam quan: the three-entrance gate. The central (largest) opening is for the gods;
   * people use the two side openings. Two-tier roof over the middle.
   */
  tamQuan(name: string): THREE.Group {
    const g = new THREE.Group();
    const wallM = this.v.ochre;
    // masonry body: four piers with three openings (centre 4 wide, sides 2.4)
    const H = 5.2;
    const piers: [number, number][] = [[-8.3, 2.2], [-4.1, 1.6], [4.1, 1.6], [8.3, 2.2]];
    piers.forEach(([x, w]) => g.add(box(w, H, 2.2, wallM, x, H / 2, 0)));
    // lintels
    g.add(box(6.6, 1.4, 2.2, wallM, 0, H - 0.7, 0));
    [-6.2, 6.2].forEach((x) => g.add(box(2.6, 1.9, 2.2, wallM, x, H - 0.95, 0)));
    // red doors pushed open
    [[-1.9, 0.2], [1.9, -0.2]].forEach(([x, r]) => {
      const d = box(1.9, H - 1.6, 0.12, this.v.lacquer, x, (H - 1.6) / 2, -0.9);
      d.rotation.y = r;
      g.add(d);
    });
    // roofs: small ones over the side bays, a two-tier roof over the centre
    [-6.2, 6.2].forEach((x) => {
      const r = this.roof({ w: 4.6, d: 3.6, h: 1.3, curl: 0.9 });
      r.position.set(x, H, 0);
      g.add(r);
    });
    const low = this.roof({ w: 8.6, d: 4.2, h: 1.4, curl: 1.1 });
    low.position.y = H + 0.2;
    g.add(low);
    // upper storey (gác) with the name plaque
    g.add(box(5.2, 2.0, 2.4, this.v.darkLacquer, 0, H + 2.1, 0));
    const pl = this.plaque(name, 3.2, 0.9);
    pl.position.set(0, H + 2.15, 1.25);
    g.add(pl);
    const plBack = this.plaque(name, 3.2, 0.9);
    plBack.position.set(0, H + 2.15, -1.25);
    plBack.rotation.y = Math.PI;
    g.add(plBack);
    const up = this.roof({ w: 7.4, d: 4.0, h: 1.7, dragons: true, curl: 1.2 });
    up.position.y = H + 3.1;
    g.add(up);
    // gate pillars out front
    [-10.6, 10.6].forEach((x) => {
      const p = this.gatePillar(5.6);
      p.position.set(x, 0, 0.6);
      g.add(p);
    });
    // couplets on the front piers
    [[-4.1, 'Núi mây ngàn năm đẹp'], [4.1, 'Trăng nước vạn thuở trong']].forEach(([x, t]) => {
      const c = this.couplet(t as string, 3.2);
      c.position.set(x as number, 2.6, 1.13);
      g.add(c);
    });
    g.userData.openings = { centre: [-2, 2], left: [-7.2, -5.1], right: [5.1, 7.2] };
    return g;
  }

  /** Big bronze incense burner (lư hương / đỉnh) on a stone plinth */
  incenseBurner(): THREE.Group {
    const g = new THREE.Group();
    g.add(box(2.4, 0.9, 2.4, this.v.stone, 0, 0.45, 0));
    const b = this.v.bronze;
    // three legs
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const leg = cyl(0.12, 0.08, 0.7, b, Math.cos(a) * 0.65, 1.25, Math.sin(a) * 0.65, 6);
      g.add(leg);
    }
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), b);
    bowl.scale.y = 0.75;
    bowl.position.y = 2.15;
    bowl.castShadow = true;
    g.add(bowl);
    g.add(cyl(0.98, 0.98, 0.12, b, 0, 2.15, 0, 18));
    // ears
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 6, 10, Math.PI), b);
      ear.position.set(s * 0.95, 2.35, 0);
      ear.rotation.y = Math.PI / 2;
      g.add(ear);
    });
    // ash and incense sticks
    g.add(cyl(0.9, 0.9, 0.05, std({ color: 0x9a9286, roughness: 1 }), 0, 2.18, 0, 18));
    const stickM = std({ color: 0xb5332a });
    const tipM = new THREE.MeshBasicMaterial({ color: 0xff7a2a });
    for (let k = 0; k < 15; k++) {
      const a = k * 2.4, r = 0.15 + (k % 4) * 0.17;
      const st = cyl(0.015, 0.015, 0.9, stickM, Math.cos(a) * r, 2.6, Math.sin(a) * r, 4);
      st.rotation.z = Math.cos(a) * 0.08;
      g.add(st);
      g.add(cyl(0.02, 0.02, 0.05, tipM, Math.cos(a) * r, 3.06, Math.sin(a) * r, 4));
    }
    return g;
  }

  /** Lò hóa vàng: brick furnace where paper offerings and petitions are burned */
  furnace(): THREE.Group {
    const g = new THREE.Group();
    g.add(box(2.4, 2.2, 2.0, this.v.brick, 0, 1.1, 0));
    g.add(box(1.0, 1.0, 0.1, std({ color: 0x1a0d08 }), 0, 0.9, 1.0));
    const fire = new THREE.PointLight(0xff7a2a, 3, 5, 2);
    fire.position.set(0, 0.9, 1.3);
    g.add(fire);
    g.add(box(0.7, 1.6, 0.7, this.v.brick, 0, 3.0, -0.3));
    const r = this.roof({ w: 3.2, d: 2.8, h: 0.8, curl: 0.6 });
    r.position.y = 2.2;
    g.add(r);
    g.userData.fire = fire;
    return g;
  }

  /** Gác chuông: two-tier bell tower with a bronze bell */
  bellTower(): THREE.Group {
    const g = new THREE.Group();
    g.add(box(6, 0.8, 6, this.v.stone, 0, 0.4, 0));
    [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]].forEach(([x, z]) => g.add(cyl(0.22, 0.24, 6.4, this.v.lacquer, x, 4.0, z, 10)));
    const lowRoof = this.roof({ w: 7.2, d: 7.2, h: 1.5, curl: 1.3 });
    lowRoof.position.y = 4.4;
    g.add(lowRoof);
    g.add(box(4.6, 1.8, 4.6, this.v.darkLacquer, 0, 6.6, 0));
    const top = this.roof({ w: 6.2, d: 6.2, h: 2.0, curl: 1.2 });
    top.position.y = 7.4;
    g.add(top);
    // bell (Vietnamese bells are tall and cylindrical with a domed top)
    const bell = new THREE.Group();
    bell.add(cyl(0.75, 0.85, 1.9, this.v.bronze, 0, -0.95, 0, 20));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.v.bronze);
    bell.add(dome);
    [-0.5, -1.4].forEach((y) => bell.add(cyl(0.8, 0.8, 0.06, this.v.gold, 0, y, 0, 20)));
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 6, 12), this.v.bronze);
    hook.position.y = 0.8;
    bell.add(hook);
    bell.position.y = 3.9;
    bell.name = 'bell';
    g.add(bell);
    // striker log
    const log = cyl(0.14, 0.14, 1.8, this.v.wood, 1.9, 3.2, 0, 8);
    log.rotation.z = Math.PI / 2;
    g.add(log);
    g.userData.bell = bell;
    return g;
  }

  /** Small grotto altar for the Mountain Mother (Sơn trang) */
  grotto(): THREE.Group {
    const g = new THREE.Group();
    const rockM = this.v.karst;
    const rock = (r: number, x: number, y: number, z: number, sy = 1) => {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), rockM);
      m.position.set(x, y, z);
      m.scale.y = sy;
      m.rotation.set(x, z, y);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    };
    // arch of rocks around a dark mouth
    rock(3.2, -3.2, 2.4, 0, 1.4);
    rock(3.0, 3.2, 2.2, 0, 1.4);
    rock(3.4, 0, 6.2, -0.6, 0.8);
    rock(2.2, -5.6, 1.2, 1.2);
    rock(2.0, 5.4, 1.0, 1.4);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), new THREE.MeshBasicMaterial({ color: 0x0b120d }));
    mouth.position.set(0, 2.2, -0.2);
    mouth.scale.y = 1.25;
    g.add(mouth);
    // little altar at the mouth: green-robed figures and a lamp
    g.add(box(2.4, 0.9, 0.9, this.v.lacquer, 0, 0.45, 1.5));
    const lamp = new THREE.PointLight(0x9cff9c, 3, 7, 2);
    lamp.position.set(0, 1.6, 1.4);
    g.add(lamp);
    g.add(cyl(0.06, 0.06, 0.25, this.v.candle, -0.8, 1.05, 1.5, 6));
    g.add(cyl(0.06, 0.06, 0.25, this.v.candle, 0.8, 1.05, 1.5, 6));
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* The main hall and its altars                                        */
  /* ------------------------------------------------------------------ */
  /**
   * Main hall (Đền chính / Bái đường): 5 bays, red lacquer columns, ochre walls,
   * three doors in front (the centre door reserved for the gods), two-tier roof with dragons.
   * Origin at the centre of the floor; front faces +z.
   */
  mainHall(o: { w: number; d: number; name: string }): THREE.Group {
    const g = new THREE.Group();
    const { w, d } = o;
    const pod = 1.0;
    const wallH = 5.4;
    g.add(box(w + 3, pod, d + 3, this.v.stone, 0, pod / 2, 0));
    // front steps
    [0, 1, 2].forEach((i) => g.add(box(w * 0.6, (pod / 3) * (i + 1), 0.6, this.v.stone, 0, ((pod / 3) * (i + 1)) / 2, d / 2 + 1.5 + 0.6 * (2 - i) + 0.3)));
    // floor tiles
    g.add(box(w, 0.08, d, this.v.brick, 0, pod + 0.04, 0));
    const fy = pod + 0.08;
    // columns: 6 across the front (5 bays), black stone bases
    const bays = 5;
    for (let i = 0; i <= bays; i++) {
      const x = -w / 2 + (w * i) / bays;
      [d / 2, d / 6, -d / 6, -d / 2].forEach((z) => {
        g.add(cyl(0.32, 0.32, 0.3, this.v.stone, x, fy + 0.15, z, 10));
        g.add(cyl(0.24, 0.26, wallH, this.v.lacquer, x, fy + 0.3 + wallH / 2, z, 12));
      });
    }
    // walls: back and sides ochre, front a lattice of doors
    const t = 0.35;
    g.add(box(w, wallH, t, this.v.ochre, 0, fy + wallH / 2, -d / 2 + 0.1));
    [-1, 1].forEach((s) => g.add(box(t, wallH, d, this.v.ochre, s * (w / 2 - 0.1), fy + wallH / 2, 0)));
    // front: bays 0 and 4 have round windows in ochre, 1 and 3 side doors (open), 2 the centre door (closed lacquer)
    const bw = w / bays;
    const bx = (i: number) => -w / 2 + bw * (i + 0.5);
    [0, 4].forEach((i) => {
      g.add(box(bw - 0.4, wallH, t, this.v.ochre, bx(i), fy + wallH / 2, d / 2 - 0.1));
      const win = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 8, 24), this.v.lacquer);
      win.position.set(bx(i), fy + wallH * 0.55, d / 2 + 0.1);
      g.add(win);
      const grill = new THREE.Mesh(new THREE.CircleGeometry(0.85, 24), std({ color: 0x2a120c }));
      grill.position.set(bx(i), fy + wallH * 0.55, d / 2 + 0.08);
      g.add(grill);
      const ch = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: viTexture(i === 0 ? 'PHÚC' : 'THỌ', 'rgba(0,0,0,0)', '#f2c14e', 256, 128, false), transparent: true }));
      ch.position.set(bx(i), fy + wallH * 0.55, d / 2 + 0.12);
      g.add(ch);
    });
    // the centre door: closed, gilded
    const cd = box(bw - 0.5, wallH - 1.2, 0.16, this.v.lacquer, bx(2), fy + (wallH - 1.2) / 2, d / 2 - 0.05);
    g.add(cd);
    const cdg = box(bw - 1.2, (wallH - 1.2) * 0.7, 0.04, this.v.gold, bx(2), fy + (wallH - 1.2) / 2, d / 2 + 0.05);
    g.add(cdg);
    // lintels above the doors
    [1, 2, 3].forEach((i) => g.add(box(bw - 0.4, 1.2, t, this.v.darkLacquer, bx(i), fy + wallH - 0.6, d / 2 - 0.1)));
    // side doors pushed open inward
    [1, 3].forEach((i) => {
      [-1, 1].forEach((s) => {
        const leaf = box((bw - 0.5) / 2, wallH - 1.3, 0.1, this.v.lacquer, bx(i) + s * ((bw - 0.5) / 2), fy + (wallH - 1.3) / 2, d / 2 - 0.7);
        leaf.rotation.y = s * 1.2;
        g.add(leaf);
      });
      // raised wooden threshold (ngưỡng cửa)
      g.add(box(bw - 0.5, 0.28, 0.3, this.v.darkLacquer, bx(i), fy + 0.14, d / 2 - 0.1));
    });
    // plaque and couplets
    const pl = this.plaque(o.name, 4.2, 1.1);
    pl.position.set(0, fy + wallH + 0.2, d / 2 + 0.35);
    g.add(pl);
    [[bx(1) - bw / 2, 'Mẫu nghi thiên hạ'], [bx(3) + bw / 2, 'Ân trạch vạn dân']].forEach(([x, txt]) => {
      const c = this.couplet(txt as string, 3.6);
      c.position.set(x as number, fy + 2.6, d / 2 + 0.32);
      g.add(c);
    });
    // beams and the two-tier roof (chồng diêm)
    const topY = fy + wallH;
    g.add(box(w + 1.2, 0.6, d + 1.2, this.v.darkLacquer, 0, topY + 0.3, 0));
    const low = this.roof({ w: w + 4.4, d: d + 4.4, h: 2.0, curl: 1.8 });
    low.position.y = topY + 0.5;
    g.add(low);
    g.add(box(w * 0.7, 1.8, d * 0.6, this.v.ochre, 0, topY + 2.5, 0));
    const up = this.roof({ w: w * 0.7 + 3.6, d: d * 0.6 + 3.2, h: 2.6, dragons: true, curl: 1.6 });
    up.position.y = topY + 3.3;
    g.add(up);
    // interior: dark ceiling so the altar lights glow
    g.add(box(w - 0.6, 0.15, d - 0.6, std({ color: 0x2a1610, roughness: 1 }), 0, topY - 0.1, 0));
    g.userData = { floorY: fy, wallH, bays, bw, bx: [0, 1, 2, 3, 4].map(bx), d, w };
    return g;
  }

  /** A seated Mother Goddess statue: robe colour, gilded crown, hands folded */
  mother(robe: number, h = 1.6): THREE.Group {
    const g = new THREE.Group();
    const k = h / 1.6;
    const robeM = std({ color: robe, roughness: 0.5, metalness: 0.05 });
    const gold = this.v.gold;
    const skin = std({ color: 0xf3d9bd, roughness: 0.6 });
    // throne
    g.add(box(1.2 * k, 0.7 * k, 1.0 * k, this.v.lacquer, 0, 0.35 * k, -0.05 * k));
    g.add(box(1.25 * k, 1.5 * k, 0.15 * k, this.v.lacquer, 0, 1.1 * k, -0.55 * k));
    g.add(box(1.35 * k, 0.1 * k, 0.18 * k, this.v.gold, 0, 1.88 * k, -0.55 * k));
    // seated body
    g.add(cyl(0.32 * k, 0.55 * k, 0.9 * k, robeM, 0, 1.1 * k, 0, 14));
    g.add(box(0.95 * k, 0.3 * k, 0.75 * k, robeM, 0, 0.82 * k, 0.15 * k));
    g.add(cyl(0.14 * k, 0.14 * k, 0.4 * k, gold, 0, 1.15 * k, 0.32 * k, 10)).rotation.x = Math.PI / 2;
    // collar & head
    g.add(cyl(0.3 * k, 0.32 * k, 0.12 * k, gold, 0, 1.58 * k, 0, 14));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2 * k, 14, 12), skin);
    head.position.y = 1.82 * k;
    g.add(head);
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022 * k, 6, 4), std({ color: 0x1a120c }));
      eye.position.set(s * 0.07 * k, 1.85 * k, 0.185 * k);
      g.add(eye);
    });
    const lips = new THREE.Mesh(new THREE.SphereGeometry(0.025 * k, 6, 4), std({ color: 0xb8323a }));
    lips.position.set(0, 1.75 * k, 0.19 * k);
    lips.scale.x = 1.6;
    g.add(lips);
    // crown (mũ) with phoenix wings
    g.add(cyl(0.14 * k, 0.2 * k, 0.22 * k, gold, 0, 2.08 * k, -0.03 * k, 12));
    [-1, 1].forEach((s) => {
      const wing = box(0.22 * k, 0.08 * k, 0.04 * k, gold, s * 0.24 * k, 2.12 * k, -0.04 * k);
      wing.rotation.z = s * 0.4;
      g.add(wing);
    });
    // red veil tassels on each side of the face
    [-1, 1].forEach((s) => g.add(cyl(0.02 * k, 0.02 * k, 0.35 * k, std({ color: 0xc81e1e }), s * 0.22 * k, 1.75 * k, 0.05 * k, 5)));
    return g;
  }

  /** small seated official / lady figure for the lower tiers */
  figure(robe: number, hat = 0x1a1a1a, h = 1.0): THREE.Group {
    const g = new THREE.Group();
    const k = h;
    const robeM = std({ color: robe, roughness: 0.55 });
    g.add(cyl(0.22 * k, 0.4 * k, 0.75 * k, robeM, 0, 0.38 * k, 0, 10));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15 * k, 10, 8), std({ color: 0xe8c79a, roughness: 0.5 }));
    head.position.y = 0.9 * k;
    g.add(head);
    g.add(cyl(0.12 * k, 0.15 * k, 0.16 * k, std({ color: hat, roughness: 0.5 }), 0, 1.08 * k, 0, 10));
    return g;
  }

  /** one of the Five Tigers (Ngũ Hổ) that guard the lower altar */
  tiger(color: number): THREE.Group {
    const g = new THREE.Group();
    const m = std({ color, roughness: 0.6 });
    const dark = std({ color: 0x1a1410, roughness: 0.7 });
    g.add(box(0.7, 0.32, 0.32, m, 0, 0.32, 0));
    const head = box(0.3, 0.28, 0.3, m, 0.45, 0.45, 0);
    g.add(head);
    [-0.25, 0.25].forEach((x) => [-0.1, 0.1].forEach((z) => g.add(box(0.08, 0.2, 0.08, m, x, 0.1, z))));
    for (let i = 0; i < 3; i++) g.add(box(0.04, 0.33, 0.34, dark, -0.2 + i * 0.18, 0.33, 0));
    const tail = tube([[-0.35, 0.35, 0], [-0.55, 0.5, 0], [-0.55, 0.7, 0.1]], 0.04, m);
    g.add(tail);
    [-0.08, 0.08].forEach((z) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd23a }));
      eye.position.set(0.61, 0.52, z);
      g.add(eye);
    });
    return g;
  }

  /** a snake coiled up a pillar (Ông Lốt) */
  coiledSnake(color: number, h: number, r: number): THREE.Group {
    const g = new THREE.Group();
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = t * Math.PI * 2 * 3.5;
      pts.push([Math.cos(a) * r, 0.4 + t * h, Math.sin(a) * r]);
    }
    const m = std({ color, roughness: 0.4, metalness: 0.1 });
    g.add(tube(pts, 0.09, m, false));
    const [hx, hy, hz] = pts[pts.length - 1];
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), m);
    head.scale.set(1, 0.7, 1.4);
    head.position.set(hx, hy + 0.05, hz);
    g.add(head);
    return g;
  }

  /** The tiered altar of a Mother Goddess temple (Tứ phủ), back wall at -z. */
  altar(): THREE.Group {
    const g = new THREE.Group();
    const L = this.v.lacquer, G = this.v.gold;
    // stepped platform: three tiers
    [[9, 1.0, 3.2, 0], [7, 1.0, 2.2, -0.6], [5, 1.0, 1.4, -1.0]].forEach(([w, h, d, z], i) => {
      g.add(box(w, h, d, L, 0, h / 2 + i * 1.0, z));
      g.add(box(w + 0.1, 0.12, d + 0.1, G, 0, (i + 1) * 1.0, z));
    });
    // top tier: the Three Mothers (Tam Tòa Thánh Mẫu): red centre, green left, white right
    const mothers: [number, number, number][] = [[0, 0xb81c1c, 0xe8b830], [-1.7, 0x2f8a4a, 0xe8b830], [1.7, 0xf4f1ea, 0x2f5a8a]];
    mothers.forEach(([x, c, acc], i) => {
      const mo = sacredMother(c, acc, 1.5, i + 3);
      mo.position.set(x, 3.0, -1.0);
      g.add(mo);
    });
    // a golden canopy (khám) over them
    g.add(box(6.2, 0.3, 2.0, G, 0, 6.2, -1.0));
    [-3, 3].forEach((x) => g.add(cyl(0.1, 0.1, 3.2, G, x, 4.6, -0.2, 8)));
    const cano = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.8), std({ color: 0xc81e1e, side: THREE.DoubleSide, roughness: 0.6 }));
    cano.position.set(0, 5.7, 0);
    g.add(cano);
    // middle tier: the Five Great Mandarins (Ngũ vị Tôn Ông) in their colours
    [0xb81c1c, 0xf4f1ea, 0x2c5fa8, 0xd4a017, 0x2f8a4a].forEach((c, i) => {
      const f = this.figure(c, 0x1a1a1a, 0.75);
      f.position.set(-2.4 + i * 1.2, 2.0, -0.4);
      g.add(f);
    });
    // lower tier: offerings, candles, fruit and flowers
    const fruit = [0xe8a33a, 0xd23a2a, 0x7fb04a, 0xf2d24a];
    for (let i = 0; i < 6; i++) {
      const x = -3.6 + i * 1.44;
      g.add(cyl(0.38, 0.22, 0.12, G, x, 1.1, 0.9, 12));
      for (let k = 0; k < 4; k++) {
        const fr = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), std({ color: fruit[(i + k) % 4], roughness: 0.5 }));
        fr.position.set(x + Math.cos(k * 1.6) * 0.16, 1.26 + (k === 3 ? 0.12 : 0), 0.9 + Math.sin(k * 1.6) * 0.16);
        g.add(fr);
      }
    }
    // tall candles with flames
    [-4.2, 4.2].forEach((x) => {
      g.add(cyl(0.12, 0.16, 1.1, std({ color: 0xc81e1e }), x, 1.55, 1.0, 8));
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), this.v.candle);
      fl.position.set(x, 2.2, 1.0);
      g.add(fl);
    });
    // Five Tigers in their own small shrine under the altar (cung Ngũ Hổ): a raised red plinth
    // inside a gilded frame, each tiger on its own little lotus-red cushion, never on the floor
    g.add(box(6.0, 0.32, 0.8, L, 0, 0.16, 1.75));
    g.add(box(6.1, 0.05, 0.85, G, 0, 0.34, 1.75));
    g.add(box(6.3, 0.14, 0.9, G, 0, 1.05, 1.75));
    [-3.08, 3.08].forEach((x) => g.add(box(0.14, 1.0, 0.9, G, x, 0.55, 1.75)));
    g.add(box(6.0, 0.7, 0.05, std({ color: 0x2a0d08, roughness: 0.9 }), 0, 0.7, 1.33));
    [0xd4a017, 0xb81c1c, 0xf4f1ea, 0x2a2a2a, 0x2f8a4a].forEach((c, i) => {
      g.add(box(0.7, 0.04, 0.5, std({ color: 0xc81e1e, roughness: 0.6 }), -2.2 + i * 1.1, 0.385, 1.75));
      const t = this.tiger(c);
      t.position.set(-2.2 + i * 1.1, 0.4, 1.75);
      t.scale.setScalar(0.85);
      t.rotation.y = -Math.PI / 2;
      g.add(t);
    });
    // altar glow
    const glow = new THREE.PointLight(0xffb45a, 14, 14, 1.6);
    glow.name = 'altarGlow';
    glow.position.set(0, 4.5, 2.5);
    g.add(glow);
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Nature                                                              */
  /* ------------------------------------------------------------------ */
  /** Banyan (cây đa): huge spreading crown with hanging aerial roots and a buttressed trunk */
  banyan(s = 1): THREE.Group {
    const g = new THREE.Group();
    const bark = std({ color: 0x6b5a48, roughness: 0.95, flatShading: true });
    const leaf = std({ color: 0x3f6b35, roughness: 0.9, flatShading: true });
    const leaf2 = std({ color: 0x4f7d3e, roughness: 0.9, flatShading: true });
    // buttress roots forming a hollow between them
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const r = tube([[Math.cos(a) * 2.6 * s, 0, Math.sin(a) * 2.6 * s], [Math.cos(a) * 1.4 * s, 1.4 * s, Math.sin(a) * 1.4 * s], [Math.cos(a) * 0.9 * s, 4.5 * s, Math.sin(a) * 0.9 * s]], 0.55 * s, bark, false);
      g.add(r);
    }
    g.add(cyl(1.0 * s, 1.4 * s, 7 * s, bark, 0, 4.5 * s, 0, 10));
    // big limbs
    for (let k = 0; k < 5; k++) {
      const a = k * 1.3;
      g.add(tube([[0, 6.5 * s, 0], [Math.cos(a) * 3 * s, 8 * s, Math.sin(a) * 3 * s], [Math.cos(a) * 6 * s, 8.8 * s, Math.sin(a) * 6 * s]], 0.45 * s, bark));
    }
    // crown
    const blobs: [number, number, number, number][] = [
      [0, 10.5, 0, 5.2], [-5, 9.4, 1, 3.8], [5, 9.6, -1, 4], [1.5, 10, 5, 3.6], [-1.5, 9.8, -5, 3.8], [3.8, 11.5, 3.2, 3], [-3.8, 11.2, -3, 3.2],
    ];
    blobs.forEach(([x, y, z, r], i) => {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), i % 2 ? leaf : leaf2);
      b.position.set(x * s, y * s, z * s);
      b.scale.y = 0.7;
      b.castShadow = true;
      g.add(b);
    });
    // aerial roots hanging down
    const rootM = std({ color: 0x7a6852, roughness: 1 });
    for (let k = 0; k < 26; k++) {
      const a = k * 2.39, r = (2.5 + (k % 5) * 0.9) * s;
      const len = (3 + (k % 4) * 1.4) * s;
      const rt = cyl(0.04 * s, 0.07 * s, len, rootM, Math.cos(a) * r, 8.4 * s - len / 2, Math.sin(a) * r, 4);
      g.add(rt);
    }
    // red cloth tied on the trunk (offerings to the tree spirit)
    g.add(cyl(1.1 * s, 1.1 * s, 0.25 * s, std({ color: 0xc81e1e, roughness: 0.7 }), 0, 2.4 * s, 0, 14));
    return g;
  }

  /** a karst limestone tower (núi đá vôi) */
  karst(r: number, h: number, seed = 1): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(r * 0.55, r, h, 11, 6);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = Math.sin(x * 0.7 + seed) * Math.cos(z * 0.6 + seed * 2) * 0.18 + Math.sin(y * 0.5 + seed) * 0.12;
      const top = y > h / 2 - 0.01 ? 0.75 : 1;
      p.setXYZ(i, x * (1 + n) * top, y + (y > h / 2 - 0.01 ? Math.sin(x + seed) * r * 0.25 : 0), z * (1 + n) * top);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.v.karst);
    m.position.y = h / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    // green cap of shrubs
    const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.6, 1), std({ color: 0x3f6b35, roughness: 1, flatShading: true }));
    cap.scale.y = 0.45;
    cap.position.y = h / 2 + r * 0.05;
    m.add(cap);
    return m;
  }

  /** A field of lotus leaves and flowers over a pond */
  lotus(n: number, area: (i: number) => [number, number], y: number): THREE.Group {
    const g = new THREE.Group();
    const padM = std({ color: 0x4f8a3e, roughness: 0.7, side: THREE.DoubleSide });
    const pink = std({ color: 0xf3a5bf, roughness: 0.6, emissive: 0x3a1020 });
    const white = std({ color: 0xfbf3f0, roughness: 0.6 });
    for (let i = 0; i < n; i++) {
      const [x, z] = area(i);
      const r = 0.45 + ((i * 37) % 10) / 18;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 12, 0.3, Math.PI * 2 - 0.3), padM);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = i;
      pad.position.set(x, y + 0.02 + (i % 3) * 0.01, z);
      g.add(pad);
      if (i % 4 === 0) {
        const stem = cyl(0.025, 0.025, 0.9, padM, x + 0.2, y + 0.45, z, 4);
        g.add(stem);
        const fl = new THREE.Group();
        for (let k = 0; k < 6; k++) {
          const pet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), i % 8 === 0 ? white : pink);
          pet.scale.set(0.6, 1.4, 0.4);
          pet.position.set(Math.cos(k) * 0.08, 0, Math.sin(k) * 0.08);
          pet.rotation.set(Math.sin(k) * 0.5, 0, Math.cos(k) * 0.5);
          fl.add(pet);
        }
        fl.position.set(x + 0.2, y + 0.98, z);
        g.add(fl);
      }
    }
    return g;
  }

  /** Stone turtle carrying a stele (bia đá) */
  turtleStele(text: string): THREE.Group {
    const g = new THREE.Group();
    const st = this.v.stone;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), st);
    shell.scale.set(1, 0.55, 1.35);
    g.add(shell);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), st);
    head.position.set(0, 0.35, 1.55);
    head.scale.z = 1.3;
    head.name = 'turtleHead';
    g.add(head);
    [[-0.8, 0.9], [0.8, 0.9], [-0.8, -0.9], [0.8, -0.9]].forEach(([x, z]) => g.add(box(0.35, 0.25, 0.4, st, x, 0.12, z)));
    const slab = box(1.4, 2.4, 0.3, st, 0, 1.75, 0);
    g.add(slab);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0), new THREE.MeshStandardMaterial({ map: viTexture(text, '#8d918a', '#3a3d38', 192, 384, true), roughness: 0.95 }));
    face.position.set(0, 1.75, 0.16);
    g.add(face);
    g.add(box(1.6, 0.3, 0.4, st, 0, 3.05, 0));
    return g;
  }

  /** Stone village well with a wooden frame and bucket */
  well(): THREE.Group {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.8, 18, 1, true), this.v.stone);
    (rim.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    rim.position.y = 0.4;
    g.add(rim);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.1, 6, 20), this.v.stone);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.8;
    g.add(lip);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.95, 18), new THREE.MeshStandardMaterial({ color: 0x1d3b3a, roughness: 0.1 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.25;
    g.add(water);
    [-1.1, 1.1].forEach((x) => g.add(box(0.12, 2.2, 0.12, this.v.wood, x, 1.1, 0)));
    g.add(box(2.4, 0.1, 0.1, this.v.wood, 0, 2.15, 0));
    // a plain little tiled gable
    [-1, 1].forEach((sd) => {
      const slab = box(2.8, 0.08, 1.0, this.v.tile, 0, 2.45, sd * 0.42);
      slab.rotation.x = sd * 0.55;
      g.add(slab);
    });
    const rope = cyl(0.01, 0.01, 1.3, this.v.wood, 0.2, 1.5, 0, 4);
    g.add(rope);
    g.add(cyl(0.16, 0.13, 0.25, this.v.wood, 0.2, 0.85, 0, 10));
    return g;
  }

  /** A painted paper horse (ngựa giấy) on a little bamboo stand, waiting to be burned */
  paperHorse(): THREE.Group {
    const g = new THREE.Group();
    const white = std({ color: 0xf6f1e6, roughness: 0.8 });
    const red = std({ color: 0xc81e1e, roughness: 0.7 });
    const gold = this.v.gold;
    g.add(box(1.4, 0.08, 0.6, std({ color: 0x9fae62 }), 0, 0.15, 0));
    [-0.5, 0.5].forEach((x) => [-0.18, 0.18].forEach((z) => g.add(box(0.1, 0.8, 0.1, white, x, 0.55, z))));
    g.add(box(1.2, 0.5, 0.45, white, 0, 1.1, 0));
    g.add(box(1.22, 0.14, 0.47, red, 0, 1.05, 0));
    const neck = box(0.3, 0.7, 0.3, white, 0.65, 1.45, 0);
    neck.rotation.z = -0.5;
    g.add(neck);
    g.add(box(0.5, 0.26, 0.26, white, 0.92, 1.78, 0));
    g.add(box(0.18, 0.5, 0.06, red, 0.5, 1.6, 0));
    [-0.13, 0.13].forEach((z) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), std({ color: 0x111111 }));
      eye.position.set(1.02, 1.85, z);
      g.add(eye);
    });
    g.add(box(0.5, 0.06, 0.5, gold, -0.1, 1.38, 0));
    const tail = tube([[-0.6, 1.2, 0], [-0.85, 1.0, 0], [-0.9, 0.7, 0]], 0.06, std({ color: 0x2a2a2a }));
    g.add(tail);
    return g;
  }

  /** Kapok tree (cây gạo): tall bare trunk, few branches, big red flowers */
  kapok(s = 1): THREE.Group {
    const g = new THREE.Group();
    const bark = std({ color: 0x8a7a68, roughness: 0.95, flatShading: true });
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      g.add(tube([[Math.cos(a) * 1.6 * s, 0, Math.sin(a) * 1.6 * s], [Math.cos(a) * 0.6 * s, 1.2 * s, Math.sin(a) * 0.6 * s], [0, 3 * s, 0]], 0.35 * s, bark, false));
    }
    g.add(cyl(0.45 * s, 0.7 * s, 12 * s, bark, 0, 6 * s, 0, 9));
    const red = std({ color: 0xd42a1a, roughness: 0.6, emissive: 0x3a0800 });
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9, y = (7 + k * 0.9) * s, L = (2.4 + (k % 3)) * s;
      const end: [number, number, number] = [Math.cos(a) * L, y + 1.2 * s, Math.sin(a) * L];
      g.add(tube([[0, y, 0], [Math.cos(a) * L * 0.5, y + 0.4 * s, Math.sin(a) * L * 0.5], end], 0.14 * s, bark));
      for (let f = 0; f < 6; f++) {
        const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 * s, 0), red);
        fl.position.set(end[0] + (Math.random() - 0.5) * 1.2 * s, end[1] + (Math.random() - 0.3) * 0.8 * s, end[2] + (Math.random() - 0.5) * 1.2 * s);
        g.add(fl);
      }
    }
    return g;
  }

  /** A betel vine spiralling up a trunk (for the areca palm of the trầu cau legend) */
  betelVine(h: number, r: number): THREE.Group {
    const g = new THREE.Group();
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, a = t * Math.PI * 2 * 4;
      pts.push([Math.cos(a) * r, 0.2 + t * h, Math.sin(a) * r]);
    }
    const leafM = std({ color: 0x3f8a3a, roughness: 0.7, side: THREE.DoubleSide });
    g.add(tube(pts, 0.03, std({ color: 0x4f7a2a }), false));
    pts.forEach(([x, y, z], i) => {
      if (i % 2) return;
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.16, 6), leafM);
      leaf.position.set(x * 1.3, y, z * 1.3);
      leaf.lookAt(x * 4, y + 0.3, z * 4);
      g.add(leaf);
    });
    return g;
  }

  /** Water-puppet pavilion (thủy đình): a little stage on stilts, the puppeteers hidden behind a bamboo blind */
  thuyDinh(): THREE.Group {
    const g = new THREE.Group();
    const posts = this.v.darkLacquer;
    [[-2.4, -1.8], [2.4, -1.8], [-2.4, 1.8], [2.4, 1.8], [0, -1.8], [0, 1.8]].forEach(([x, z]) => g.add(cyl(0.14, 0.16, 1.4, this.v.stone, x, -0.4, z, 8)));
    g.add(box(5.4, 0.25, 4.2, this.v.wood, 0, 0.35, 0));
    [-2.4, 2.4].forEach((x) => [-1.8, 1.8].forEach((z) => g.add(cyl(0.11, 0.11, 2.6, posts, x, 1.75, z, 8))));
    // red back wall and the bamboo blind (mành) the puppets come out from under
    g.add(box(5.0, 2.6, 0.12, this.v.lacquer, 0, 1.75, -1.6));
    g.add(box(4.6, 1.5, 0.05, std({ color: 0xc9a35a, roughness: 0.8 }), 0, 1.3, 1.82));
    for (let i = 0; i < 18; i++) g.add(box(0.02, 1.5, 0.06, std({ color: 0x8a6a2a }), -2.25 + i * 0.265, 1.3, 1.85));
    g.add(box(5.2, 0.5, 0.1, this.v.lacquer, 0, 3.0, 1.9));
    g.add(box(4.0, 0.36, 0.04, this.v.gold, 0, 3.0, 1.96));
    const roof = this.roof({ w: 6.4, d: 5.0, h: 1.4, curl: 0.8 });
    roof.position.y = 3.05;
    g.add(roof);
    // puppets on the water in front of the stage: a dragon, two fairies and Chú Tễu the jester
    const p = new THREE.Group();
    const fairy = (c: number, x: number) => {
      const f = new THREE.Group();
      f.add(cyl(0.12, 0.22, 0.5, std({ color: c, roughness: 0.6 }), 0, 0.25, 0, 10));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), std({ color: 0xf1cfa6 }));
      head.position.y = 0.6;
      f.add(head);
      f.add(cyl(0.1, 0.13, 0.07, this.v.gold, 0, 0.72, 0, 10));
      f.position.set(x, 0, 2.9);
      return f;
    };
    p.add(fairy(0xc81e1e, -1.2), fairy(0x3f8a3a, 1.2));
    const teu = new THREE.Group();
    teu.add(cyl(0.18, 0.2, 0.45, std({ color: 0xf2d27a }), 0, 0.22, 0, 10));
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), std({ color: 0xf1cfa6 }));
    th.position.y = 0.6;
    teu.add(th);
    teu.position.set(0, 0, 3.3);
    p.add(teu);
    const dragon = tube([[-2.2, 0.1, 4.2], [-1.4, 0.45, 4.0], [-0.6, 0.1, 4.3], [0.4, 0.4, 4.1], [1.2, 0.15, 4.4]], 0.12, std({ color: 0xd4a017, metalness: 0.3, roughness: 0.4 }));
    p.add(dragon);
    p.position.y = -0.25;
    g.add(p);
    g.userData.puppets = p;
    return g;
  }
}
