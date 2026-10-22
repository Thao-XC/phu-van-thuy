import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { KitMaterials, RoofTone, WoodTone } from './materials';
import { kanjiTexture } from './materials';

export type RoofKind = 'hip' | 'gable' | 'irimoya' | 'pyramid' | 'nagare';

export interface RoofOpts {
  w: number;
  d: number;
  h?: number;
  kind?: RoofKind;
  tone?: RoofTone;
  /** >1 = concave Japanese profile (shallow at the eaves, steep at the ridge) */
  curve?: number;
  /** upturn of the corners (soribana) */
  lift?: number;
  thick?: number;
  seg?: number;
  ridge?: boolean;
  /** gable infill material for gable/irimoya ends */
  gableTone?: WoodTone;
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

export class Architecture {
  constructor(public m: KitMaterials) {}

  /* ------------------------------------------------------------------ */
  /* Roofs: heightfield over the footprint, with a real concave profile  */
  /* ------------------------------------------------------------------ */
  roof(o: RoofOpts): THREE.Group {
    const { w, d } = o;
    const kind = o.kind ?? 'irimoya';
    const h = o.h ?? Math.min(w, d) * 0.48;
    const curve = o.curve ?? 1.55;
    const lift = o.lift ?? Math.min(w, d) * 0.035;
    const thick = o.thick ?? 0.35;
    const n = o.seg ?? 36;
    const hd = Math.min(w, d) / 2;
    const f = (t: number) => Math.pow(Math.min(1, Math.max(0, t)), curve);

    const heightAt = (x: number, z: number) => {
      const ex = w / 2 - Math.abs(x);
      const ez = d / 2 - Math.abs(z);
      let y: number;
      if (kind === 'gable') y = h * f(ez / (d / 2));
      else if (kind === 'nagare') {
        // asymmetric: long sweeping front slope (+z), short back slope
        // ridge sits behind centre so the front slope is long and sweeping
        const zr = -d * 0.18;
        const t = z >= zr ? (d / 2 - z) / (d / 2 - zr) : (z + d / 2) / (zr + d / 2);
        y = h * f(t);
      } else if (kind === 'irimoya') {
        const tg = ez / (d / 2);
        const th = Math.min(ex * ((d / 2) / Math.max(0.1, d * 0.42)), ez) / (d / 2);
        const L = h * f(th);
        y = L < h * 0.5 ? L : h * f(tg);
      } else {
        // hip / pyramid
        y = h * f(Math.min(ex, ez) / hd);
      }
      // corner upturn
      const bx = Math.max(0, 1 - ex / (w * 0.2));
      const bz = Math.max(0, 1 - ez / (d * 0.2));
      y += lift * bx * bx * bz * bz * 4;
      return y;
    };

    const top: number[] = [];
    const uv: number[] = [];
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const x = -w / 2 + (w * i) / n;
        const z = -d / 2 + (d * j) / n;
        top.push(x, heightAt(x, z), z);
        uv.push(i / n, j / n);
      }
    }
    const idx = (i: number, j: number) => i * (n + 1) + j;
    const mk = (offset: number, flip: boolean) => {
      const g = new THREE.BufferGeometry();
      const pos = top.slice();
      for (let k = 1; k < pos.length; k += 3) pos[k] -= offset;
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      const ind: number[] = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const a = idx(i, j), b = idx(i + 1, j), c = idx(i + 1, j + 1), e = idx(i, j + 1);
          if (flip) ind.push(a, b, c, a, c, e);
          else ind.push(a, c, b, a, e, c);
        }
      g.setIndex(ind);
      g.computeVertexNormals();
      return g;
    };
    // perimeter fascia (thickness edge)
    const ring: [number, number][] = [];
    for (let j = 0; j <= n; j++) ring.push([0, j]);
    for (let i = 1; i <= n; i++) ring.push([i, n]);
    for (let j = n - 1; j >= 0; j--) ring.push([n, j]);
    for (let i = n - 1; i >= 1; i--) ring.push([i, 0]);
    const fp: number[] = [];
    ring.forEach(([i, j], k) => {
      const [i2, j2] = ring[(k + 1) % ring.length];
      const p = idx(i, j) * 3, q = idx(i2, j2) * 3;
      const P = [top[p], top[p + 1], top[p + 2]], Q = [top[q], top[q + 1], top[q + 2]];
      fp.push(...P, ...Q, Q[0], Q[1] - thick, Q[2], ...P, Q[0], Q[1] - thick, Q[2], P[0], P[1] - thick, P[2]);
    });
    const fasc = new THREE.BufferGeometry();
    fasc.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    fasc.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((fp.length / 3) * 2).fill(0), 2));
    fasc.computeVertexNormals();

    const group = new THREE.Group();
    const tone = this.m.roof[o.tone ?? 'tile'];
    const topMesh = new THREE.Mesh(mergeGeometries([mk(0, false)]), tone);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);
    const under = new THREE.Mesh(mk(thick, true), this.m.wood.darkWood);
    group.add(under);
    const edge = new THREE.Mesh(fasc, tone === this.m.roof.thatch ? tone : this.m.wood.darkWood);
    edge.material.side = THREE.DoubleSide;
    group.add(edge);

    // ridge
    if (o.ridge !== false && kind !== 'pyramid') {
      const rl = kind === 'hip' ? Math.max(0.6, w - d) : kind === 'irimoya' ? w * 0.62 : w * 1.02;
      const rz = kind === 'nagare' ? -d * 0.18 : 0;
      const ridgeMat = o.tone === 'thatch' ? this.m.roof.darkCopper : o.tone === 'redtile' ? this.m.plaster : this.m.wood.black;
      const r = box(rl, h * 0.07 + 0.25, 0.7, ridgeMat, 0, heightAt(0, rz) + 0.05, rz);
      group.add(r);
    }
    // gable infill triangles
    if ((kind === 'gable' || kind === 'irimoya' || kind === 'nagare') && o.gableTone !== undefined) {
      const xg = kind === 'irimoya' ? w * 0.31 : w / 2 - 0.4;
      const pts: THREE.Vector2[] = [];
      const zs = 16;
      for (let k = 0; k <= zs; k++) {
        const z = -d / 2 + (d * k) / zs;
        pts.push(new THREE.Vector2(z, Math.max(0, heightAt(xg, z) - thick - (kind === 'irimoya' ? h * 0.5 : 0))));
      }
      const shape = new THREE.Shape();
      shape.moveTo(pts[0].x, 0);
      pts.forEach((p) => shape.lineTo(p.x, p.y));
      shape.lineTo(pts[pts.length - 1].x, 0);
      const sg = new THREE.ShapeGeometry(shape);
      [-1, 1].forEach((s) => {
        const tri = new THREE.Mesh(sg, this.m.wood[o.gableTone!]);
        tri.rotation.y = Math.PI / 2;
        tri.position.set(s * xg, kind === 'irimoya' ? h * 0.5 - 0.1 : 0, 0);
        (tri.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
        group.add(tri);
      });
    }
    group.userData.heightAt = heightAt;
    group.userData.h = h;
    return group;
  }

  /* ------------------------------------------------------------------ */
  /* Generic hall: podium, pillars, walls, bracket band, roof            */
  /* ------------------------------------------------------------------ */
  hall(o: {
    w: number;
    d: number;
    wallH?: number;
    podium?: number;
    raised?: number;
    pillar?: WoodTone;
    wall?: WoodTone | 'plaster' | 'shoji';
    front?: 'shoji' | 'lattice' | 'open' | 'doors';
    roof?: Partial<RoofOpts>;
    overhang?: number;
    veranda?: boolean;
    railing?: WoodTone;
    mokoshi?: boolean; // extra skirt roof (Daibutsuden, Hondo, Kinkaku)
    /** walls only on three sides plus a framed doorway, so what's inside is visible */
    hollow?: { door: number };
    bracket?: WoodTone;
  }): THREE.Group {
    const g = new THREE.Group();
    const wallH = o.wallH ?? 5;
    const pod = o.podium ?? 0.8;
    const raised = o.raised ?? 0;
    const pillarM = this.m.wood[o.pillar ?? 'vermilion'];
    const wallM = o.wall === 'plaster' ? this.m.plaster : o.wall === 'shoji' ? this.m.shoji : this.m.wood[o.wall ?? 'white'];
    const over = o.overhang ?? Math.max(1.6, Math.min(o.w, o.d) * 0.2);

    if (pod > 0) g.add(box(o.w + 2.2, pod, o.d + 2.2, this.m.granite, 0, pod / 2, 0));
    const y0 = pod + raised;
    if (raised > 0) {
      const cols = Math.max(2, Math.round(o.w / 2.6));
      const rows = Math.max(2, Math.round(o.d / 2.6));
      for (let i = 0; i <= cols; i++)
        for (let j = 0; j <= rows; j++)
          g.add(cyl(0.22, 0.24, raised, pillarM, -o.w / 2 + (o.w * i) / cols, pod + raised / 2, -o.d / 2 + (o.d * j) / rows, 8));
    }
    // floor / veranda
    const vw = o.veranda === false ? 0 : 1.6;
    g.add(box(o.w + vw, 0.3, o.d + vw, this.m.wood.darkWood, 0, y0 + 0.15, 0));
    if (o.veranda !== false && o.railing) {
      const rm = this.m.wood[o.railing];
      g.add(box(o.w + vw, 0.12, 0.12, rm, 0, y0 + 0.95, (o.d + vw) / 2));
      g.add(box(0.12, 0.12, o.d + vw, rm, (o.w + vw) / 2, y0 + 0.95, 0));
      g.add(box(0.12, 0.12, o.d + vw, rm, -(o.w + vw) / 2, y0 + 0.95, 0));
    }
    // pillars
    const nx = Math.max(2, Math.round(o.w / 3));
    const nz = Math.max(2, Math.round(o.d / 3));
    for (let i = 0; i <= nx; i++) {
      const x = -o.w / 2 + (o.w * i) / nx;
      [o.d / 2, -o.d / 2].forEach((z) => g.add(cyl(0.26, 0.28, wallH, pillarM, x, y0 + 0.3 + wallH / 2, z, 10)));
    }
    for (let j = 1; j < nz; j++) {
      const z = -o.d / 2 + (o.d * j) / nz;
      [o.w / 2, -o.w / 2].forEach((x) => g.add(cyl(0.26, 0.28, wallH, pillarM, x, y0 + 0.3 + wallH / 2, z, 10)));
    }
    // walls (inset)
    const wy = y0 + 0.3 + wallH / 2;
    if (o.hollow) {
      const t = 0.35;
      g.add(box(o.w - 0.4, wallH, t, wallM, 0, wy, -o.d / 2 + 0.2));
      g.add(box(t, wallH, o.d - 0.4, wallM, -o.w / 2 + 0.2, wy, 0));
      g.add(box(t, wallH, o.d - 0.4, wallM, o.w / 2 - 0.2, wy, 0));
      const side = (o.w - 0.4 - o.hollow.door) / 2;
      [-1, 1].forEach((s) => g.add(box(side, wallH, t, wallM, s * (o.hollow!.door / 2 + side / 2), wy, o.d / 2 - 0.2)));
      g.add(box(o.hollow.door, wallH * 0.25, t, wallM, 0, y0 + 0.3 + wallH * 0.875, o.d / 2 - 0.2));
      // dim interior floor and ceiling
      g.add(box(o.w - 1, 0.1, o.d - 1, this.m.wood.darkWood, 0, y0 + 0.32, 0));
      g.add(box(o.w - 0.4, 0.2, o.d - 0.4, this.m.interior, 0, y0 + 0.3 + wallH - 0.1, 0));
    } else g.add(box(o.w - 0.4, wallH, o.d - 0.4, wallM, 0, wy, -0.05));
    // front facade
    const front = o.hollow ? 'none' : o.front ?? 'shoji';
    if (front === 'none') {
      // doorway only
    } else if (front === 'open') {
      g.add(box(o.w * 0.55, wallH * 0.8, 0.1, this.m.interior, 0, y0 + 0.3 + wallH * 0.4, o.d / 2 - 0.16));
    } else {
      const fm = front === 'shoji' ? this.m.shoji : front === 'doors' ? this.m.wood.darkWood : this.m.wood.darkWood;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(o.w - 1.2, wallH * 0.82), fm);
      panel.position.set(0, y0 + 0.3 + wallH * 0.45, o.d / 2 - 0.18);
      g.add(panel);
      if (front === 'lattice') {
        for (let k = 0; k < Math.round(o.w * 1.6); k++)
          g.add(box(0.06, wallH * 0.8, 0.06, pillarM, -o.w / 2 + 0.6 + k * ((o.w - 1.2) / Math.round(o.w * 1.6)), y0 + 0.3 + wallH * 0.45, o.d / 2 - 0.12));
      }
    }
    // nuki tie beams & bracket band
    const topY = y0 + 0.3 + wallH;
    g.add(box(o.w + 0.4, 0.3, 0.3, pillarM, 0, topY - 0.9, o.d / 2));
    g.add(box(o.w + 0.8, 0.55, o.d + 0.8, this.m.wood[o.bracket ?? 'darkWood'], 0, topY + 0.25, 0));
    g.add(box(o.w + 1.4, 0.35, o.d + 1.4, this.m.wood[o.bracket ?? 'darkWood'], 0, topY + 0.65, 0));

    if (o.mokoshi) {
      const sk = this.roof({ w: o.w + over * 2.2, d: o.d + over * 2.2, h: 1.6, kind: 'hip', tone: o.roof?.tone, curve: 1.2, lift: 0.3 });
      sk.position.y = y0 + 0.3 + wallH * 0.48;
      g.add(sk);
    }
    const r = this.roof({ w: o.w + over * 2, d: o.d + over * 2, kind: 'irimoya', tone: 'tile', gableTone: o.pillar === 'cypress' ? 'cypress' : 'darkWood', ...o.roof });
    r.position.y = topY + 0.8;
    g.add(r);
    g.userData.floorY = y0 + 0.3;
    g.userData.eaveY = topY + 0.8;
    g.userData.ridgeY = topY + 0.8 + (r.userData.h as number);
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Shinto: chigi + katsuogi ridge ornaments                           */
  /* ------------------------------------------------------------------ */
  chigiKatsuogi(roof: THREE.Group, len: number, n = 6, tone: WoodTone = 'cypress', tipGold = true): THREE.Group {
    const g = new THREE.Group();
    const y = roof.userData.h as number;
    const m = this.m.wood[tone];
    [-len / 2, len / 2].forEach((x) => {
      [0.5, -0.5].forEach((s) => {
        const c = box(0.22, 3.2, 0.5, m, x, y + 1.0, 0);
        c.rotation.z = s * 0.55;
        c.position.x += s * 0.6;
        g.add(c);
      });
    });
    for (let k = 0; k < n; k++) {
      const x = -len / 2 + 0.9 + ((len - 1.8) * k) / Math.max(1, n - 1);
      const k1 = cyl(0.28, 0.28, 1.4, m, x, y + 0.55, 0, 10);
      k1.rotation.x = Math.PI / 2;
      g.add(k1);
      if (tipGold) {
        [0.72, -0.72].forEach((z) => {
          const cap = cyl(0.3, 0.3, 0.08, this.m.wood.gold, x, y + 0.55, z, 10);
          cap.rotation.x = Math.PI / 2;
          g.add(cap);
        });
      }
    }
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Torii                                                              */
  /* ------------------------------------------------------------------ */
  torii(o: { style?: 'myojin' | 'shinmei' | 'ryobu'; tone?: WoodTone; h?: number; span?: number; plaque?: string }): THREE.Group {
    const g = new THREE.Group();
    const h = o.h ?? 8;
    const span = o.span ?? h * 0.85;
    const style = o.style ?? 'myojin';
    const m = this.m.wood[o.tone ?? 'vermilion'];
    const capM = o.tone === 'vermilion' || o.tone === undefined ? this.m.wood.black : m;
    const r = h * 0.045;
    const lean = style === 'shinmei' ? 0 : 0.035;
    [-1, 1].forEach((s) => {
      const p = cyl(r * 0.9, r * 1.05, h, m, (s * span) / 2, h / 2, 0, 16);
      p.rotation.z = -s * lean;
      g.add(p);
      if (style !== 'shinmei') g.add(cyl(r * 1.4, r * 1.5, h * 0.06, o.tone === 'vermilion' || !o.tone ? this.m.wood.black : m, (s * span) / 2, h * 0.03, 0, 16));
    });
    // nuki
    const nukiLen = style === 'shinmei' ? span + r * 2 : span + h * 0.28;
    g.add(box(nukiLen, h * 0.06, r * 1.3, m, 0, h * 0.72, 0));
    if (style === 'shinmei') {
      const k = cyl(r * 0.95, r * 0.95, span + h * 0.3, m, 0, h + r * 0.5, 0, 14);
      k.rotation.z = Math.PI / 2;
      g.add(k);
    } else {
      // shimaki + curved kasagi
      g.add(box(span + h * 0.32, h * 0.06, r * 1.6, m, 0, h * 0.93, 0));
      const L = span + h * 0.5;
      const seg = 9;
      for (let k = 0; k < seg; k++) {
        const t0 = -1 + (2 * k) / seg, t1 = -1 + (2 * (k + 1)) / seg;
        const x0 = (t0 * L) / 2, x1 = (t1 * L) / 2;
        const y0 = h * 1.0 + Math.pow(Math.abs(t0), 3) * h * 0.08;
        const y1 = h * 1.0 + Math.pow(Math.abs(t1), 3) * h * 0.08;
        const len = Math.hypot(x1 - x0, y1 - y0);
        const b = box(len + 0.05, h * 0.075, r * 2.1, capM, (x0 + x1) / 2, (y0 + y1) / 2, 0);
        b.rotation.z = Math.atan2(y1 - y0, x1 - x0);
        g.add(b);
      }
      // gakuzuka strut & plaque
      g.add(box(r * 1.2, h * 0.2, r * 1.2, m, 0, h * 0.83, 0));
      if (o.plaque) {
        const tex = kanjiTexture(o.plaque, '#1c1a1a', '#f2c14e', 128, 256);
        const pl = new THREE.Mesh(new THREE.BoxGeometry(h * 0.1, h * 0.17, r * 0.6), [
          this.m.wood.black, this.m.wood.black, this.m.wood.black, this.m.wood.black,
          new THREE.MeshStandardMaterial({ map: tex }), this.m.wood.black,
        ]);
        pl.position.set(0, h * 0.83, r * 0.75);
        g.add(pl);
      }
    }
    if (style === 'ryobu') {
      // Itsukushima: auxiliary legs front and back of each pillar
      [-1, 1].forEach((s) => {
        [-1, 1].forEach((f) => {
          const x = (s * span) / 2;
          const z = f * h * 0.22;
          g.add(cyl(r * 0.55, r * 0.6, h * 0.42, m, x, h * 0.21, z, 10));
          g.add(box(r * 1.4, h * 0.035, Math.abs(z) + r, capM, x, h * 0.44, z / 2));
          g.add(box(r * 1.6, h * 0.03, r * 1.6, capM, x, h * 0.42, z));
        });
        g.add(box(r * 0.8, h * 0.04, h * 0.44, m, (s * span) / 2, h * 0.3, 0));
      });
    }
    return g;
  }

  /** Many small torii (Senbon Torii) as two instanced meshes. Each matrix places one gate. */
  toriiInstances(xforms: THREE.Matrix4[], h = 3.2, span = 2.6): THREE.Group {
    const g = new THREE.Group();
    const r = 0.13;
    const red = mergeGeometries([
      new THREE.CylinderGeometry(r, r * 1.1, h, 10).translate(-span / 2, h / 2, 0),
      new THREE.CylinderGeometry(r, r * 1.1, h, 10).translate(span / 2, h / 2, 0),
      new THREE.BoxGeometry(span + 0.5, 0.18, 0.18).translate(0, h * 0.78, 0),
    ]);
    const black = mergeGeometries([
      new THREE.BoxGeometry(span + 1.0, 0.26, 0.36).translate(0, h + 0.13, 0),
      new THREE.CylinderGeometry(r * 1.3, r * 1.4, 0.35, 10).translate(-span / 2, 0.17, 0),
      new THREE.CylinderGeometry(r * 1.3, r * 1.4, 0.35, 10).translate(span / 2, 0.17, 0),
    ]);
    [
      [red, this.m.wood.vermilion],
      [black, this.m.wood.black],
    ].forEach(([geo, mat]) => {
      const im = new THREE.InstancedMesh(geo as THREE.BufferGeometry, mat as THREE.Material, xforms.length);
      xforms.forEach((x, i) => im.setMatrixAt(i, x));
      im.castShadow = true;
      im.computeBoundingSphere();
      g.add(im);
    });
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Gates: rōmon / sanmon / nandaimon / kaminarimon                     */
  /* ------------------------------------------------------------------ */
  gate(o: {
    w: number;
    d?: number;
    h?: number;
    stories?: 1 | 2;
    pillar?: WoodTone;
    wall?: WoodTone | 'plaster';
    roofTone?: RoofTone;
    lantern?: { text: string; color?: string; size?: number };
    nio?: boolean;
    plaque?: string;
    bracket?: WoodTone;
  }): THREE.Group {
    const g = new THREE.Group();
    const w = o.w;
    const d = o.d ?? w * 0.45;
    const h = o.h ?? w * 0.5;
    const pm = this.m.wood[o.pillar ?? 'vermilion'];
    const wm = o.wall === 'plaster' ? this.m.plaster : this.m.wood[o.wall ?? 'white'];
    const bays = 3;
    g.add(box(w + 1.5, 0.5, d + 1.5, this.m.granite, 0, 0.25, 0));
    for (let i = 0; i <= bays; i++) {
      const x = -w / 2 + (w * i) / bays;
      [-d / 2, 0, d / 2].forEach((z) => g.add(cyl(0.3, 0.32, h, pm, x, 0.5 + h / 2, z, 12)));
    }
    // side bays walled (statue niches)
    [-1, 1].forEach((s) => {
      const x = (s * w) / 3;
      g.add(box(w / 3 - 0.5, h * 0.9, 0.2, wm, x, 0.5 + h * 0.45, -0.1));
      if (o.nio) {
        const fig = new THREE.Group();
        fig.add(cyl(0.6, 0.8, h * 0.62, s < 0 ? this.m.wood.vermilion : this.m.wood.darkWood, 0, h * 0.31, 0, 8));
        fig.add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), s < 0 ? this.m.wood.vermilion : this.m.wood.darkWood));
        fig.children[1].position.y = h * 0.68;
        fig.position.set(x, 0.5, d / 2 - 0.9);
        g.add(fig);
      }
    });
    const topY = 0.5 + h;
    g.add(box(w + 0.6, 0.5, d + 0.6, this.m.wood[o.bracket ?? 'darkWood'], 0, topY + 0.25, 0));
    if (o.stories === 2) {
      const lr = this.roof({ w: w + 3, d: d + 3, h: 1.4, kind: 'hip', tone: o.roofTone, curve: 1.3, lift: 0.35, ridge: false });
      lr.position.y = topY + 0.5;
      g.add(lr);
      const up = this.hall({
        w: w * 0.9, d: d * 0.85, wallH: h * 0.62, podium: 0, pillar: o.pillar ?? 'vermilion',
        wall: o.wall === 'plaster' ? 'plaster' : o.wall ?? 'white', front: 'lattice', railing: o.pillar ?? 'vermilion',
        roof: { tone: o.roofTone, kind: 'irimoya' }, overhang: 2.2, bracket: o.bracket,
      });
      up.position.y = topY + 1.2;
      g.add(up);
    } else {
      const r = this.roof({ w: w + 3.2, d: d + 3.2, kind: 'irimoya', tone: o.roofTone, gableTone: o.pillar ?? 'vermilion' });
      r.position.y = topY + 0.6;
      g.add(r);
    }
    if (o.plaque) {
      const tex = kanjiTexture(o.plaque, '#1c1a1a', '#f2c14e', 512, 160, false);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.32, w * 0.1), new THREE.MeshStandardMaterial({ map: tex }));
      pl.position.set(0, topY - 0.6, d / 2 + 0.2);
      g.add(pl);
    }
    if (o.lantern) g.add(this.chochin(o.lantern.text, o.lantern.color ?? '#c8261b', o.lantern.size ?? h * 0.42, 0, topY - (o.lantern.size ?? h * 0.42) / 2 - 0.3, 0));
    return g;
  }

  /** Giant paper lantern (chōchin) with kanji, e.g. Kaminarimon's 雷門 */
  chochin(text: string, color: string, size: number, x: number, y: number, z: number): THREE.Group {
    const g = new THREE.Group();
    const tex = kanjiTexture(text, color, '#141010', 512, 512);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      pts.push(new THREE.Vector2(size * 0.42 * Math.sin(Math.PI * (0.08 + t * 0.84)), -size / 2 + t * size));
    }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0x2a0503 }));
    g.add(body);
    g.add(cyl(size * 0.2, size * 0.2, size * 0.1, this.m.wood.black, 0, size / 2 + size * 0.03, 0, 24));
    g.add(cyl(size * 0.2, size * 0.2, size * 0.1, this.m.wood.black, 0, -size / 2 - size * 0.03, 0, 24));
    g.position.set(x, y, z);
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Pagodas                                                            */
  /* ------------------------------------------------------------------ */
  pagoda(o: { stories: number; w: number; storyH?: number; tone?: WoodTone; roofTone?: RoofTone; podium?: number }): THREE.Group {
    const g = new THREE.Group();
    const pod = o.podium ?? 1.2;
    const sh = o.storyH ?? o.w * 0.42;
    const tone = this.m.wood[o.tone ?? 'vermilion'];
    g.add(box(o.w + 3, pod, o.w + 3, this.m.granite, 0, pod / 2, 0));
    let y = pod;
    for (let s = 0; s < o.stories; s++) {
      const k = 1 - s * (0.32 / Math.max(1, o.stories - 1));
      const w = o.w * k;
      g.add(box(w, sh, w, tone, 0, y + sh / 2, 0));
      g.add(box(w * 0.82, sh * 0.6, w + 0.05, this.m.plaster, 0, y + sh * 0.5, 0));
      g.add(box(w + 0.05, sh * 0.6, w * 0.82, this.m.plaster, 0, y + sh * 0.5, 0));
      g.add(box(w + 0.6, 0.45, w + 0.6, this.m.wood[o.tone === 'vermilion' || !o.tone ? 'vermilion' : 'darkWood'], 0, y + sh + 0.2, 0));
      const r = this.roof({ w: w * 1.75, d: w * 1.75, h: w * 0.28, kind: 'pyramid', tone: o.roofTone ?? 'tile', curve: 1.25, lift: w * 0.07, thick: 0.4 });
      r.position.y = y + sh + 0.45;
      g.add(r);
      y += sh + 0.45 + w * 0.12;
    }
    g.add(this.sorin(y + o.w * 0.1, o.w * 0.9));
    g.userData.topY = y;
    return g;
  }

  /** Bronze spire with nine rings and a jewel */
  sorin(y: number, h: number): THREE.Group {
    const g = new THREE.Group();
    const m = this.m.bronzeDark;
    g.add(box(1.2, 0.5, 1.2, m, 0, y + 0.25, 0));
    g.add(cyl(0.12, 0.18, h, m, 0, y + h / 2, 0, 10));
    for (let r = 0; r < 9; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5 - r * 0.02, 0.07, 6, 16), m);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y + h * 0.25 + r * h * 0.06;
      g.add(ring);
    }
    const j = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), this.m.wood.gold);
    j.position.y = y + h + 0.2;
    g.add(j);
    return g;
  }

  /** Tahōtō (Kōyasan Konpon Daitō): square base, white dome, square top roof */
  tahoto(w: number, tone: WoodTone = 'vermilion'): THREE.Group {
    const g = new THREE.Group();
    const m = this.m.wood[tone];
    g.add(box(w + 3, 1.2, w + 3, this.m.granite, 0, 0.6, 0));
    g.add(box(w, w * 0.42, w, m, 0, 1.2 + w * 0.21, 0));
    const lr = this.roof({ w: w * 1.5, d: w * 1.5, h: w * 0.12, kind: 'pyramid', tone: 'tile', curve: 1.2, lift: w * 0.04 });
    lr.position.y = 1.2 + w * 0.42;
    g.add(lr);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(w * 0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.m.plaster);
    dome.position.y = 1.2 + w * 0.5;
    dome.scale.y = 0.55;
    g.add(dome);
    g.add(cyl(w * 0.3, w * 0.33, w * 0.32, m, 0, 1.2 + w * 0.68, 0, 32));
    g.add(box(w * 0.75, 0.6, w * 0.75, m, 0, 1.2 + w * 0.86, 0));
    const ur = this.roof({ w: w * 1.45, d: w * 1.45, h: w * 0.26, kind: 'pyramid', tone: 'tile', curve: 1.3, lift: w * 0.06 });
    ur.position.y = 1.2 + w * 0.9;
    g.add(ur);
    g.add(this.sorin(1.2 + w * 1.15, w * 0.55));
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Corridors, fences, walls, stairs, bridges                          */
  /* ------------------------------------------------------------------ */
  corridor(len: number, o: { w?: number; h?: number; pillar?: WoodTone; roofTone?: RoofTone; floor?: boolean; stilts?: number } = {}): THREE.Group {
    const g = new THREE.Group();
    const w = o.w ?? 3.2;
    const h = o.h ?? 3;
    const pm = this.m.wood[o.pillar ?? 'vermilion'];
    const st = o.stilts ?? 0;
    const n = Math.max(1, Math.round(len / 3));
    if (o.floor !== false) g.add(box(w + 0.4, 0.25, len, this.m.wood.darkWood, 0, st + 0.12, 0));
    for (let i = 0; i <= n; i++) {
      const z = -len / 2 + (len * i) / n;
      [-w / 2, w / 2].forEach((x) => {
        g.add(cyl(0.16, 0.17, h, pm, x, st + 0.25 + h / 2, z, 8));
        if (st > 0) g.add(cyl(0.2, 0.2, st + 1, pm, x, st / 2 - 0.5, z, 8));
      });
    }
    [-w / 2, w / 2].forEach((x) => g.add(box(0.2, 0.25, len, pm, x, st + 0.25 + h, 0)));
    const r = this.roof({ w: len + 0.6, d: w + 1.6, h: 1.1, kind: 'gable', tone: o.roofTone ?? 'tile', curve: 1.15, lift: 0.05, seg: 12 });
    r.rotation.y = Math.PI / 2;
    r.position.y = st + 0.35 + h;
    g.add(r);
    return g;
  }

  fence(len: number, h: number, tone: WoodTone = 'cypress', solid = false): THREE.Group {
    const g = new THREE.Group();
    const m = this.m.wood[tone];
    if (solid) {
      g.add(box(len, h, 0.18, m, 0, h / 2, 0));
      g.add(box(len + 0.2, 0.18, 0.4, m, 0, h, 0));
      return g;
    }
    const n = Math.round(len / 0.45);
    for (let i = 0; i <= n; i++) g.add(box(0.18, h, 0.14, m, -len / 2 + (len * i) / n, h / 2, 0));
    g.add(box(len, 0.14, 0.2, m, 0, h * 0.85, 0));
    g.add(box(len, 0.14, 0.2, m, 0, h * 0.25, 0));
    return g;
  }

  /** Tsuiji-bei: plaster wall on stone base with a tiled cap (Nobunaga-bei etc.) */
  tileWall(len: number, h = 2.6, plaster: 'white' | 'ochre' = 'white'): THREE.Group {
    const g = new THREE.Group();
    g.add(box(len, 0.5, 1.1, this.m.granite, 0, 0.25, 0));
    const pm = plaster === 'ochre' ? new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.95 }) : this.m.plaster;
    g.add(box(len, h, 0.8, pm, 0, 0.5 + h / 2, 0));
    if (plaster === 'ochre') for (let k = 1; k < 5; k++) g.add(box(len, 0.08, 0.84, this.m.roof.tile, 0, 0.5 + (h * k) / 5, 0));
    const r = this.roof({ w: len + 0.4, d: 1.8, h: 0.55, kind: 'gable', tone: 'tile', curve: 1.1, lift: 0, seg: 8 });
    r.position.y = 0.5 + h;
    g.add(r);
    return g;
  }

  /** Straight flight of stone steps rising toward -z */
  stairs(o: { w: number; z0: number; z1: number; y0: number; y1: number; x?: number; tone?: 'stone' | 'wood' }): THREE.Group {
    const g = new THREE.Group();
    const len = Math.abs(o.z1 - o.z0);
    const rise = o.y1 - o.y0;
    const n = Math.max(2, Math.round(Math.abs(rise) / 0.22));
    const run = len / n;
    const m = o.tone === 'wood' ? this.m.wood.darkWood : this.m.granite;
    const dir = o.z1 < o.z0 ? -1 : 1;
    for (let i = 0; i < n; i++) {
      const top = o.y0 + (rise * (i + 1)) / n;
      const h = Math.max(0.2, top - Math.min(o.y0, o.y1) + 0.1);
      g.add(box(o.w, h, run + 0.02, m, o.x ?? 0, top - h / 2, o.z0 + dir * (i + 0.5) * run));
    }
    return g;
  }

  /** Arched "drum" bridge (taikobashi) along z, centred at origin */
  archBridge(len: number, w: number, rise: number, tone: WoodTone = 'vermilion', deck: WoodTone = 'darkWood'): THREE.Group {
    const g = new THREE.Group();
    const n = 14;
    const yAt = (t: number) => rise * Math.sin(Math.PI * t);
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const z0 = -len / 2 + len * t0, z1 = -len / 2 + len * t1;
      const y0 = yAt(t0), y1 = yAt(t1);
      const seg = box(w, 0.3, Math.hypot(z1 - z0, y1 - y0) + 0.05, this.m.wood[deck], 0, (y0 + y1) / 2, (z0 + z1) / 2);
      seg.rotation.x = -Math.atan2(y1 - y0, z1 - z0);
      g.add(seg);
      [-w / 2, w / 2].forEach((x) => {
        const rail = box(0.14, 0.14, Math.hypot(z1 - z0, y1 - y0) + 0.05, this.m.wood[tone], x, (y0 + y1) / 2 + 1.0, (z0 + z1) / 2);
        rail.rotation.x = seg.rotation.x;
        g.add(rail);
        g.add(box(0.18, 1.0, 0.18, this.m.wood[tone], x, y0 + 0.5, z0));
      });
    }
    [-w / 2, w / 2].forEach((x) =>
      [-len / 2, len / 2].forEach((z) => {
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), this.m.bronzeDark);
        knob.position.set(x, 1.25, z);
        g.add(knob);
      })
    );
    // supporting legs
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      [-w / 2 + 0.3, w / 2 - 0.3].forEach((x) => g.add(cyl(0.16, 0.16, yAt(t) + 2, this.m.wood.darkWood, x, yAt(t) / 2 - 1, -len / 2 + len * t, 8)));
    }
    g.userData.yAt = (z: number) => yAt(Math.min(1, Math.max(0, (z + len / 2) / len)));
    return g;
  }

  flatBridge(len: number, w: number, tone: WoodTone = 'cypress', railTone: WoodTone = 'cypress'): THREE.Group {
    const g = new THREE.Group();
    g.add(box(w, 0.35, len, this.m.wood[tone], 0, 0.6, 0));
    const n = Math.round(len / 3);
    [-w / 2, w / 2].forEach((x) => {
      g.add(box(0.18, 0.16, len, this.m.wood[railTone], x, 1.6, 0));
      for (let i = 0; i <= n; i++) {
        const z = -len / 2 + (len * i) / n;
        g.add(box(0.22, 1.2, 0.22, this.m.wood[railTone], x, 1.1, z));
        const k = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), this.m.bronzeDark);
        k.position.set(x, 1.8, z);
        g.add(k);
      }
      for (let i = 0; i <= n; i++) g.add(cyl(0.2, 0.2, 3, this.m.wood.darkWood, x, -0.9, -len / 2 + (len * i) / n, 8));
    });
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Ritual furniture                                                   */
  /* ------------------------------------------------------------------ */
  stoneLantern(h = 2.6, m: THREE.Material = this.m.granite): THREE.Group {
    const g = new THREE.Group();
    g.add(cyl(0.45, 0.55, 0.3, m, 0, 0.15, 0, 6));
    g.add(cyl(0.14, 0.18, h * 0.45, m, 0, 0.3 + h * 0.22, 0, 8));
    g.add(cyl(0.38, 0.3, 0.2, m, 0, h * 0.55, 0, 6));
    g.add(box(0.5, h * 0.22, 0.5, m, 0, h * 0.68, 0));
    const fire = box(0.36, h * 0.14, 0.52, this.m.glow, 0, h * 0.68, 0);
    fire.name = 'lanternFire';
    g.add(fire);
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.62, h * 0.18, 6), m);
    r.position.y = h * 0.88;
    g.add(r);
    const j = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), m);
    j.position.y = h * 0.99;
    g.add(j);
    return g;
  }

  /** Tōdai-ji style octagonal bronze lantern */
  bronzeLantern(h = 4.6): THREE.Group {
    const g = new THREE.Group();
    const m = this.m.bronzeDark;
    g.add(cyl(0.9, 1.1, 0.5, this.m.granite, 0, 0.25, 0, 8));
    g.add(cyl(0.18, 0.25, h * 0.45, m, 0, 0.5 + h * 0.22, 0, 8));
    g.add(cyl(0.7, 0.45, 0.3, m, 0, h * 0.55, 0, 8));
    g.add(cyl(0.55, 0.55, h * 0.24, m, 0, h * 0.7, 0, 8));
    g.add(cyl(0.45, 0.45, h * 0.18, this.m.glow, 0, h * 0.7, 0, 8));
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.95, h * 0.16, 8), m);
    r.position.y = h * 0.9;
    g.add(r);
    return g;
  }

  /** Large tubular shimenawa rope with shide paper streamers */
  shimenawa(len: number, thick: number, x = 0, y = 0, z = 0): THREE.Group {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-len / 2, 0, 0),
      new THREE.Vector3(-len * 0.25, -thick * 0.6, 0),
      new THREE.Vector3(0, -thick * 0.9, 0),
      new THREE.Vector3(len * 0.25, -thick * 0.6, 0),
      new THREE.Vector3(len / 2, 0, 0),
    ]);
    const geo = new THREE.TubeGeometry(curve, 48, thick, 14, false);
    // taper the ends
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const t = Math.abs(v.x) / (len / 2);
      const s = 1 - Math.pow(t, 6) * 0.65;
      const c = curve.getPointAt(Math.min(1, Math.max(0, (v.x + len / 2) / len)));
      v.y = c.y + (v.y - c.y) * s;
      v.z = c.z + (v.z - c.z) * s;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, this.m.rope));
    // hanging tufts + shide
    for (let k = -2; k <= 2; k++) {
      const c = curve.getPointAt(0.5 + k * 0.15);
      g.add(cyl(thick * 0.18, thick * 0.32, thick * 1.6, this.m.rope, c.x, c.y - thick * 1.5, 0, 8));
    }
    for (let k = -3; k <= 3; k++) {
      const c = curve.getPointAt(0.5 + k * 0.12);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(thick * 0.35, thick * 1.4), this.m.paper);
      s.position.set(c.x + thick * 0.4, c.y - thick * 1.4, thick * 0.9);
      g.add(s);
    }
    g.position.set(x, y, z);
    return g;
  }

  omikujiStand(): THREE.Group {
    const g = new THREE.Group();
    g.add(box(2.6, 1.1, 1.2, this.m.wood.darkWood, 0, 0.55, 0));
    for (let k = -1; k <= 1; k++) {
      const c = cyl(0.18, 0.18, 0.7, this.m.wood.cypress, k * 0.7, 1.45, 0, 6);
      g.add(c);
    }
    // musubi-dokoro: tying rack with white paper knots
    const rack = new THREE.Group();
    [-1.6, 1.6].forEach((x) => rack.add(box(0.15, 2.2, 0.15, this.m.wood.darkWood, x, 1.1, 0)));
    for (let r = 0; r < 4; r++) {
      const y = 0.7 + r * 0.4;
      rack.add(box(3.2, 0.03, 0.03, this.m.wood.black, 0, y, 0));
      for (let k = 0; k < 14; k++) {
        const knot = box(0.08, 0.18, 0.06, this.m.paper, -1.45 + k * 0.22 + (r % 2) * 0.1, y - 0.06, 0);
        rack.add(knot);
      }
    }
    rack.position.set(0, 0, -1.8);
    g.add(rack);
    return g;
  }
}
