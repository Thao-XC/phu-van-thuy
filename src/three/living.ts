import * as THREE from 'three';
import { person, walk, pray, rest, type Person, type PersonOpts } from './kit/people';

/**
 * The temple's life: a firefly spirit guide, other visitors going about their prayers,
 * and the arrival by boat up the misty river.
 */

type Ground = (x: number, z: number) => number;

const glowTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,250,210,1)');
    gr.addColorStop(0.25, 'rgba(255,214,110,.75)');
    gr.addColorStop(1, 'rgba(255,190,80,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();

/* ------------------------------------------------------------------ */
/* the firefly guide                                                    */
/* ------------------------------------------------------------------ */
export class Firefly {
  readonly obj = new THREE.Group();
  private light = new THREE.PointLight(0xffd27a, 1.4, 7, 2);
  private sprite: THREE.Sprite;
  private trail: THREE.Points;
  private trailPos: Float32Array;
  private target: THREE.Vector3 | null = null;
  private guideT = 0;
  private home = new THREE.Vector3();
  /** called when it reaches the place it was showing you */
  onArrive: (() => void) | null = null;
  private arrived = false;

  constructor(private ground: Ground) {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff3c0 }));
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.sprite.scale.setScalar(0.4);
    this.obj.add(core, this.sprite, this.light);
    const n = 24;
    this.trailPos = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    this.trail = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTex(), size: 0.18, transparent: true, depthWrite: false, opacity: 0.7, blending: THREE.AdditiveBlending }));
    this.trail.frustumCulled = false;
  }

  attach(scene: THREE.Scene, start: THREE.Vector3) {
    this.obj.position.copy(start);
    for (let i = 0; i < this.trailPos.length; i += 3) this.trailPos.set([start.x, start.y, start.z], i);
    scene.add(this.obj, this.trail);
  }

  get guiding() {
    return !!this.target;
  }

  /** fly to (x, z) and wait there for the visitor */
  guide(x: number, z: number) {
    this.target = new THREE.Vector3(x, this.ground(x, z) + 1.5, z);
    this.guideT = 0;
    this.arrived = false;
  }

  update(dt: number, t: number, player: THREE.Vector3, yaw: number, visible: boolean) {
    this.obj.visible = this.trail.visible = visible;
    if (!visible) return;
    let goal: THREE.Vector3;
    let speed: number;
    if (this.target) {
      this.guideT += dt;
      const toPlayer = Math.hypot(player.x - this.target.x, player.z - this.target.z);
      const atGoal = this.obj.position.distanceTo(this.target) < 1.2;
      if (atGoal && !this.arrived) {
        this.arrived = true;
        this.onArrive?.();
      }
      // stay a little ahead of the visitor, never too far: wait for them to catch up
      const ahead = this.obj.position.distanceTo(player) > 14 && !atGoal;
      goal = ahead ? this.obj.position.clone() : this.target.clone().add(new THREE.Vector3(Math.cos(t * 1.7) * 0.8, Math.sin(t * 2.3) * 0.3, Math.sin(t * 1.7) * 0.8));
      speed = 4.2;
      if (toPlayer < 3.2 || this.guideT > 40) this.target = null;
    } else {
      // drift beside the visitor, a little ahead and to the left
      this.home.set(player.x + Math.sin(yaw + 1.25) * -1.8, player.y - 0.25 + Math.sin(t * 2.1) * 0.15, player.z + Math.cos(yaw + 1.25) * -1.8);
      goal = this.home;
      speed = 2.6;
    }
    const d = goal.clone().sub(this.obj.position);
    const len = d.length();
    if (len > 0.001) this.obj.position.addScaledVector(d, Math.min(1, (speed * dt) / len + dt * 0.8));
    this.obj.position.x += Math.sin(t * 5.3) * 0.004;
    this.obj.position.y += Math.cos(t * 4.1) * 0.004;
    const pulse = 0.75 + Math.sin(t * 3.2) * 0.25;
    this.light.intensity = 1.1 * pulse + (this.target ? 0.8 : 0);
    this.sprite.scale.setScalar(0.3 + pulse * 0.14);
    // trail
    this.trailPos.copyWithin(3, 0, this.trailPos.length - 3);
    this.trailPos.set([this.obj.position.x, this.obj.position.y, this.obj.position.z], 0);
    (this.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}

/* ------------------------------------------------------------------ */
/* other visitors                                                       */
/* ------------------------------------------------------------------ */
interface Stop {
  x: number;
  z: number;
  /** seconds to stay; bow while staying */
  pray?: number;
}
interface Visitor {
  fig: Person;
  route: Stop[];
  i: number;
  wait: number;
  phase: number;
  walk: number;
}

/** who comes to the temple: grandmothers in áo nâu and khăn vấn, women in áo dài, men in áo the and khăn xếp */
const LOOKS: Omit<PersonOpts, 'robe'>[] = [
  { sex: 'f', elder: true, outfit: 'aonau', hair: 'khanvan', under: 0x8a5a3b },
  { sex: 'm', elder: true, outfit: 'aothe', hair: 'khanxep' },
  { sex: 'f', outfit: 'aodai', hair: 'bun' },
  { sex: 'f', outfit: 'aodai', hair: 'long' },
  { sex: 'm', outfit: 'aothe', hair: 'short', trousers: 0x2a2620 },
  { sex: 'f', elder: true, outfit: 'aonau', hair: 'khanvan', hat: 'non', under: 0x6b4a2e },
  { sex: 'f', outfit: 'aodai', hair: 'bun' },
  { sex: 'm', outfit: 'aothe', hair: 'khanxep' },
];
const LOOK_COLORS = [0x5b3a2a, 0x1f2a3e, 0xb8382b, 0xf1ead8, 0x34507a, 0x6b4a2e, 0x3f8a5a, 0x2a2420];
const ROUTES: { robe: number; under: number; h: number; route: Stop[] }[] = [
  {
    robe: 0x6b4a2e,
    under: 0x2f2a28,
    h: 1.58,
    route: [{ x: 3, z: 60 }, { x: 6.2, z: 46 }, { x: 6.2, z: 37 }, { x: -1.4, z: 19.4, pray: 6 }, { x: -4.4, z: -1 }, { x: -4.4, z: -8, pray: 8 }, { x: -4.4, z: -1 }, { x: -6.2, z: 37 }, { x: -6.2, z: 46 }, { x: 3, z: 60, pray: 4 }],
  },
  {
    robe: 0x34507a,
    under: 0xf1ead8,
    h: 1.64,
    route: [{ x: 8, z: 28, pray: 4 }, { x: -1, z: 18.6, pray: 5 }, { x: 11.6, z: 12.6, pray: 6 }, { x: 14, z: 22 }],
  },
  {
    robe: 0xf1ead8,
    under: 0xb8382b,
    h: 1.55,
    route: [{ x: -8, z: 28, pray: 7 }, { x: -3, z: 10 }, { x: 4.4, z: -1 }, { x: 4.4, z: -8.5, pray: 9 }, { x: 4.4, z: -1 }, { x: -3, z: 10 }],
  },
  {
    robe: 0x4f8763,
    under: 0xe2b33b,
    h: 1.6,
    route: [{ x: 17, z: -3, pray: 6 }, { x: 13, z: 6 }, { x: 4, z: 26, pray: 3 }, { x: 13, z: 6 }],
  },
];

export class Visitors {
  private list: Visitor[] = [];
  /** on festival days the temple is crowded: more visitors on the same routes */
  setCrowd(on: boolean) {
    this.list.forEach((v, i) => {
      if (i >= ROUTES.length) v.fig.userData.hidden = !on;
    });
  }
  constructor(scene: THREE.Scene, private ground: Ground) {
    [...ROUTES, ...ROUTES.map((r, i) => ({ ...r, robe: [0xb8382b, 0x8a5a3b, 0x2f5a7a, 0xe2b33b][i], route: [...r.route].reverse() }))].forEach((r, k) => {
      const look = LOOKS[k % LOOKS.length];
      const fig = person({ ...look, robe: LOOK_COLORS[k % LOOK_COLORS.length], h: look.sex === 'm' ? r.h + 0.06 : r.h - 0.02 });
      const s = r.route[k % r.route.length];
      fig.position.set(s.x, ground(s.x, s.z), s.z);
      scene.add(fig);
      if (k >= ROUTES.length) fig.userData.hidden = true;
      this.list.push({ fig, route: r.route, i: (k * 3) % r.route.length, wait: 1 + k, phase: k * 1.3, walk: 0 });
    });
  }
  update(dt: number, t: number, player: THREE.Vector3, visible: boolean) {
    for (const v of this.list) {
      // far-off visitors aren't drawn at all (each one is a few dozen pieces)
      const pd = Math.hypot(player.x - v.fig.position.x, player.z - v.fig.position.z);
      v.fig.visible = visible && !v.fig.userData.hidden && pd < 42;
      if (!v.fig.visible) continue;
      // a glance as you pass: the head turns toward you, then back to the way they're going
      {
        const head = v.fig.userData.j.head;
        let want = 0;
        if (pd < 3.5) {
          let a = Math.atan2(player.x - v.fig.position.x, player.z - v.fig.position.z) - v.fig.rotation.y;
          a = Math.atan2(Math.sin(a), Math.cos(a));
          if (Math.abs(a) < 1.9) want = Math.max(-1, Math.min(1, a));
        }
        head.rotation.y += (want - head.rotation.y) * Math.min(1, dt * 3);
      }
      const stop = v.route[v.i];
      if (v.wait > 0) {
        v.wait -= dt;
        // bowing with joined hands while praying (vái), otherwise just standing
        if (stop.pray) pray(v.fig, 1, Math.max(0, Math.sin(t * 1.4 + v.phase)));
        else rest(v.fig, t + v.phase);
        v.fig.position.y = this.ground(v.fig.position.x, v.fig.position.z);
        if (v.wait <= 0) v.i = (v.i + 1) % v.route.length;
        continue;
      }
      const dx = stop.x - v.fig.position.x, dz = stop.z - v.fig.position.z;
      const d = Math.hypot(dx, dz);
      // let the visitor pass
      if (Math.hypot(player.x - v.fig.position.x, player.z - v.fig.position.z) < 1.3) {
        rest(v.fig, t + v.phase);
        continue;
      }
      if (d < 0.15) {
        v.wait = stop.pray ?? 0.4;
        continue;
      }
      const step = Math.min(d, 1.05 * dt);
      v.fig.position.x += (dx / d) * step;
      v.fig.position.z += (dz / d) * step;
      v.walk += step * 5.2;
      walk(v.fig, v.walk);
      v.fig.position.y = this.ground(v.fig.position.x, v.fig.position.z) + Math.abs(Math.cos(v.walk)) * 0.018;
      const want = Math.atan2(dx, dz);
      let diff = want - v.fig.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      v.fig.rotation.y += diff * Math.min(1, dt * 5);
    }
  }
}

/* ------------------------------------------------------------------ */
/* arrival by boat                                                      */
/* ------------------------------------------------------------------ */
export class Arrival {
  readonly boat = new THREE.Group();
  private oar: THREE.Group;
  private t = 0;
  readonly dur = 15;
  private from = new THREE.Vector3(-46, -0.35, 96);
  private to = new THREE.Vector3(-1.5, -0.35, 69);
  done = false;

  constructor(scene: THREE.Scene) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x5b3b22, roughness: 0.85 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a2617, roughness: 0.9 });
    // hull: a flat bottom, sides leaning out, pointed bow and stern
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.9), wood);
    this.boat.add(bottom);
    [-1, 1].forEach((sd) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.46, 0.08), wood);
      side.position.set(0, 0.22, sd * 0.5);
      side.rotation.x = sd * 0.28;
      this.boat.add(side);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.3, 4), wood);
      tip.rotation.z = sd * -Math.PI / 2;
      tip.rotation.x = Math.PI / 4;
      tip.position.set(sd * 3.4, 0.2, 0);
      tip.scale.set(1, 1, 0.75);
      this.boat.add(tip);
    });
    // bamboo canopy (mui)
    const mui = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.8, 12, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x9c7a46, roughness: 0.95, side: THREE.DoubleSide }));
    mui.rotation.z = Math.PI / 2;
    mui.position.set(0.4, 0.2, 0);
    this.boat.add(mui);
    // the boatwoman at the stern with a conical hat
    const woman = person({ sex: 'f', outfit: 'aonau', robe: 0x4a3828, under: 0x8a5a3b, trousers: 0x1c1714, hair: 'bun', hat: 'non', h: 1.52 });
    woman.position.set(-2.6, -0.06, 0);
    woman.rotation.y = Math.PI / 2;
    // both hands on the oar
    woman.userData.j.arms.forEach((a, i) => {
      a.sh.rotation.set(-0.9, 0, (i ? -1 : 1) * 0.35);
      a.el.rotation.set(-0.7, 0, 0);
    });
    this.boat.add(woman);
    this.oar = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3, 6), dark);
    shaft.rotation.z = 1.1;
    shaft.position.set(-0.6, 0.6, 0);
    this.oar.add(shaft);
    this.oar.position.set(-2.5, 0.8, 0.25);
    this.boat.add(this.oar);
    // a little lantern at the bow
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc81e1e, emissive: 0xff7a3a, emissiveIntensity: 0.9 }));
    lantern.position.set(3.1, 0.75, 0);
    const ll = new THREE.PointLight(0xffa860, 1.2, 8, 2);
    ll.position.copy(lantern.position);
    this.boat.add(lantern, ll);
    this.boat.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    scene.add(this.boat);
  }

  /** 0..1 progress */
  get progress() {
    return Math.min(1, this.t / this.dur);
  }

  update(dt: number, cam: THREE.PerspectiveCamera, look: THREE.Vector3) {
    this.t += dt;
    const p = this.progress;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    // the boat glides along a gentle curve toward the landing
    const bx = THREE.MathUtils.lerp(this.from.x, this.to.x, e) + Math.sin(e * Math.PI) * 6;
    const bz = THREE.MathUtils.lerp(this.from.z, this.to.z, e);
    const ahead = Math.min(1, e + 0.02);
    const nx = THREE.MathUtils.lerp(this.from.x, this.to.x, ahead) + Math.sin(ahead * Math.PI) * 6;
    const nz = THREE.MathUtils.lerp(this.from.z, this.to.z, ahead);
    this.boat.position.set(bx, -0.3 + Math.sin(this.t * 1.3) * 0.05, bz);
    this.boat.rotation.y = Math.atan2(-(nz - bz), nx - bx);
    this.boat.rotation.z = Math.sin(this.t * 0.9) * 0.02;
    this.oar.rotation.y = Math.sin(this.t * 1.6) * 0.5;
    // camera: a wide shot from behind and above, settling into the bow as you arrive
    const k = THREE.MathUtils.smoothstep(p, 0.35, 0.95);
    const yaw = this.boat.rotation.y;
    const back = new THREE.Vector3(-Math.cos(yaw), 0, Math.sin(yaw));
    const wide = this.boat.position.clone().addScaledVector(back, 11).add(new THREE.Vector3(0, 4.2, 0)).add(new THREE.Vector3(Math.sin(yaw) * 5, 0, Math.cos(yaw) * 5));
    const bow = this.boat.position.clone().addScaledVector(back, -2.2).add(new THREE.Vector3(0, 1.55, 0));
    cam.position.lerpVectors(wide, bow, k);
    look.lerpVectors(this.boat.position.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3(0, 3.2, 40), Math.min(1, k * 1.3));
    cam.lookAt(look);
    if (p >= 1) this.done = true;
  }

  /** after you step ashore the boat drifts away and vanishes */
  leave(dt: number) {
    this.boat.position.x += dt * 2.2;
    this.boat.position.z += dt * 0.6;
    if (this.boat.position.x > 60) this.boat.visible = false;
  }
}

/* ------------------------------------------------------------------ */
/* a hầu đồng in progress, inside the main hall                         */
/* ------------------------------------------------------------------ */
export interface GiaLook {
  robe: number;
  under: number;
  aura: number;
  prop: 'none' | 'fans' | 'sword' | 'cup' | 'baskets';
  veiled: boolean;
  dance: 'still' | 'sway' | 'spin' | 'stride' | 'skip';
}
/** the spirits as they come and go while nobody is watching closely */
export const AMBIENT_GIA: GiaLook[] = [
  { robe: 0xc81e1e, under: 0xe8b830, aura: 0xff6b4a, prop: 'none', veiled: true, dance: 'still' },
  { robe: 0xf3efe4, under: 0x2f5a8a, aura: 0xbfe3ff, prop: 'sword', veiled: false, dance: 'stride' },
  { robe: 0x3f8a3a, under: 0xe8b830, aura: 0x7dffa0, prop: 'fans', veiled: false, dance: 'spin' },
  { robe: 0xe8b830, under: 0xc81e1e, aura: 0xffd84a, prop: 'cup', veiled: false, dance: 'sway' },
  { robe: 0x8db27a, under: 0xe7a28f, aura: 0xff9ad6, prop: 'baskets', veiled: false, dance: 'skip' },
];

const mat = (c: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...extra });

export class Ceremony {
  private g = new THREE.Group();
  private y0: number;
  /** the medium: a figure with arms we can move, a veil, and props */
  private medium = new THREE.Group();
  private body: Person;
  private robeMats: THREE.MeshStandardMaterial[] = [];
  private underMats: THREE.MeshStandardMaterial[] = [];
  private veil: THREE.Mesh;
  private arms: THREE.Group[] = [];
  private props: Record<string, THREE.Group> = {};
  private light = new THREE.PointLight(0xffb070, 2.2, 14, 2);
  private auraLight = new THREE.PointLight(0xffffff, 0, 10, 2);
  private column: THREE.Mesh;
  private ring: THREE.Points;
  private ringPos: Float32Array;
  private bursts: { m: THREE.Mesh; t: number }[] = [];
  private loc: { m: THREE.Mesh; v: THREE.Vector3; t: number }[] = [];
  private drum: THREE.Mesh;
  private lutist: THREE.Group;
  private look: GiaLook = AMBIENT_GIA[0];
  private energy = 0;
  /** someone is sitting on the mat and keeping the beat */
  watching = false;
  /** someone is inside the medium: the body is hidden and the camera wears it */
  possessed = false;
  /** the medium has felt a touch: it stops, and turns to look at whoever touched it */
  private stare: { at: THREE.Vector3; t: number } | null = null;
  private watchGia = 0;
  private beatPulse = 0;

  constructor(private scene: THREE.Scene, ground: Ground) {
    this.y0 = ground(0, -10.6);
    const y = this.y0;
    // the red mat and a low tray of offerings
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.2), mat(0xb8382b, { roughness: 0.95 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, y + 0.02, -10.8);
    this.g.add(rug);
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.12, 14), mat(0xd6a12b, { metalness: 0.4 }));
    tray.position.set(0, y + 0.06, -12.1);
    this.g.add(tray);

    // the medium: in ritual robes with wide sleeves, the red khăn phủ diện over the head
    const med = person({ sex: 'f', outfit: 'robe', robe: 0xc81e1e, under: 0xe8b830, trousers: 0xf1ece0, hair: 'bun', wideSleeves: true, h: 1.6 });
    this.body = med;
    const mj = med.userData.j;
    this.robeMats.push(mj.mats.robe);
    this.underMats.push(mj.mats.under);
    const khan = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 22), mj.mats.under);
    khan.rotation.x = Math.PI / 2 - 0.15;
    khan.position.set(0, 0.17, -0.008);
    mj.head.add(khan);
    this.arms = mj.arms.map((a) => a.sh);
    mj.arms.forEach((a) => (a.el.rotation.x = -0.35));
    // khăn phủ diện: the red veil, falling from the crown to the shoulders
    const veilGeo = new THREE.CylinderGeometry(0.075, 0.2, 0.36, 18, 3, true);
    veilGeo.translate(0, -0.06, 0);
    this.veil = new THREE.Mesh(veilGeo, mat(0xc81e1e, { side: THREE.DoubleSide, emissive: 0x3a0800 }));
    this.veil.position.y = 0.16;
    const crownCap = new THREE.Mesh(new THREE.SphereGeometry(0.076, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.veil.material);
    crownCap.position.y = 0.12;
    this.veil.add(crownCap);
    mj.head.add(this.veil);
    // props, held in the hands (offsets measured from the palm)
    const fan = () => {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16, 0, Math.PI), mat(0xe8b830, { side: THREE.DoubleSide, emissive: 0x3a2a00 }));
      f.position.y = -0.18;
      return f;
    };
    this.props.fans = new THREE.Group();
    this.props.sword = new THREE.Group();
    this.props.cup = new THREE.Group();
    this.props.baskets = new THREE.Group();
    mj.arms.forEach(({ hand: a }, i) => {
      const f = fan();
      f.userData.prop = 'fans';
      a.add(f);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.12, 10), mat(0x9c7a46));
      b.position.y = -0.1;
      b.userData.prop = 'baskets';
      const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(0xf29bb8, { emissive: 0x4a1020 }));
      fl.position.y = 0.08;
      b.add(fl);
      a.add(b);
      if (i === 1) {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.06), mat(0xd8dde2, { metalness: 0.8, roughness: 0.25 }));
        sw.position.y = -0.41;
        sw.userData.prop = 'sword';
        a.add(sw);
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.08, 10), mat(0xd6a12b, { metalness: 0.5 }));
        cup.position.y = -0.06;
        cup.userData.prop = 'cup';
        a.add(cup);
      }
    });
    this.medium.add(this.body);
    this.medium.position.set(0, y, -11);
    this.medium.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    this.g.add(this.medium);

    // the aura: a soft column of light, a ring of motes, a coloured light
    this.column = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 4.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.column.position.set(0, y + 2, -11);
    this.g.add(this.column);
    const N = 90;
    this.ringPos = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.ringPos, 3));
    this.ring = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.g.add(this.ring);
    this.auraLight.position.set(0, y + 1.4, -10.4);
    this.g.add(this.auraLight);

    // the cung văn band and attendants
    this.lutist = person({ sex: 'm', outfit: 'aothe', robe: 0x1f2a3e, hair: 'khanxep', pose: 'kneel', h: 1.62, trousers: 0x2a2620 });
    (this.lutist as Person).userData.j.arms.forEach((a, i) => {
      a.sh.rotation.set(-0.75, 0, (i ? -1 : 1) * 0.3);
      a.el.rotation.set(-0.6, 0, 0);
    });
    this.lutist.position.set(-2.3, y, -9.7);
    const lute = new THREE.Group();
    const bodyL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), mat(0xd6a12b));
    bodyL.rotation.x = Math.PI / 2;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.04), mat(0x5b3b22));
    neck.position.set(0.25, 0.32, 0);
    neck.rotation.z = -0.6;
    lute.add(bodyL, neck);
    lute.position.set(0.04, 0.62, 0.3);
    lute.rotation.x = -0.2;
    this.lutist.add(lute);
    this.g.add(this.lutist);
    const clapper = person({ sex: 'm', elder: true, outfit: 'aothe', robe: 0x3a2a20, hair: 'khanxep', pose: 'kneel', h: 1.6, trousers: 0x2a2620 });
    clapper.position.set(-2.9, y, -11.2);
    this.g.add(clapper);
    this.drum = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.42, 16), mat(0xb8382b));
    this.drum.position.set(2.5, y + 0.21, -9.9);
    const skinTop = new THREE.Mesh(new THREE.CircleGeometry(0.33, 16), mat(0xf3ead6));
    skinTop.rotation.x = -Math.PI / 2;
    skinTop.position.y = 0.22;
    this.drum.add(skinTop);
    this.g.add(this.drum);
    const drummer = person({ sex: 'm', outfit: 'aothe', robe: 0x1f2a3e, hair: 'khanxep', pose: 'kneel', h: 1.62, trousers: 0x2a2620 });
    drummer.userData.j.arms.forEach((a, i) => {
      a.sh.rotation.set(-0.7, 0, (i ? -1 : 1) * 0.2);
      a.el.rotation.set(-0.5, 0, 0);
    });
    drummer.position.set(3.1, y, -10.3);
    this.g.add(drummer);
    [
      [-1.4, -12.3],
      [1.4, -12.3],
    ].forEach(([x, z]) => {
      const f = person({ sex: 'f', outfit: 'aodai', robe: 0xf1ead8, hair: 'bun', pose: 'kneel', h: 1.55 });
      pray(f, 1);
      f.position.set(x, y, z);
      this.g.add(f);
    });
    [this.lutist, clapper, drummer].forEach((f) => f.lookAt(0, y, -11));

    this.light.position.set(0, y + 3, -10.5);
    this.g.add(this.light);
    scene.add(this.g);
    this.apply(AMBIENT_GIA[0]);
  }

  /** dress the medium for a spirit */
  apply(look: GiaLook) {
    this.look = look;
    this.robeMats.forEach((m) => m.color.setHex(look.robe));
    this.underMats.forEach((m) => m.color.setHex(look.under));
    this.veil.visible = look.veiled;
    this.medium.traverse((o) => {
      const p = o.userData.prop;
      if (p) o.visible = p === look.prop;
    });
    (this.column.material as THREE.MeshBasicMaterial).color.setHex(look.aura);
    (this.ring.material as THREE.PointsMaterial).color.setHex(look.aura);
    this.auraLight.color.setHex(look.aura);
  }
  setEnergy(e: number) {
    this.energy = e;
  }
  /** a kept beat: a ring of light bursts from the medium */
  burst() {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: this.look.aura, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2;
    m.position.set(this.medium.position.x, this.y0 + 1.1, -11);
    this.g.add(m);
    this.bursts.push({ m, t: 0 });
    this.beatPulse = 1;
  }
  /** did this ray touch the medium? */
  hit(ray: THREE.Raycaster) {
    return !this.possessed && ray.intersectObject(this.body, true).length > 0;
  }
  /** where the medium's eyes are */
  head(out = new THREE.Vector3()) {
    return out.set(this.medium.position.x, this.medium.position.y + 1.5, this.medium.position.z);
  }
  get currentLook() {
    return this.look;
  }
  /** stop dancing and turn the veiled head toward someone, for a few seconds */
  stareAt(p: THREE.Vector3, sec = 4) {
    this.stare = { at: p.clone(), t: sec };
  }
  setPossessed(on: boolean) {
    this.possessed = on;
    this.medium.visible = !on;
    // from inside, the aura column would wrap the whole view
    this.column.visible = !on;
  }
  /** at the end the spirits scatter lộc over everyone */
  scatterLoc(n = 26, dir?: THREE.Vector3) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.18), new THREE.MeshStandardMaterial({ color: 0xc81e1e, side: THREE.DoubleSide, emissive: 0x3a0800 }));
      m.position.set(this.medium.position.x, this.y0 + 1.5, -11);
      this.g.add(m);
      const v = dir
        ? dir.clone().multiplyScalar(2.5 + Math.random() * 2.5).add(new THREE.Vector3((Math.random() - 0.5) * 2, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 2))
        : new THREE.Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 2, 2 + Math.random() * 3);
      this.loc.push({ m, v, t: 0 });
    }
  }
  /** while someone watches, the app chooses the spirit; otherwise they change every half minute */
  setWatchGia(i: number, look: GiaLook) {
    this.watchGia = i;
    this.apply(look);
  }

  update(t: number, dt = 1 / 60) {
    if (this.stare) {
      // frozen, facing you; the veil breathes
      this.stare.t -= dt;
      const m = this.medium;
      const want = Math.atan2(this.stare.at.x - m.position.x, this.stare.at.z - m.position.z);
      m.rotation.y += Math.atan2(Math.sin(want - m.rotation.y), Math.cos(want - m.rotation.y)) * Math.min(1, dt * 5);
      this.body.rotation.x = -0.06 + Math.sin(t * 9) * 0.008;
      this.arms.forEach((a, i) => a.rotation.set(-0.15, 0, (i ? 1 : -1) * 0.12));
      if (this.stare.t <= 0) this.stare = null;
      return;
    }
    if (!this.watching && !this.possessed) {
      const gi = Math.floor(t / 30) % AMBIENT_GIA.length;
      if (AMBIENT_GIA[gi] !== this.look) this.apply(AMBIENT_GIA[gi]);
      this.energy = 0.35 + Math.sin(t * 0.7) * 0.1;
    }
    const L = this.look;
    const e = this.energy;
    // dance
    const s = t * (L.dance === 'skip' ? 3.2 : L.dance === 'spin' ? 2.4 : 1.8);
    const m = this.medium;
    m.rotation.y = L.dance === 'spin' ? s * 0.9 : L.dance === 'still' ? 0 : Math.sin(s) * 0.7;
    m.position.x = L.dance === 'stride' ? Math.sin(s * 0.5) * 0.9 : L.dance === 'still' ? 0 : Math.sin(s * 0.5) * 0.4;
    m.position.y = this.y0 + (L.dance === 'skip' ? Math.abs(Math.sin(s * 2)) * 0.12 : L.dance === 'still' ? 0 : Math.abs(Math.sin(s * 2)) * 0.04);
    this.body.rotation.x = L.dance === 'still' ? Math.sin(t * 0.8) * 0.03 : 0;
    this.arms.forEach((a, i) => {
      const sd = i === 0 ? -1 : 1;
      if (L.dance === 'still') a.rotation.set(-0.6, 0, sd * 0.2);
      else if (L.prop === 'fans' || L.prop === 'baskets') a.rotation.set(Math.sin(s * 2 + i) * 0.5 - 0.4, 0, sd * (1.3 + Math.sin(s * 2 + i * 1.5) * 0.6));
      else if (L.prop === 'sword') a.rotation.set(i ? Math.sin(s * 1.5) * 1.2 - 1.2 : -0.3, 0, sd * (i ? 0.9 + Math.sin(s * 3) * 0.5 : 0.4));
      else a.rotation.set(-0.9 + Math.sin(s * 1.2 + i) * 0.4, 0, sd * 0.7);
    });
    // aura grows with the room's energy (and the beat)
    this.beatPulse = Math.max(0, this.beatPulse - dt * 3);
    const k = Math.min(1, e + this.beatPulse * 0.3);
    (this.column.material as THREE.MeshBasicMaterial).opacity = 0.05 + k * 0.32;
    this.column.scale.set(0.8 + k * 0.6, 1, 0.8 + k * 0.6);
    this.column.position.x = m.position.x;
    (this.ring.material as THREE.PointsMaterial).opacity = 0.2 + k * 0.8;
    const n = this.ringPos.length / 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * (0.6 + (i % 3) * 0.2);
      const r = 1.1 + k * 0.9 + Math.sin(t * 2 + i) * 0.1;
      this.ringPos[i * 3] = m.position.x + Math.cos(a) * r;
      this.ringPos[i * 3 + 1] = this.y0 + 0.2 + ((i * 0.37 + t * (0.5 + k)) % 3.2);
      this.ringPos[i * 3 + 2] = -11 + Math.sin(a) * r;
    }
    (this.ring.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.auraLight.intensity = 0.4 + k * 3.2;
    this.light.intensity = 1.6 + Math.sin(t * 6) * 0.2;
    // musicians
    this.drum.scale.y = 1 - this.beatPulse * 0.06;
    this.lutist.rotation.z = Math.sin(t * 5) * 0.02;
    // bursts and lộc
    this.bursts = this.bursts.filter((b) => {
      b.t += dt;
      b.m.scale.setScalar(1 + b.t * 4);
      (b.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - b.t * 1.5);
      if (b.t > 0.6) {
        this.g.remove(b.m);
        return false;
      }
      return true;
    });
    this.loc = this.loc.filter((l) => {
      l.t += dt;
      l.v.y -= 4.5 * dt;
      l.m.position.addScaledVector(l.v, dt);
      l.m.rotation.x += dt * 6;
      l.m.rotation.y += dt * 4;
      if (l.m.position.y < this.y0 + 0.05 || l.t > 4) {
        l.m.position.y = Math.max(l.m.position.y, this.y0 + 0.03);
        return l.t < 6;
      }
      return true;
    });
  }
  dispose(scene: THREE.Scene) {
    scene.remove(this.g);
  }
}
