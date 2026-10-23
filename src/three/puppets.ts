import * as THREE from 'three';
import { soundService } from '../services/soundService';

/**
 * Múa rối nước: a water-puppet show on the pond in front of the Thủy đình.
 *
 * All coordinates are in the pavilion's own space: the stage and bamboo blind face +z, the
 * puppets come out from under the blind (z ≈ 1.9) and play on the water (z 2.2 – 6), the
 * audience sits further out along +z. Puppets are lacquered wood: glossy, bright, a little stiff,
 * and they rock as if a puppeteer behind the blind were working the poles.
 *
 *   0  Chú Tễu opens the show          · 14 s
 *   1  Rồng phun nước: dragons          · 26 s
 *   2  Múa tiên: the fairies' dance      · 24 s
 *   3  Cày cấy: ploughing and planting  · 26 s
 *   4  Câu cá: the fisherman            · 20 s
 *   5  Tạ màn: everyone bows            · 16 s
 */
export type PuppetEvent =
  | { type: 'act'; i: number; vi: string; en: string }
  | { type: 'line'; vi: string; en: string }
  | { type: 'end' };

const ACTS: { at: number; vi: string; en: string }[] = [
  { at: 0, vi: 'Chú Tễu ra mắt', en: 'Chú Tễu says hello' },
  { at: 14, vi: 'Rồng phun nước', en: 'The dragons' },
  { at: 40, vi: 'Múa tiên', en: "The fairies' dance" },
  { at: 64, vi: 'Cày cấy', en: 'Ploughing and planting' },
  { at: 90, vi: 'Câu cá', en: 'The fisherman' },
  { at: 110, vi: 'Tạ màn', en: 'The bow' },
];
const LINES: { at: number; vi: string; en: string }[] = [
  { at: 2.5, vi: 'Xin chào bà con cô bác!', en: 'Hello, everyone!' },
  { at: 6.5, vi: 'Tễu đây! Hôm nay có rồng, có tiên, có cả trâu nữa!', en: "It's Tễu! Today: dragons, fairies, even a buffalo!" },
  { at: 11, vi: 'Mời cả nhà xem nhé!', en: 'Enjoy the show!' },
  { at: 66, vi: 'Con trâu là đầu cơ nghiệp!', en: 'The buffalo is the start of every fortune!' },
  { at: 80, vi: 'Một nắng hai sương…', en: 'Up before the sun, home after dark…' },
  { at: 101, vi: 'Ối giời, cá to quá!', en: 'Oh my, what a fish!' },
  { at: 114, vi: 'Cảm ơn bà con! Hẹn gặp lại!', en: 'Thank you all! See you again!' },
];
export const SHOW_LEN = 126;

const lac = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.05, ...extra });
const gold = () => lac(0xe2b23a, { metalness: 0.55, roughness: 0.3 });

function M(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/** a painted lacquer face: big round eyes, rosy cheeks, a wide smile */
function puppetFace(kind: 'teu' | 'fairy' | 'farmer') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = kind === 'teu' ? '#f6c9a6' : '#f7dcc0';
  g.fillRect(0, 0, 256, 128);
  const cx = 64;
  g.fillStyle = '#1a120d';
  [-1, 1].forEach((s) => {
    g.beginPath();
    if (kind === 'teu') g.arc(cx + s * 13, 58, 4.5, 0, Math.PI * 2);
    else g.ellipse(cx + s * 12, 58, 5, 2.4, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#1a120d';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx + s * 6, 46);
    g.quadraticCurveTo(cx + s * 13, kind === 'teu' ? 40 : 43, cx + s * 21, 47);
    g.stroke();
  });
  // cheeks
  g.fillStyle = 'rgba(230,90,90,.45)';
  [-1, 1].forEach((s) => {
    g.beginPath();
    g.arc(cx + s * 21, 72, 7, 0, Math.PI * 2);
    g.fill();
  });
  // mouth: Tễu grins ear to ear
  g.fillStyle = '#b5303a';
  g.beginPath();
  if (kind === 'teu') {
    g.moveTo(cx - 16, 76);
    g.quadraticCurveTo(cx, 98, cx + 16, 76);
    g.quadraticCurveTo(cx, 84, cx - 16, 76);
  } else {
    g.moveTo(cx - 6, 78);
    g.quadraticCurveTo(cx, 84, cx + 6, 78);
    g.quadraticCurveTo(cx, 80, cx - 6, 78);
  }
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Chú Tễu: a chubby boy, bare belly, red loincloth, one tuft of hair, the cheekiest grin */
function makeTeu() {
  const g = new THREE.Group();
  g.name = 'teu';
  const skin = lac(0xf0b48c);
  const belly = M(new THREE.SphereGeometry(0.3, 24, 18), skin, g, 0, 0.3, 0);
  belly.scale.set(1, 1.08, 0.9);
  M(new THREE.SphereGeometry(0.035, 10, 8), lac(0xd78a6a), g, 0, 0.28, 0.27); // navel
  const loin = M(new THREE.CylinderGeometry(0.31, 0.33, 0.16, 24), lac(0xc81e1e), g, 0, 0.08, 0);
  loin.scale.z = 0.9;
  const flap = M(new THREE.BoxGeometry(0.16, 0.22, 0.03), lac(0xc81e1e), g, 0, -0.04, 0.28);
  flap.rotation.x = 0.15;
  const head = new THREE.Group();
  head.position.y = 0.75;
  g.add(head);
  const face = new THREE.MeshStandardMaterial({ map: puppetFace('teu'), roughness: 0.3 });
  M(new THREE.SphereGeometry(0.22, 28, 20), face, head);
  // shaved head, one tuft of hair on top (chỏm tóc)
  const tuft = M(new THREE.ConeGeometry(0.06, 0.14, 10), lac(0x1a120d), head, 0, 0.24, -0.02);
  tuft.rotation.x = -0.4;
  [-1, 1].forEach((s) => M(new THREE.SphereGeometry(0.05, 10, 8), skin, head, s * 0.21, 0, 0));
  const arms: THREE.Group[] = [];
  [-1, 1].forEach((s) => {
    const a = new THREE.Group();
    a.position.set(s * 0.27, 0.48, 0);
    g.add(a);
    const up = M(new THREE.CapsuleGeometry(0.06, 0.22, 4, 10), skin, a, 0, -0.13, 0);
    up.rotation.z = s * 0.1;
    M(new THREE.SphereGeometry(0.06, 10, 8), skin, a, s * 0.02, -0.3, 0.02);
    a.rotation.z = s * 0.5;
    arms.push(a);
  });
  g.userData.arms = arms;
  g.userData.head = head;
  return g;
}

/** a dragon: a gold-scaled serpent of linked segments, red mane, horns and whiskers */
function makeDragon(body: number, mane: number) {
  const g = new THREE.Group();
  const scale = lac(body, { metalness: 0.4, roughness: 0.28 });
  const red = lac(mane);
  const segs: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const r = 0.17 * (1 - i / 16);
    const s = M(new THREE.SphereGeometry(r, 16, 12), scale, g);
    s.scale.set(1, 1, 1.4);
    // a little red fin on every other segment
    if (i % 2 === 0 && i > 0) {
      const fin = M(new THREE.ConeGeometry(r * 0.5, r * 1.1, 4), red, s, 0, r * 0.95, 0);
      fin.scale.z = 0.4;
    }
    segs.push(s);
  }
  const head = new THREE.Group();
  g.add(head);
  M(new THREE.SphereGeometry(0.19, 18, 14), scale, head).scale.set(1, 0.9, 1.2);
  const snout = M(new THREE.BoxGeometry(0.2, 0.13, 0.28), scale, head, 0, -0.03, 0.2);
  snout.geometry.translate(0, 0, 0);
  M(new THREE.BoxGeometry(0.19, 0.04, 0.24), red, head, 0, -0.1, 0.19); // open jaw
  [-1, 1].forEach((s) => {
    const horn = M(new THREE.ConeGeometry(0.03, 0.22, 8), gold(), head, s * 0.08, 0.17, -0.06);
    horn.rotation.x = -0.6;
    M(new THREE.SphereGeometry(0.035, 10, 8), lac(0xffffff, { emissive: 0x332200 }), head, s * 0.09, 0.07, 0.12);
    M(new THREE.SphereGeometry(0.018, 8, 6), lac(0x111111), head, s * 0.1, 0.07, 0.15);
    const whisker = M(new THREE.CylinderGeometry(0.006, 0.003, 0.32, 5), gold(), head, s * 0.1, -0.04, 0.3);
    whisker.rotation.set(Math.PI / 2 - 0.3, 0, s * 0.8);
  });
  const maneM = M(new THREE.ConeGeometry(0.16, 0.3, 10, 1, true), red, head, 0, 0.05, -0.16);
  maneM.rotation.x = -Math.PI / 2 - 0.4;
  g.userData.segs = segs;
  g.userData.head = head;
  return g;
}

/** a tiên: a fairy in a long robe with a phoenix crown and fluttering sleeves */
function makeFairy(robe: number) {
  const g = new THREE.Group();
  const r = lac(robe);
  M(new THREE.CylinderGeometry(0.1, 0.26, 0.62, 20), r, g, 0, 0.31, 0);
  M(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 20), gold(), g, 0, 0.45, 0);
  const face = new THREE.MeshStandardMaterial({ map: puppetFace('fairy'), roughness: 0.3 });
  M(new THREE.SphereGeometry(0.11, 22, 16), face, g, 0, 0.75, 0);
  M(new THREE.SphereGeometry(0.115, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), lac(0x1a120d), g, 0, 0.77, -0.01).rotation.x = -0.35;
  const crown = M(new THREE.CylinderGeometry(0.1, 0.085, 0.07, 14), gold(), g, 0, 0.86, 0);
  crown.rotation.x = -0.1;
  M(new THREE.SphereGeometry(0.02, 8, 6), lac(0xc81e1e, { emissive: 0x400000 }), g, 0, 0.88, 0.09);
  const sleeves: THREE.Group[] = [];
  [-1, 1].forEach((s) => {
    const a = new THREE.Group();
    a.position.set(s * 0.1, 0.62, 0);
    g.add(a);
    const sl = M(new THREE.ConeGeometry(0.08, 0.36, 12, 1, true), lac(robe, { side: THREE.DoubleSide }), a, 0, -0.16, 0);
    sl.rotation.z = Math.PI;
    a.rotation.z = s * 0.4;
    sleeves.push(a);
  });
  g.userData.sleeves = sleeves;
  return g;
}

/** a water buffalo and the farmer behind it, in a palm-leaf hat */
function makeBuffalo() {
  const g = new THREE.Group();
  const hide = lac(0x3d3a3a, { roughness: 0.45 });
  const body = M(new THREE.SphereGeometry(0.3, 20, 14), hide, g, 0, 0.18, 0);
  body.scale.set(0.85, 0.75, 1.5);
  const head = M(new THREE.SphereGeometry(0.15, 16, 12), hide, g, 0, 0.26, 0.48);
  head.scale.set(0.9, 0.9, 1.2);
  [-1, 1].forEach((s) => {
    const horn = M(new THREE.TorusGeometry(0.13, 0.025, 8, 16, Math.PI * 0.9), lac(0xd9cdb4), g, s * 0.1, 0.38, 0.44);
    horn.rotation.set(0, Math.PI / 2, s > 0 ? 0.3 : Math.PI - 0.3);
    M(new THREE.SphereGeometry(0.02, 8, 6), lac(0x111111), g, s * 0.08, 0.32, 0.6);
  });
  return g;
}
function makeFarmer(robe = 0x5a4632) {
  const g = new THREE.Group();
  M(new THREE.CylinderGeometry(0.09, 0.18, 0.5, 16), lac(robe), g, 0, 0.25, 0);
  const face = new THREE.MeshStandardMaterial({ map: puppetFace('farmer'), roughness: 0.3 });
  M(new THREE.SphereGeometry(0.1, 20, 14), face, g, 0, 0.6, 0);
  const non = M(new THREE.ConeGeometry(0.22, 0.14, 24, 1, true), lac(0xe6d6a2, { side: THREE.DoubleSide, roughness: 0.6 }), g, 0, 0.72, 0);
  non.rotation.x = -0.05;
  const arm = new THREE.Group();
  arm.position.set(0.1, 0.45, 0);
  g.add(arm);
  M(new THREE.CapsuleGeometry(0.03, 0.2, 4, 8), lac(robe), arm, 0, -0.1, 0.05).rotation.x = -0.6;
  g.userData.arm = arm;
  return g;
}

interface Drop {
  p: THREE.Vector3;
  v: THREE.Vector3;
  t: number;
}

export class PuppetShow {
  readonly g = new THREE.Group();
  t = 0;
  done = false;
  private teu = makeTeu();
  private dragons = [makeDragon(0xe2b23a, 0xc81e1e), makeDragon(0x3f8a5a, 0xe2b23a)];
  private fairies = [0xc81e1e, 0x3f8a3a, 0xf4f1ea, 0xe8b830].map(makeFairy);
  private buffalo = makeBuffalo();
  private farmer = makeFarmer();
  private planter = makeFarmer(0x2f5a7a);
  private fisher = makeFarmer(0x6b4a2e);
  private fish: THREE.Mesh;
  private rod: THREE.Mesh;
  private seedlings: THREE.Mesh[] = [];
  private ripples: { m: THREE.Mesh; t: number }[] = [];
  private drops: Drop[] = [];
  private dropPts: THREE.Points;
  private dropBuf: Float32Array;
  private act = -1;
  private said = new Set<number>();
  private rippleT = 0;
  private wave = 0;
  private W = -0.24;

  constructor(
    private stage: THREE.Object3D,
    private emit: (e: PuppetEvent) => void,
  ) {
    this.g.add(this.teu, ...this.dragons, ...this.fairies, this.buffalo, this.farmer, this.planter, this.fisher);
    const fishMat = lac(0xf08a2a, { emissive: 0x401800 });
    this.fish = M(new THREE.SphereGeometry(0.12, 14, 10), fishMat, this.g);
    this.fish.scale.set(0.5, 0.8, 1.4);
    M(new THREE.ConeGeometry(0.1, 0.16, 4), fishMat, this.fish, 0, 0, -0.18).rotation.x = -Math.PI / 2;
    this.rod = M(new THREE.CylinderGeometry(0.008, 0.012, 1.1, 5), lac(0x9c7a46), this.fisher, 0.12, 0.62, 0.3);
    this.rod.rotation.x = 0.9;
    // seedlings planted in rows across the water
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 7; c++) {
        const s = M(new THREE.ConeGeometry(0.04, 0.22, 5), lac(0x6fbf4a), this.g, -1.8 + c * 0.6, this.W, 3.2 + r * 0.55);
        s.scale.y = 0.001;
        this.seedlings.push(s);
      }
    // the spray: one cloud of droplets for the whole show
    this.dropBuf = new Float32Array(400 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.dropBuf, 3));
    this.dropPts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8f6ff, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false }));
    this.dropPts.frustumCulled = false;
    this.g.add(this.dropPts);
    this.hideAll();
    // a touch larger than life, and lifted so the waterline stays at the pond's surface
    this.g.scale.setScalar(1.35);
    this.g.position.y = -0.24 + 0.24 * 1.35;
    stage.add(this.g);
    soundService.startPuppetMusic();
  }

  private hideAll() {
    [this.teu, ...this.dragons, ...this.fairies, this.buffalo, this.farmer, this.planter, this.fisher, this.fish].forEach((o) => {
      o.position.set(0, -2, 1.9);
      o.visible = false;
    });
  }
  /** put a puppet on the water at (x, z), bobbing, facing a direction; k = how far it has risen */
  private place(o: THREE.Object3D, x: number, z: number, face: number, k = 1, bob = 0.03) {
    o.visible = k > 0.01;
    o.position.set(x, this.W - 0.9 * (1 - k) + Math.sin(this.t * 3.1 + x) * bob, z);
    o.rotation.y = face;
    o.rotation.z = Math.sin(this.t * 2.3 + z) * 0.06; // the pole wobble
  }
  private ripple(x: number, z: number, big = false) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.08, big ? 0.14 : 0.11, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, this.W + 0.02, z);
    this.g.add(m);
    this.ripples.push({ m, t: big ? -0.3 : 0 });
  }
  private splash(x: number, y: number, z: number, n = 26, up = 2.2, dir?: THREE.Vector3) {
    for (let i = 0; i < n && this.drops.length < 400; i++) {
      const v = dir
        ? dir.clone().multiplyScalar(2 + Math.random() * 1.5).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.6, (Math.random() - 0.5) * 0.6))
        : new THREE.Vector3((Math.random() - 0.5) * 1.6, up * (0.6 + Math.random() * 0.6), (Math.random() - 0.5) * 1.6);
      this.drops.push({ p: new THREE.Vector3(x, y, z), v, t: 0 });
    }
  }
  /** Space: the audience claps, and Tễu (if he's out) waves back */
  clap() {
    soundService.playClap(3);
    if (this.teu.visible) this.wave = 1.2;
  }

  /** ease in/out between two times */
  private k(a: number, b: number) {
    const x = Math.max(0, Math.min(1, (this.t - a) / (b - a)));
    return x * x * (3 - 2 * x);
  }

  update(dt: number) {
    if (this.done) return;
    this.t += dt;
    const t = this.t;
    const ai = ACTS.reduce((n, a, i) => (t >= a.at ? i : n), 0);
    if (ai !== this.act) {
      this.act = ai;
      this.emit({ type: 'act', i: ai, vi: ACTS[ai].vi, en: ACTS[ai].en });
      soundService.puppetCue(ai);
    }
    LINES.forEach((l, i) => {
      if (t >= l.at && !this.said.has(i)) {
        this.said.add(i);
        this.emit({ type: 'line', vi: l.vi, en: l.en });
      }
    });
    this.hideAll();
    const toward = 0; // facing the audience (+z)

    // 0. Tễu
    const teuIn = this.k(0.5, 2.5) * (1 - this.k(12, 13.5)) + this.k(64, 65.5) * (1 - this.k(82, 83.5)) + this.k(99, 100.5) * (1 - this.k(105, 106.5)) + this.k(111, 112.5);
    if (teuIn > 0.01) {
      const x = t < 20 ? Math.sin(t * 0.5) * 0.8 : t < 80 ? 1.8 : t < 108 ? -1.9 : 0.0;
      this.place(this.teu, x, t < 20 ? 3.0 + this.k(0.5, 4) * 0.8 : t > 110 ? 3.6 : 4.3, toward + Math.sin(t * 1.4) * 0.3, Math.min(1, teuIn));
      const arms = this.teu.userData.arms as THREE.Group[];
      this.wave = Math.max(0, this.wave - dt);
      arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (0.5 + (this.wave > 0 && i ? 1.6 + Math.sin(t * 14) * 0.4 : Math.abs(Math.sin(t * 4 + i)) * 0.6))));
      (this.teu.userData.head as THREE.Group).rotation.z = Math.sin(t * 2.2) * 0.15;
      // the bow
      this.teu.rotation.x = (t > 3 && t < 5) || (t > 114 && t < 116) ? 0.35 : 0;
    }

    // 1. dragons: swim in figure-eights, rear up and spray
    const dIn = this.k(14, 16) * (1 - this.k(38, 40)) + this.k(110, 112);
    if (dIn > 0.01) {
      this.dragons.forEach((d, n) => {
        const s = n ? -1 : 1;
        const segs = d.userData.segs as THREE.Mesh[];
        const head = d.userData.head as THREE.Group;
        d.visible = true;
        d.position.set(0, this.W - 0.9 * (1 - dIn), 0);
        const path = (u: number) => {
          if (t > 108) return new THREE.Vector3(s * (1.6 + u * 0.3) - s * 0.2 * Math.sin(u * 3), 0, 3.6 - u * 0.8);
          const a = (t - 14) * 0.45 - u * 0.9 + n * Math.PI;
          return new THREE.Vector3(Math.sin(a) * 2.0, 0, 3.8 + Math.sin(a * 2) * 0.9 * s);
        };
        const rear = t > 20 && t < 38 ? Math.max(0, Math.sin((t - 20) * 0.9 + n * 1.7)) : 0;
        segs.forEach((g, i) => {
          const p = path(i * 0.18);
          g.position.set(p.x, Math.sin(t * 4 - i * 0.7) * 0.07 + 0.1 + (i < 3 ? rear * (0.55 - i * 0.15) : 0), p.z);
        });
        const h = path(-0.2);
        const nx = path(-0.4);
        head.position.set(h.x, 0.18 + rear * 0.75, h.z);
        head.lookAt(nx.x, 0.18 + rear * 0.9, nx.z);
        // spray at the top of the rear-up
        if (rear > 0.92 && Math.random() < 0.45) {
          const dir = new THREE.Vector3(0, 0.6, 1).applyQuaternion(head.quaternion).normalize();
          this.splash(head.position.x, this.W + head.position.y + 0.1, head.position.z, 5, 2, dir);
          if (Math.random() < 0.2) soundService.puppetSpray();
        }
        if (Math.random() < 0.06) this.ripple(h.x, h.z);
      });
    }

    // 2. the fairies glide out in a line, circle, and sway their sleeves
    const fIn = this.k(40, 42) * (1 - this.k(62, 64)) + this.k(110, 112);
    if (fIn > 0.01) {
      this.fairies.forEach((f, i) => {
        const ph = (t - 40) * 0.5 + (i / 4) * Math.PI * 2;
        const circle = this.k(46, 49) * (1 - this.k(58, 61));
        const lineX = -1.5 + i * 1.0, lineZ = 3.4;
        const x = t > 108 ? -2.7 + i * 0.5 : lineX * (1 - circle) + Math.cos(ph) * 1.5 * circle;
        const z = t > 108 ? 3.0 : lineZ * (1 - circle) + (3.8 + Math.sin(ph) * 0.8) * circle;
        this.place(f, x, z, toward + Math.sin(t * 1.5 + i) * 0.5, fIn, 0.02);
        (f.userData.sleeves as THREE.Group[]).forEach((s, k) => (s.rotation.z = (k ? 1 : -1) * (0.4 + Math.abs(Math.sin(t * 2.4 + i + k)) * 1.1)));
        if (Math.random() < 0.02) this.ripple(x, z);
      });
    }

    // 3. a buffalo ploughs across, then the planter sets rice seedlings row by row
    const bIn = this.k(64, 66) * (1 - this.k(88, 90)) + this.k(110, 112);
    if (bIn > 0.01) {
      const u = t > 108 ? 0.75 : Math.max(0, Math.min(1, (t - 66) / 12));
      const bx = t > 108 ? 0.9 : -2.4 + u * 4.8;
      this.place(this.buffalo, bx, t > 108 ? 3.1 : 4.6, Math.PI / 2, bIn, 0.015);
      this.place(this.farmer, bx - 0.8, t > 108 ? 3.1 : 4.6, Math.PI / 2, bIn, 0.02);
      (this.farmer.userData.arm as THREE.Group).rotation.x = Math.sin(t * 5) * 0.3;
      if (t > 66 && t < 78 && Math.random() < 0.2) this.ripple(bx - 0.4, 4.6, true);
      // planting
      const pIn = this.k(77, 79) * (1 - this.k(88, 90));
      if (pIn > 0.01) {
        const pu = Math.max(0, Math.min(1, (t - 78) / 9));
        this.place(this.planter, -1.8 + pu * 3.6, 3.0, Math.PI / 2, pIn, 0.02);
        this.planter.rotation.x = Math.abs(Math.sin(t * 6)) * 0.4;
      }
    }
    this.seedlings.forEach((s, i) => {
      const c = i % 7;
      const at = 78 + (c / 6) * 9 + Math.floor(i / 7) * 0.3;
      const grow = this.k(at, at + 0.6) * (1 - this.k(120, 122));
      s.scale.y = Math.max(0.001, grow);
      s.visible = grow > 0.01;
      s.position.y = this.W + 0.1 * grow;
      s.rotation.z = Math.sin(t * 1.5 + i) * 0.08;
    });

    // 4. the fisherman casts, the fish leaps, the fish is caught
    const fsIn = this.k(90, 92) * (1 - this.k(108, 110)) + this.k(110, 112);
    if (fsIn > 0.01) {
      this.place(this.fisher, t > 108 ? 2.3 : 1.2, t > 108 ? 3.0 : 3.4, -0.5, fsIn, 0.02);
      this.rod.rotation.x = 0.9 + (t > 93 && t < 94 ? -0.8 : 0) + Math.sin(t * 2) * 0.05;
      if (t > 94 && t < 107) {
        const j = ((t - 94) % 3.2) / 3.2; // three leaps, the last one caught
        const caught = t > 100.5;
        this.fish.visible = true;
        if (caught) this.fish.position.set(1.2 + 0.25, this.W + 1.25 + Math.sin(t * 8) * 0.04, 3.4 + 0.75);
        else {
          const x = -0.2 + j * 1.4;
          this.fish.position.set(x, this.W + Math.sin(j * Math.PI) * 0.8 - 0.05, 4.6);
          this.fish.rotation.set(-Math.cos(j * Math.PI) * 1.1, Math.PI / 2, 0);
          if (j < 0.03 || (j > 0.97 && Math.random() < 0.5)) {
            this.splash(x, this.W, 4.6, 10, 1.4);
            this.ripple(x, 4.6, true);
          }
        }
      }
    }

    // finale sparks
    if (t > 113 && t < 121 && Math.random() < 0.3) {
      this.splash((Math.random() - 0.5) * 4, this.W + 0.2, 3 + Math.random() * 2, 12, 3.2);
    }

    // ripples and droplets
    this.rippleT += dt;
    this.ripples = this.ripples.filter((r) => {
      r.t += dt;
      const k = Math.max(0, r.t);
      r.m.scale.setScalar(1 + k * 5);
      (r.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.55 - k * 0.4);
      if (k > 1.4) {
        this.g.remove(r.m);
        return false;
      }
      return true;
    });
    this.drops = this.drops.filter((d) => {
      d.t += dt;
      d.v.y -= 6 * dt;
      d.p.addScaledVector(d.v, dt);
      return d.p.y > this.W && d.t < 3;
    });
    for (let i = 0; i < 400; i++) {
      const d = this.drops[i];
      this.dropBuf[i * 3] = d ? d.p.x : 0;
      this.dropBuf[i * 3 + 1] = d ? d.p.y : -10;
      this.dropBuf[i * 3 + 2] = d ? d.p.z : 0;
    }
    (this.dropPts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    if (t >= SHOW_LEN) {
      this.done = true;
      this.emit({ type: 'end' });
    }
  }

  dispose() {
    soundService.stopPuppetMusic();
    this.stage.remove(this.g);
  }
}
