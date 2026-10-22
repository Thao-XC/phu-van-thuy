import * as THREE from 'three';

/**
 * First-person hands, and the rites done with them.
 * The hands hang from the camera (rig space: x right, y up, -z forward, metres). Each rite is a
 * small state machine that moves them, holds objects, and asks the scene to dip or turn the view.
 */

/* ------------------------------------------------------------------ */
/* the hands                                                            */
/* ------------------------------------------------------------------ */
const SKIN = 0xe0ac86;
interface HandPose {
  p: THREE.Vector3;
  r: THREE.Euler;
  curl: number;
}
const P = (x: number, y: number, z: number, rx: number, ry: number, rz: number, curl = 0.15): HandPose => ({
  p: new THREE.Vector3(x, y, z),
  r: new THREE.Euler(rx, ry, rz, 'YXZ'),
  curl,
});
export type PoseName = 'hidden' | 'joined' | 'raised' | 'light' | 'plant' | 'tube' | 'receive' | 'slip' | 'coins';
const POSES: Record<PoseName, [HandPose, HandPose]> = {
  hidden: [P(-0.2, -0.95, -0.3, 0, 0, 0), P(0.2, -0.95, -0.3, 0, 0, 0)],
  // chắp tay: palms together, fingers up, in front of the chest
  joined: [P(-0.021, -0.19, -0.36, Math.PI / 2 - 0.22, -Math.PI / 2, 0, 0.05), P(0.021, -0.19, -0.36, Math.PI / 2 - 0.22, Math.PI / 2, 0, 0.05)],
  // raised to the forehead
  raised: [P(-0.021, -0.05, -0.28, Math.PI / 2 - 0.05, -Math.PI / 2, 0, 0.05), P(0.021, -0.05, -0.28, Math.PI / 2 - 0.05, Math.PI / 2, 0, 0.05)],
  // holding incense tips into the lamp flame, off to the right
  light: [P(0.09, -0.27, -0.44, Math.PI / 2 - 0.85, -Math.PI / 2, 0, 0.05), P(0.13, -0.27, -0.44, Math.PI / 2 - 0.85, Math.PI / 2, 0, 0.05)],
  // reaching forward and down to plant the sticks
  plant: [P(-0.021, -0.33, -0.52, Math.PI / 2 - 0.55, -Math.PI / 2, 0, 0.05), P(0.021, -0.33, -0.52, Math.PI / 2 - 0.55, Math.PI / 2, 0, 0.05)],
  // gripping the bamboo tube of fortune sticks
  tube: [P(-0.05, -0.27, -0.4, 0.15, 0, Math.PI / 2, 1.15), P(0.05, -0.2, -0.42, 0.15, 0, -Math.PI / 2, 1.15)],
  // palms up, cupped, to receive
  receive: [P(-0.055, -0.27, -0.42, -0.25, 0.25, Math.PI, 0.35), P(0.055, -0.27, -0.42, -0.25, -0.25, Math.PI, 0.35)],
  // holding a paper slip up to read
  slip: [P(-0.11, -0.2, -0.4, 0.5, 0.2, Math.PI / 2 + 0.2, 0.6), P(0.11, -0.2, -0.4, 0.5, -0.2, -Math.PI / 2 - 0.2, 0.6)],
  // cupping two coins
  coins: [P(-0.03, -0.26, -0.4, -0.2, 0.3, Math.PI, 0.5), P(0.03, -0.25, -0.4, -0.2, -0.3, Math.PI, 0.5)],
};

function makeHand(side: 1 | -1, sleeveColor: number) {
  const skin = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.62 });
  const sleeve = new THREE.MeshStandardMaterial({ color: sleeveColor, roughness: 0.85, side: THREE.DoubleSide });
  const cuff = new THREE.MeshStandardMaterial({ color: 0xece4d2, roughness: 0.8, side: THREE.DoubleSide });
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.024, 0.088), skin);
  palm.position.z = -0.044;
  hand.add(palm);
  const heel = new THREE.Mesh(new THREE.SphereGeometry(0.039, 12, 8), skin);
  heel.scale.set(1.05, 0.4, 0.9);
  heel.position.z = -0.012;
  hand.add(heel);
  const fingers: THREE.Group[] = [];
  [-0.029, -0.0095, 0.0095, 0.029].forEach((x, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(x * side, 0.002, -0.086);
    const len = [0.055, 0.07, 0.074, 0.062][side === 1 ? i : 3 - i];
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0082, len, 3, 8), skin);
    f.rotation.x = Math.PI / 2;
    f.position.z = -len / 2 - 0.006;
    pivot.add(f);
    hand.add(pivot);
    fingers.push(pivot);
  });
  const thumb = new THREE.Group();
  thumb.position.set(-0.043 * side, -0.004, -0.028);
  const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.048, 3, 8), skin);
  tm.rotation.x = Math.PI / 2;
  tm.position.z = -0.03;
  thumb.add(tm);
  thumb.rotation.y = 0.55 * side;
  hand.add(thumb);
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.033, 1, 10), skin);
  const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 1, 14, 1, true), sleeve);
  const cf = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.03, 14, 1, true), cuff);
  return { hand, fingers, thumb, fore, sl, cf };
}

function stretch(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  const d = b.clone().sub(a);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.scale.set(1, d.length(), 1);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
}

export class Hands {
  readonly rig = new THREE.Group();
  private h: ReturnType<typeof makeHand>[];
  private cur: { p: THREE.Vector3; q: THREE.Quaternion; curl: number }[];
  private target: [HandPose, HandPose] = POSES.hidden;
  /** extra offset for both hands (shaking, lighting jitter) */
  readonly offset = new THREE.Vector3();
  speed = 9;

  constructor(camera: THREE.Camera, sleeveColor = 0x5a3a26) {
    this.h = [makeHand(-1, sleeveColor), makeHand(1, sleeveColor)];
    this.h.forEach((x) => this.rig.add(x.hand, x.fore, x.sl, x.cf));
    this.cur = POSES.hidden.map((p) => ({ p: p.p.clone(), q: new THREE.Quaternion().setFromEuler(p.r), curl: p.curl }));
    this.rig.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.renderOrder = 5;
        m.frustumCulled = false;
      }
    });
    camera.add(this.rig);
    this.rig.visible = false;
  }
  pose(name: PoseName) {
    this.target = POSES[name];
  }
  get busy() {
    return this.target !== POSES.hidden;
  }
  /** world-ish point between the hands (rig space) */
  get between() {
    return this.cur[0].p.clone().add(this.cur[1].p).multiplyScalar(0.5).add(this.offset);
  }
  update(dt: number) {
    const k = 1 - Math.exp(-dt * this.speed);
    const tq = new THREE.Quaternion();
    let vis = false;
    this.h.forEach((x, i) => {
      const t = this.target[i];
      const c = this.cur[i];
      c.p.lerp(t.p, k);
      c.q.slerp(tq.setFromEuler(t.r), k);
      c.curl += (t.curl - c.curl) * k;
      x.hand.position.copy(c.p).add(this.offset);
      x.hand.quaternion.copy(c.q);
      x.fingers.forEach((f, j) => (f.rotation.x = c.curl * (1.35 + j * 0.05)));
      x.thumb.rotation.x = c.curl * 0.6;
      // forearm and sleeve back to an elbow below the view
      const side = i === 0 ? -1 : 1;
      const wrist = x.hand.position.clone().add(new THREE.Vector3(0, 0, 0.012).applyQuaternion(c.q));
      const elbow = new THREE.Vector3(side * 0.2, -0.62, -0.02).add(this.offset);
      stretch(x.fore, wrist, wrist.clone().lerp(elbow, 0.45));
      stretch(x.sl, wrist.clone().lerp(elbow, 0.18), elbow.clone().add(new THREE.Vector3(side * 0.04, -0.2, 0.1)));
      stretch(x.cf, wrist.clone().lerp(elbow, 0.16), wrist.clone().lerp(elbow, 0.2));
      if (c.p.y > -0.8) vis = true;
    });
    this.rig.visible = vis;
  }
}

/* ------------------------------------------------------------------ */
/* props held in the hands                                             */
/* ------------------------------------------------------------------ */
const glowTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,200,1)');
    gr.addColorStop(0.3, 'rgba(255,160,70,.7)');
    gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();

function incenseBundle(n: number) {
  const g = new THREE.Group();
  const stem = new THREE.MeshStandardMaterial({ color: 0xa8402e, roughness: 0.8 });
  const tips: THREE.Sprite[] = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.3, 5), stem);
    stick.position.y = 0.15;
    s.add(stick);
    const tip = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    tip.scale.setScalar(0.03);
    tip.position.y = 0.3;
    s.add(tip);
    tips.push(tip);
    s.rotation.z = (i - (n - 1) / 2) * 0.05;
    s.position.x = (i - (n - 1) / 2) * 0.004;
    g.add(s);
  }
  return { g, tips };
}

function smokeTrail() {
  const n = 40;
  const pos = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8e2d8, size: 0.012, transparent: true, opacity: 0.55, depthWrite: false }));
  pts.frustumCulled = false;
  return { pts, pos, n };
}

function oilLamp() {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xd9a62e, metalness: 0.85, roughness: 0.25 });
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), brass);
  bowl.material.side = THREE.DoubleSide;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.12, 10), brass);
  stem.position.y = -0.1;
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flame.scale.set(0.05, 0.08, 1);
  flame.position.y = 0.035;
  const light = new THREE.PointLight(0xffa050, 0.8, 1.5, 2);
  light.position.y = 0.05;
  g.add(bowl, stem, flame, light);
  return { g, flame, light };
}

function fortuneTube() {
  const g = new THREE.Group();
  const bamboo = new THREE.MeshStandardMaterial({ color: 0x8a6430, roughness: 0.7 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.26, 16, 1, true), bamboo);
  tube.material.side = THREE.DoubleSide;
  g.add(tube);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), bamboo);
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = -0.13;
  g.add(bottom);
  [-0.08, 0.09].forEach((y) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.004, 6, 18), new THREE.MeshStandardMaterial({ color: 0xc99212, metalness: 0.5 }));
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    g.add(band);
  });
  const sticks: THREE.Mesh[] = [];
  const stickM = new THREE.MeshStandardMaterial({ color: 0xd9b47a, roughness: 0.6 });
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, r = 0.012 + (i % 3) * 0.009;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.3, 0.003), stickM);
    s.position.set(Math.cos(a) * r, 0.06, Math.sin(a) * r);
    s.rotation.z = Math.cos(a) * 0.08;
    sticks.push(s);
    g.add(s);
  }
  return { g, sticks };
}

/** a paper slip with the verse written on it */
function verseSlip(n: number, lines: string[], tierColor: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 768;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f2e6c8';
  g.fillRect(0, 0, 512, 768);
  g.strokeStyle = '#7a1a12';
  g.lineWidth = 10;
  g.strokeRect(18, 18, 476, 732);
  g.lineWidth = 3;
  g.strokeRect(34, 34, 444, 700);
  g.fillStyle = tierColor;
  g.font = '700 40px "Noto Serif", serif';
  g.textAlign = 'center';
  g.fillText(`Quẻ số ${n}`, 256, 104);
  g.fillStyle = '#211a15';
  g.font = 'italic 600 30px "Noto Serif", serif';
  lines.slice(0, 2).forEach((l, i) => {
    const words = l.split(' ');
    let line = '', y = 200 + i * 190;
    words.forEach((w) => {
      if (g.measureText(line + w).width > 400) {
        g.fillText(line, 256, y);
        line = '';
        y += 42;
      }
      line += w + ' ';
    });
    g.fillText(line, 256, y);
  });
  g.fillStyle = '#b8382b';
  g.fillRect(226, 640, 60, 60);
  g.fillStyle = '#f2e6c8';
  g.font = '700 22px "Noto Serif", serif';
  g.fillText('Mẫu', 256, 678);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.24), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }));
  return m;
}

function coin() {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.003, 16), [
    new THREE.MeshStandardMaterial({ color: 0xa07a2a, metalness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0xe0b23a, metalness: 0.7, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: 0x7a5a1a, metalness: 0.5, roughness: 0.5 }),
  ]);
  return c;
}

/* ------------------------------------------------------------------ */
/* rites                                                                */
/* ------------------------------------------------------------------ */
export interface RiteHost {
  hands: Hands;
  /** dip the view: a bow (seconds) */
  bow: (sec?: number) => void;
  /** smoothly turn to look at a world point */
  face: (x: number, y: number, z: number) => void;
  /** lower or raise the eye (kneeling) */
  kneel: (amount: number) => void;
  /** leave something in the world (planted incense) */
  plantIncense: (n: number) => void;
  sound: { mo: () => void; chime: () => void; rattle: () => void; burn: () => void; clack: () => void };
}
export interface RiteEvents {
  hint: (text: string | null) => void;
  done: (result: { kind: string; n?: number; coins?: string }) => void;
}

export abstract class Rite {
  finished = false;
  constructor(protected host: RiteHost, protected ev: RiteEvents) {}
  abstract update(dt: number, t: number): void;
  press(_down: boolean) {}
  key(_k: string) {}
  drag(_dx: number) {}
  cancel() {
    this.cleanup();
    this.host.hands.pose('hidden');
    this.host.kneel(0);
    this.ev.hint(null);
    this.finished = true;
  }
  protected cleanup() {}
}

/** vái: hands together, one bow */
export class BowRite extends Rite {
  private t = 0;
  constructor(host: RiteHost, ev: RiteEvents, private times = 1, private hintText?: string) {
    super(host, ev);
    host.hands.pose('joined');
    if (hintText) ev.hint(hintText);
  }
  private n = 0;
  update(dt: number) {
    this.t += dt;
    if (this.t > 0.45 && this.n < this.times && this.t > 0.45 + this.n * 1.8) {
      this.host.bow(1.6);
      this.host.hands.pose(this.n % 2 ? 'joined' : 'raised');
      this.host.sound.mo();
      this.n++;
    }
    if (this.t > 0.6 + this.n * 1.8 && this.n >= this.times) {
      this.host.hands.pose('hidden');
      this.ev.hint(null);
      this.finished = true;
      this.ev.done({ kind: 'bow', n: this.times });
    }
  }
}

/** thắp hương: take sticks, light them, raise and bow, plant them */
export class IncenseRite extends Rite {
  private step: 'take' | 'light' | 'pray' | 'plant' | 'done' = 'take';
  private n = 0;
  private bundle: ReturnType<typeof incenseBundle> | null = null;
  private lamp = oilLamp();
  private glow = 0;
  private holding = false;
  private bows = 0;
  private smoke = smokeTrail();
  private wait = 0;
  constructor(host: RiteHost, ev: RiteEvents, private burner: THREE.Vector3) {
    super(host, ev);
    host.face(burner.x, burner.y + 0.6, burner.z);
    host.hands.pose('receive');
    this.lamp.g.position.set(0.17, -0.36, -0.6);
    host.hands.rig.add(this.lamp.g, this.smoke.pts);
    this.lamp.g.visible = false;
    ev.hint('Take incense sticks: press 1 to 5, or click once for each stick. Then press Enter.');
  }
  private remake() {
    if (this.bundle) this.host.hands.rig.remove(this.bundle.g);
    this.bundle = incenseBundle(this.n);
    this.host.hands.rig.add(this.bundle.g);
  }
  key(k: string) {
    if (this.step === 'take' && /^[1-5]$/.test(k)) {
      this.n = +k;
      this.remake();
      this.host.sound.mo();
    } else if (this.step === 'take' && k === 'Enter' && this.n > 0) this.toLight();
  }
  press(down: boolean) {
    if (this.step === 'take' && down) {
      if (this.n >= 5) return this.toLight();
      this.n++;
      this.remake();
      this.host.sound.mo();
      if (this.n === 5) this.ev.hint('Five sticks. Press Enter (or click) to light them.');
      else this.ev.hint(`${this.n} stick${this.n > 1 ? 's' : ''} in your hands. Click for more, or press Enter to light them. Odd numbers are for the living.`);
      return;
    }
    this.holding = down;
    if (this.step === 'pray' && !down && this.raisedFor > 0.25) {
      this.bows++;
      this.raisedFor = 0;
      this.host.bow(1.5);
      this.host.sound.mo();
      this.host.hands.pose('joined');
      if (this.bows >= 3) {
        this.step = 'plant';
        this.wait = 1.4;
        this.ev.hint('Plant the incense in the ash: press Space or click.');
      } else this.ev.hint(`Raise the incense to your forehead (hold), then release to bow. ${this.bows}/3`);
    }
    if (this.step === 'plant' && down && this.wait <= 0) {
      this.host.hands.pose('plant');
      this.step = 'done';
      this.wait = 0.9;
    }
  }
  private raisedFor = 0;
  private toLight() {
    this.step = 'light';
    this.host.hands.pose('joined');
    this.lamp.g.visible = true;
    this.ev.hint('Hold the tips in the lamp flame: hold Space or the mouse button.');
  }
  update(dt: number, t: number) {
    const H = this.host.hands;
    if (this.bundle) {
      this.bundle.g.position.copy(H.between).add(new THREE.Vector3(0, 0.05, -0.01));
      this.bundle.g.rotation.x = this.step === 'light' ? -0.75 : this.step === 'plant' || this.step === 'done' ? -0.45 : -0.15;
      this.bundle.tips.forEach((s) => ((s.material as THREE.SpriteMaterial).opacity = this.glow * (0.7 + Math.random() * 0.3)));
    }
    (this.lamp.flame.material as THREE.SpriteMaterial).opacity = 0.8 + Math.random() * 0.2;
    if (this.step === 'light') {
      H.pose(this.holding ? 'light' : 'joined');
      if (this.holding) {
        this.glow = Math.min(1, this.glow + dt * 0.7);
        if (this.glow >= 1) {
          this.step = 'pray';
          this.host.sound.burn();
          this.lamp.g.visible = false;
          H.pose('joined');
          this.ev.hint('Raise the incense to your forehead (hold), then release to bow. 0/3');
        }
      }
    }
    if (this.step === 'pray') {
      if (this.holding) {
        H.pose('raised');
        this.raisedFor += dt;
      }
    }
    // smoke from lit tips
    if (this.bundle && this.glow > 0.6) {
      const tip = this.bundle.g.position.clone().add(new THREE.Vector3(0, 0.3 * Math.cos(this.bundle.g.rotation.x), -0.3 * Math.sin(-this.bundle.g.rotation.x)));
      const p = this.smoke.pos;
      p.copyWithin(3, 0, p.length - 3);
      p.set([tip.x + Math.sin(t * 3) * 0.004, tip.y, tip.z], 0);
      for (let i = 3; i < p.length; i += 3) {
        p[i + 1] += dt * 0.12;
        p[i] += Math.sin(t * 2 + i) * dt * 0.01;
      }
      (this.smoke.pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
    if (this.wait > 0) this.wait -= dt;
    if (this.step === 'done' && this.wait <= 0 && !this.finished) {
      this.host.plantIncense(this.n);
      this.cleanup();
      H.pose('hidden');
      this.host.sound.chime();
      this.ev.hint(null);
      this.finished = true;
      this.ev.done({ kind: 'incense', n: this.n });
    }
  }
  protected cleanup() {
    const rig = this.host.hands.rig;
    if (this.bundle) rig.remove(this.bundle.g);
    rig.remove(this.lamp.g, this.smoke.pts);
  }
}

/** xin xăm: kneel, shake the tube until one stick falls, ask the coins, read the slip */
export class XamRite extends Rite {
  private step: 'shake' | 'fall' | 'coins' | 'toss' | 'slip' | 'end' = 'shake';
  private tube = fortuneTube();
  private power = 0;
  private tilt = 0;
  private lastDir = 0;
  private stick: THREE.Mesh | null = null;
  private fallT = 0;
  private coins: THREE.Mesh[] = [];
  private tossT = 0;
  private result: 'thanh' | 'duong' | 'am' = 'thanh';
  private slip: THREE.Mesh | null = null;
  constructor(
    host: RiteHost,
    ev: RiteEvents,
    private table: THREE.Vector3,
    private draw: () => { n: number; verse: [string, string]; color: string },
  ) {
    super(host, ev);
    host.face(table.x, table.y + 0.6, table.z);
    host.kneel(0.55);
    host.hands.pose('tube');
    host.hands.rig.add(this.tube.g);
    ev.hint('Shake the tube: tap ← → (or A D), or drag the mouse left and right, until one stick falls.');
  }
  private shake(dir: number) {
    if (this.step !== 'shake' || dir === this.lastDir) return;
    this.lastDir = dir;
    this.tilt = dir * 0.28;
    this.power = Math.min(1, this.power + 0.07);
    this.host.sound.rattle();
    if (this.power >= 1) {
      this.step = 'fall';
      const s = this.tube.sticks[7];
      this.stick = s;
      this.fallT = 0;
      this.ev.hint('A stick slips free and clatters to the floor…');
    }
  }
  key(k: string) {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.shake(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.shake(1);
    else if (k === ' ' || k === 'Enter') this.press(true);
  }
  drag(dx: number) {
    if (Math.abs(dx) > 12) this.shake(Math.sign(dx));
  }
  press(down: boolean) {
    if (!down) return;
    if (this.step === 'shake') this.shake(this.lastDir === 1 ? -1 : 1);
    else if (this.step === 'coins') this.toss();
    else if (this.step === 'slip') this.finish();
  }
  private picked: { n: number; verse: [string, string]; color: string } | null = null;
  private toss() {
    this.step = 'toss';
    this.tossT = 0;
    const a = Math.random() < 0.5, b = Math.random() < 0.5;
    this.result = a !== b ? 'thanh' : a ? 'duong' : 'am';
    this.coins.forEach((c, i) => (c.userData.up = i === 0 ? a : b));
    this.host.sound.clack();
  }
  private finish() {
    this.cleanup();
    this.host.hands.pose('hidden');
    this.host.kneel(0);
    this.ev.hint(null);
    this.finished = true;
    this.ev.done({ kind: 'xam', n: this.picked?.n, coins: 'thanh' });
  }
  update(dt: number, t: number) {
    const H = this.host.hands;
    this.tilt *= Math.exp(-dt * 7);
    if (this.step === 'shake') this.power = Math.max(0, this.power - dt * 0.05);
    H.offset.set(this.tilt * 0.06, Math.abs(this.tilt) * 0.02, 0);
    this.tube.g.position.copy(H.between).add(new THREE.Vector3(0, 0.03, -0.035));
    this.tube.g.rotation.set(-0.45, 0, -this.tilt);
    this.tube.sticks.forEach((s, i) => (s.position.y = 0.06 + (i === 7 ? this.power * 0.12 : Math.sin(i * 7.1 + t * 30) * 0.004 * (Math.abs(this.tilt) > 0.05 ? 1 : 0))));
    if (this.step === 'fall' && this.stick) {
      this.fallT += dt;
      const k = Math.min(1, this.fallT / 0.9);
      this.stick.position.set(0.02 + k * 0.05, 0.18 + k * 0.1 - k * k * 0.75, -0.05 - k * 0.1);
      this.stick.rotation.z = k * 2.2;
      if (k >= 1) {
        this.host.sound.clack();
        this.picked = this.draw();
        this.tube.g.visible = false;
        H.pose('coins');
        for (let i = 0; i < 2; i++) {
          const c = coin();
          H.rig.add(c);
          this.coins.push(c);
        }
        this.step = 'coins';
        this.ev.hint(`Stick number ${this.picked.n}. Toss the two coins to ask if it is truly your answer: press Space or click.`);
      }
    }
    if (this.step === 'coins' || this.step === 'toss') {
      const base = H.between;
      this.coins.forEach((c, i) => {
        if (this.step === 'coins') {
          c.position.copy(base).add(new THREE.Vector3((i - 0.5) * 0.03, 0.02, 0));
          c.rotation.set(0, 0, 0);
        } else {
          const k = Math.min(1, this.tossT / 1.1);
          c.position.copy(base).add(new THREE.Vector3((i - 0.5) * 0.08, Math.sin(k * Math.PI) * 0.18 + 0.02 - k * 0.02, -k * 0.06));
          c.rotation.x = k < 1 ? this.tossT * (14 + i * 3) : c.userData.up ? 0 : Math.PI;
        }
      });
      if (this.step === 'toss') {
        this.tossT += dt;
        if (this.tossT > 1.5) {
          if (this.result === 'thanh' && this.picked) {
            this.coins.forEach((c) => H.rig.remove(c));
            this.coins = [];
            this.slip = verseSlip(this.picked.n, this.picked.verse, this.picked.color);
            H.rig.add(this.slip);
            H.pose('slip');
            this.host.sound.chime();
            this.step = 'slip';
            this.ev.hint('Quẻ Thánh: one face up, one down. The Mothers agree. Read your verse, then press Space to finish.');
            this.ev.done({ kind: 'xam-drawn', n: this.picked.n });
          } else {
            this.step = 'coins';
            this.ev.hint(
              this.result === 'duong' ? 'Both faces up: the gods are smiling. Ask more clearly, and toss again.' : 'Both faces down: not this stick. Toss again, or press Esc to begin anew.',
            );
          }
        }
      }
    }
    if (this.slip) {
      this.slip.position.copy(H.between).add(new THREE.Vector3(0, 0.07, -0.02));
      this.slip.rotation.set(-0.2, 0, 0);
    }
  }
  protected cleanup() {
    const rig = this.host.hands.rig;
    rig.remove(this.tube.g);
    this.coins.forEach((c) => rig.remove(c));
    if (this.slip) rig.remove(this.slip);
  }
}
