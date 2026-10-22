import * as THREE from 'three';
import type { KitMaterials } from './materials';
import { kanjiTexture } from './materials';

export type TreeKind =
  | 'cedar' | 'pine' | 'sakura' | 'plum' | 'maple' | 'camphor' | 'broadleaf'
  | 'birch' | 'spruceSnow' | 'palm' | 'bamboo' | 'hibiscus' | 'ginkgo';

type Part = { geo: THREE.BufferGeometry; mat: THREE.Material; m: THREE.Matrix4 };

const M = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)),
    new THREE.Vector3(sx, sy, sz)
  );

const mat = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...extra });

export class Nature {
  private recipes = new Map<TreeKind, Part[]>();
  public animated: { update: (t: number) => void }[] = [];

  constructor(public m: KitMaterials) {}

  private recipe(kind: TreeKind): Part[] {
    const cached = this.recipes.get(kind);
    if (cached) return cached;
    const bark = mat(0x4a3628);
    const parts: Part[] = [];
    const blob = (r: number) => new THREE.IcosahedronGeometry(r, 1);
    switch (kind) {
      case 'cedar': {
        const leaf = mat(0x1f3a26);
        parts.push({ geo: new THREE.CylinderGeometry(0.28, 0.6, 16, 8), mat: mat(0x5a3d2b), m: M(0, 8, 0) });
        for (let c = 0; c < 5; c++)
          parts.push({ geo: new THREE.ConeGeometry(2.6 - c * 0.42, 4, 8), mat: leaf, m: M(0, 6.5 + c * 2.1, 0) });
        break;
      }
      case 'pine': {
        const leaf = mat(0x2b4a30);
        parts.push({ geo: new THREE.CylinderGeometry(0.22, 0.42, 6, 7), mat: bark, m: M(0.3, 3, 0, 1, 1, 1, 0, -0.12) });
        [[0.9, 5.4, 0, 2.2], [-0.8, 4.4, 0.4, 1.8], [0.2, 6.4, -0.3, 1.5], [1.6, 4.0, -0.5, 1.4]].forEach(([x, y, z, r]) =>
          parts.push({ geo: new THREE.CylinderGeometry(r, r * 1.1, 0.7, 9), mat: leaf, m: M(x, y, z) })
        );
        break;
      }
      case 'sakura':
      case 'plum':
      case 'maple':
      case 'ginkgo': {
        const color = kind === 'sakura' ? 0xf7c4d2 : kind === 'plum' ? 0xf9e9ee : kind === 'maple' ? 0xc9401f : 0xe8c23a;
        const leaf = mat(color);
        const s = kind === 'plum' ? 0.7 : 1;
        parts.push({ geo: new THREE.CylinderGeometry(0.22 * s, 0.4 * s, 3.4 * s, 7), mat: bark, m: M(0, 1.7 * s, 0, 1, 1, 1, 0, 0.1) });
        [[0, 4.2, 0, 1.9], [-1.3, 3.7, 0.7, 1.4], [1.4, 3.6, -0.5, 1.5], [0.4, 4.9, 0.8, 1.2], [-0.5, 4.6, -0.9, 1.2]].forEach(([x, y, z, r]) =>
          parts.push({ geo: blob(r * s), mat: leaf, m: M(x * s, y * s, z * s) })
        );
        if (kind === 'plum') {
          const pink = mat(0xe993b4);
          [[1.0, 3.4, 0.6, 0.7], [-0.9, 3.0, -0.4, 0.6]].forEach(([x, y, z, r]) => parts.push({ geo: blob(r), mat: pink, m: M(x, y, z) }));
        }
        break;
      }
      case 'camphor':
      case 'broadleaf': {
        const big = kind === 'camphor' ? 1.8 : 1;
        const leaf = mat(kind === 'camphor' ? 0x4f7d3a : 0x335c32);
        parts.push({ geo: new THREE.CylinderGeometry(0.45 * big, 0.9 * big, 5 * big, 9), mat: mat(0x5b4636), m: M(0, 2.5 * big, 0) });
        [[0, 6.5, 0, 3.2], [-2.6, 5.6, 1, 2.4], [2.6, 5.4, -0.6, 2.5], [0.8, 7.8, 1.2, 2.1], [-1, 7.2, -1.6, 2.2]].forEach(([x, y, z, r]) =>
          parts.push({ geo: blob(r * big), mat: leaf, m: M(x * big, y * big, z * big) })
        );
        break;
      }
      case 'birch': {
        parts.push({ geo: new THREE.CylinderGeometry(0.16, 0.24, 9, 7), mat: mat(0xeceae2), m: M(0, 4.5, 0) });
        const leaf = mat(0xb9c27a);
        [[0, 8.2, 0, 1.4], [-0.7, 7, 0.4, 1.1], [0.8, 6.6, -0.3, 1.0]].forEach(([x, y, z, r]) => parts.push({ geo: blob(r), mat: leaf, m: M(x, y, z) }));
        break;
      }
      case 'spruceSnow': {
        const leaf = mat(0x23402f);
        const snow = mat(0xf7f9fb);
        parts.push({ geo: new THREE.CylinderGeometry(0.2, 0.4, 3, 7), mat: bark, m: M(0, 1.5, 0) });
        for (let c = 0; c < 4; c++) {
          parts.push({ geo: new THREE.ConeGeometry(2.4 - c * 0.5, 2.8, 8), mat: leaf, m: M(0, 3 + c * 1.6, 0) });
          parts.push({ geo: new THREE.ConeGeometry(2.0 - c * 0.45, 1.2, 8), mat: snow, m: M(0, 3.9 + c * 1.6, 0) });
        }
        break;
      }
      case 'palm': {
        const trunk = mat(0x8a6f50);
        for (let k = 0; k < 6; k++) parts.push({ geo: new THREE.CylinderGeometry(0.2, 0.25, 1.4, 6), mat: trunk, m: M(k * 0.12, 0.7 + k * 1.3, 0, 1, 1, 1, 0, -0.08) });
        const frond = mat(0x3f7a35);
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          const m4 = new THREE.Matrix4().compose(
            new THREE.Vector3(0.7 + Math.cos(a) * 1.4, 8.1, Math.sin(a) * 1.4),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0.45)),
            new THREE.Vector3(1, 1, 1)
          );
          parts.push({ geo: new THREE.BoxGeometry(3.2, 0.08, 0.7), mat: frond, m: m4 });
        }
        break;
      }
      case 'bamboo': {
        const stem = mat(0x7fa253);
        const leaf = mat(0x6c9a45);
        for (let k = 0; k < 7; k++) {
          const a = k * 2.4, r = 0.6 + (k % 3) * 0.4;
          parts.push({ geo: new THREE.CylinderGeometry(0.08, 0.1, 10, 6), mat: stem, m: M(Math.cos(a) * r, 5, Math.sin(a) * r, 1, 1, 1, 0.04, 0.03) });
        }
        parts.push({ geo: blob(1.8), mat: leaf, m: M(0, 9.5, 0, 1, 1.6, 1) });
        break;
      }
      case 'hibiscus': {
        parts.push({ geo: blob(1.3), mat: mat(0x2f6b33), m: M(0, 1.1, 0, 1.2, 0.9, 1.2) });
        const red = mat(0xe0263c);
        [[0.9, 1.5, 0.4], [-0.6, 1.8, -0.5], [0.2, 1.9, 0.9], [-1, 1.2, 0.6]].forEach(([x, y, z]) =>
          parts.push({ geo: new THREE.IcosahedronGeometry(0.22, 0), mat: red, m: M(x, y, z) })
        );
        break;
      }
    }
    parts.forEach((p) => {
      p.geo.computeVertexNormals();
    });
    this.recipes.set(kind, parts);
    return parts;
  }

  /** Many trees of one kind, as instanced meshes (one draw call per part) */
  forest(kind: TreeKind, pts: [number, number, number?][], scale: [number, number] = [0.85, 1.25], groundAt?: (x: number, z: number) => number): THREE.Group {
    const g = new THREE.Group();
    if (!pts.length) return g;
    const parts = this.recipe(kind);
    const xforms = pts.map(([x, z, s]) => {
      const k = s ?? scale[0] + Math.random() * (scale[1] - scale[0]);
      return new THREE.Matrix4().compose(
        new THREE.Vector3(x, groundAt ? groundAt(x, z) : 0, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0)),
        new THREE.Vector3(k, k, k)
      );
    });
    parts.forEach((p) => {
      const im = new THREE.InstancedMesh(p.geo, p.mat, pts.length);
      xforms.forEach((x, i) => im.setMatrixAt(i, x.clone().multiply(p.m)));
      im.castShadow = true;
      im.receiveShadow = true;
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      g.add(im);
    });
    return g;
  }

  /** Scatter helper: n random points in a ring/rect, avoiding a keep-clear test */
  scatter(n: number, area: { x0: number; x1: number; z0: number; z1: number }, avoid?: (x: number, z: number) => boolean, seed = 1): [number, number][] {
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const out: [number, number][] = [];
    let guard = 0;
    while (out.length < n && guard++ < n * 30) {
      const x = area.x0 + rnd() * (area.x1 - area.x0);
      const z = area.z0 + rnd() * (area.z1 - area.z0);
      if (avoid && avoid(x, z)) continue;
      out.push([x, z]);
    }
    return out;
  }

  /** Rounded mountain / hill silhouette */
  mountain(r: number, h: number, color = 0x46663c, seed = 3): THREE.Mesh {
    const geo = new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 0.11 + seed) * Math.cos(v.z * 0.13 + seed * 2) * 0.12 + Math.sin(v.x * 0.31 + v.z * 0.27) * 0.04;
      v.y = (v.y / r) * h * (1 + n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(color));
    m.receiveShadow = true;
    return m;
  }

  /** Cliff with a falling-water ribbon, plunge pool and mist (Nachi no Taki) */
  waterfall(h: number, w: number): THREE.Group {
    const g = new THREE.Group();
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x4d5644, roughness: 1, flatShading: true });
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(w * 6, h * 1.08, w * 2.5, 10, 18, 3), cliffMat);
    const p = cliff.geometry.attributes.position;
    const amp = Math.max(0.8, w * 0.35);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const edge = Math.abs(x) / (w * 3); // ragged sides, smoother near the falling water
      p.setZ(i, p.getZ(i) + (Math.sin(y * 0.21 + x * 0.3) + Math.cos(x * 0.43 - y * 0.17)) * amp * (0.4 + edge));
      p.setX(i, x + Math.sin(y * 0.13 + x) * amp * 0.5 * edge);
    }
    cliff.geometry.computeVertexNormals();
    cliff.position.set(0, h * 0.54, -w * 1.3);
    g.add(cliff);
    // streaky falling-water texture
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 256;
    const g2 = c.getContext('2d')!;
    g2.fillStyle = '#cfe6ee';
    g2.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 90; i++) {
      g2.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(120,170,190,0.5)';
      g2.fillRect(Math.random() * 64, Math.random() * 256, 1 + Math.random() * 3, 20 + Math.random() * 60);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 6);
    const fallMat = new THREE.MeshStandardMaterial({ map: tex, color: 0xeaf6fb, transparent: true, opacity: 0.92, roughness: 0.2, emissive: 0x334a55 });
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 1), fallMat);
    fall.position.set(0, h / 2 + 0.5, 0.02);
    g.add(fall);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(w * 2.4, 24), this.m.water);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.35, w * 1.4);
    g.add(pool);
    const mistMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1 });
    for (let k = 0; k < 9; k++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(w * (0.45 + Math.random() * 0.35), 1), mistMat);
      puff.position.set((Math.random() - 0.5) * w * 2, 0.9 + Math.random() * 1.5, w * 0.8 + Math.random() * w);
      g.add(puff);
    }
    this.animated.push({ update: (t) => (tex.offset.y = (t * 1.6) % 1) });
    return g;
  }

  /** Seated Buddha (Tōdai-ji / Kamakura). Origin at base of the pedestal. */
  buddha(h: number, tone: 'patina' | 'bronze' = 'patina', halo = false): THREE.Group {
    const g = new THREE.Group();
    const m = tone === 'patina' ? this.m.patina : this.m.bronzeDark;
    const s = h / 12;
    // lotus pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(4.4 * s, 3.4 * s, 1.6 * s, 24), tone === 'patina' ? this.m.granite : m);
    ped.position.y = 0.8 * s;
    g.add(ped);
    if (tone === 'bronze') {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.9 * s, 8, 6), m);
        petal.scale.set(1, 1.4, 0.4);
        petal.position.set(Math.cos(a) * 4.2 * s, 1.6 * s, Math.sin(a) * 4.2 * s);
        petal.lookAt(0, 1.6 * s, 0);
        g.add(petal);
      }
    }
    // crossed legs
    const legs = new THREE.Mesh(new THREE.SphereGeometry(3.6 * s, 24, 14), m);
    legs.scale.set(1.15, 0.38, 0.75);
    legs.position.set(0, 2.5 * s, 0.4 * s);
    g.add(legs);
    // robe/torso via lathe
    const prof = [
      [2.6, 0], [3.0, 1.0], [3.0, 2.4], [2.7, 3.6], [2.2, 4.6], [1.0, 5.0], [0.0, 5.05],
    ].map(([r, y]) => new THREE.Vector2(r * s, y * s));
    const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), m);
    torso.scale.z = 0.72;
    torso.position.y = 2.7 * s;
    g.add(torso);
    // hands in meditation mudra
    const hands = new THREE.Mesh(new THREE.TorusGeometry(0.9 * s, 0.32 * s, 8, 16), m);
    hands.rotation.x = Math.PI / 2.4;
    hands.position.set(0, 3.4 * s, 2.0 * s);
    g.add(hands);
    // head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * s, 0.9 * s, 0.8 * s, 16), m);
    neck.position.y = 7.9 * s;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.55 * s, 24, 18), m);
    head.scale.set(1, 1.18, 1);
    head.position.y = 9.5 * s;
    g.add(head);
    const ush = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 * s, 2), m);
    ush.position.y = 10.9 * s;
    ush.scale.y = 0.75;
    g.add(ush);
    // curls (rahotsu)
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * 0.9;
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 6, 4), m);
      c.position.set(Math.cos(a) * Math.sin(b) * 1.5 * s, 9.7 * s + Math.cos(b) * 1.6 * s, Math.sin(a) * Math.sin(b) * 1.5 * s);
      g.add(c);
    }
    [-1, 1].forEach((k) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 2.1 * s, 0.6 * s), m);
      ear.position.set(k * 1.6 * s, 9.0 * s, 0);
      g.add(ear);
    });
    const urna = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 6, 4), this.m.wood.gold);
    urna.position.set(0, 9.9 * s, 1.5 * s);
    g.add(urna);
    if (halo) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2 * s, 0.35 * s, 8, 48), this.m.wood.gold);
      ring.position.set(0, 9 * s, -2.2 * s);
      g.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(5.1 * s, 48), new THREE.MeshStandardMaterial({ color: 0x8a6a2c, metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide }));
      disc.position.set(0, 9 * s, -2.3 * s);
      g.add(disc);
    }
    g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    return g;
  }

  /** Simple quadruped animals and guardian figures */
  figure(kind: 'deer' | 'komainu' | 'shisa' | 'ox' | 'rabbit' | 'dog', tone?: THREE.Material): THREE.Group {
    const g = new THREE.Group();
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    };
    if (kind === 'deer') {
      const m = mat(0x9a6b41);
      add(new THREE.SphereGeometry(0.55, 12, 8), m, 0, 1.15, 0, 1, 0.75, 1.6);
      [[-0.25, 0.55], [0.25, 0.55], [-0.25, -0.6], [0.25, -0.6]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.06, 0.05, 1.0, 6), m, x, 0.5, z));
      add(new THREE.CylinderGeometry(0.13, 0.18, 0.7, 8), m, 0, 1.6, 0.75).rotation.x = -0.5;
      add(new THREE.SphereGeometry(0.22, 10, 8), m, 0, 1.95, 0.95, 0.9, 0.9, 1.4);
      add(new THREE.SphereGeometry(0.2, 8, 6), mat(0xf2ead8), 0, 1.15, -0.85, 0.8, 0.6, 0.4);
      [-0.13, 0.13].forEach((x) => add(new THREE.ConeGeometry(0.06, 0.25, 6), m, x, 2.15, 0.9).rotation.z = x * 2);
    } else if (kind === 'komainu' || kind === 'shisa' || kind === 'dog') {
      const m = tone ?? (kind === 'shisa' ? mat(0xc0603f) : this.m.granite);
      add(new THREE.BoxGeometry(1.4, 0.5, 1.4), this.m.granite, 0, 0.25, 0);
      add(new THREE.SphereGeometry(0.55, 12, 8), m, 0, 1.05, -0.1, 1, 1.15, 1.1);
      add(new THREE.SphereGeometry(kind === 'shisa' ? 0.6 : 0.48, 12, 10), m, 0, 1.85, 0.25);
      add(new THREE.TorusGeometry(kind === 'shisa' ? 0.55 : 0.45, 0.15, 6, 14), m, 0, 1.85, 0.05);
      add(new THREE.BoxGeometry(0.5, 0.22, 0.3), mat(kind === 'shisa' ? 0x7a2a1a : 0x6c6c6a), 0, 1.6, 0.68);
      [-0.3, 0.3].forEach((x) => add(new THREE.CylinderGeometry(0.13, 0.15, 0.7, 6), m, x, 0.85, 0.42));
    } else if (kind === 'ox') {
      const m = tone ?? this.m.bronzeDark;
      add(new THREE.BoxGeometry(1.4, 0.3, 2.4), this.m.granite, 0, 0.15, 0);
      add(new THREE.SphereGeometry(0.7, 14, 10), m, 0, 0.75, -0.1, 0.95, 0.65, 1.55);
      add(new THREE.SphereGeometry(0.38, 12, 10), m, 0, 0.85, 1.05, 0.9, 0.9, 1.15);
      [-0.32, 0.32].forEach((x) => add(new THREE.ConeGeometry(0.07, 0.4, 6), m, x, 1.15, 1.0).rotation.z = -x * 3);
    } else if (kind === 'rabbit') {
      const m = tone ?? this.m.wood.white;
      add(new THREE.SphereGeometry(0.28, 10, 8), m, 0, 0.28, 0, 1, 0.9, 1.3);
      add(new THREE.SphereGeometry(0.17, 10, 8), m, 0, 0.5, 0.28);
      [-0.06, 0.06].forEach((x) => add(new THREE.CapsuleGeometry(0.04, 0.25, 4, 6), m, x, 0.78, 0.22));
    }
    return g;
  }

  /** Row of small Nakamise-style shops along z */
  shopRow(len: number, facing: 1 | -1): THREE.Group {
    const g = new THREE.Group();
    const n = Math.floor(len / 4.2);
    const awnings = [0xc8261b, 0x2c4a7a, 0xd4a017, 0x3c6e47, 0xc8261b, 0x7a3b6d];
    const signs = ['Hương', 'Nến', 'Hoa', 'Quả', 'Vàng mã', 'Trà', 'Bánh', 'Lộc'];
    for (let i = 0; i < n; i++) {
      const z = -len / 2 + 2.1 + i * 4.2;
      const shop = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.4, 4.2), this.m.plaster);
      body.position.y = 1.7;
      shop.add(body);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshStandardMaterial({ color: 0x6b4a2c }));
      front.position.set(2.01, 1.2, 0);
      front.rotation.y = Math.PI / 2;
      shop.add(front);
      const aw = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 4.1), mat(awnings[i % awnings.length]));
      aw.position.set(2.5, 2.55, 0);
      aw.rotation.z = -0.35;
      shop.add(aw);
      const tex = kanjiTexture(signs[i % signs.length], '#f7efe0', '#7a1b10', 512, 128, false);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.7), new THREE.MeshStandardMaterial({ map: tex }));
      sign.position.set(2.02, 3.05, 0);
      sign.rotation.y = Math.PI / 2;
      shop.add(sign);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 4.4), this.m.roof.tile);
      roof.position.y = 3.55;
      shop.add(roof);
      shop.position.z = z;
      if (facing < 0) shop.rotation.y = Math.PI;
      g.add(shop);
    }
    return g;
  }

  /** Wall of decorated sake barrels (kazaridaru), as at Meiji Jingū */
  barrels(cols: number, rows: number): THREE.Group {
    const g = new THREE.Group();
    const names = ['Rượu', 'Lộc', 'Phúc', 'An', 'Khang', 'Thọ', 'Tài', 'Hòa', 'Bình', 'Vui'];
    const colors = ['#f6f1e6', '#1d3a6b', '#b8261b', '#f6f1e6', '#2a2a2a'];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(cols * 1.3 + 0.6, 0.6, 1.6), this.m.wood.darkWood));
    (g.children[0] as THREE.Mesh).position.y = 0.3;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const tex = kanjiTexture(names[(r * cols + c) % names.length], colors[(r + c) % colors.length], (r + c) % colors.length === 0 || (r + c) % colors.length === 3 ? '#1a1a1a' : '#f6f1e6', 256, 256);
        const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 18), [this.m.rope, this.m.wood.cypress, this.m.wood.cypress]);
        b.rotation.x = Math.PI / 2;
        b.position.set(-((cols - 1) * 1.3) / 2 + c * 1.3, 1.25 + r * 1.25, 0);
        g.add(b);
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.6, 18), side);
        face.position.set(b.position.x, b.position.y, 0.61);
        g.add(face);
      }
    return g;
  }
}
