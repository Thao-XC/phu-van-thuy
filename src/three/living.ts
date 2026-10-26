import * as THREE from 'three';
import { person, walk, pray, rest, type Person, type PersonOpts } from './kit/people';
import { makeBoat } from './kit/boat';

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
  readonly dur = 17;
  private from = new THREE.Vector3(-46, -0.35, 96);
  private to = new THREE.Vector3(-1.9, -0.35, 69.2);
  done = false;

  private seatEye: THREE.Vector3;
  constructor(private scene: THREE.Scene) {
    const b = makeBoat();
    this.boat.add(b.g);
    this.oar = b.oar;
    this.seatEye = b.seatEye;
    // the boatwoman stands at the stern, facing forward, working the long oar
    const woman = person({ sex: 'f', outfit: 'aonau', robe: 0x4a3828, under: 0x8a5a3b, trousers: 0x1c1714, hair: 'bun', hat: 'non', h: 1.52 });
    woman.position.set(-2.6, -0.08, -0.12);
    woman.rotation.y = Math.PI / 2 + 0.35;
    woman.userData.j.arms.forEach((a, i) => {
      a.sh.rotation.set(-0.95, 0, (i ? -1 : 1) * 0.15);
      a.el.rotation.set(-0.55, 0, 0);
    });
    this.woman = woman;
    this.boat.add(woman);
    scene.add(this.boat);
  }
  private woman: Person;
  /** tie up at the landing straight away (for visits that skip the ride) */
  moorNow() {
    this.t = this.dur;
    this.done = true;
    const e = 1, ahead = 0.98;
    const bx = this.to.x, bz = this.to.z;
    const px = THREE.MathUtils.lerp(this.from.x, this.to.x, ahead) + Math.sin(ahead * Math.PI) * 6;
    const pz = THREE.MathUtils.lerp(this.from.z, this.to.z, ahead);
    void e;
    this.boat.position.set(bx, -0.3, bz);
    this.boat.rotation.y = Math.atan2(-(bz - pz), bx - px);
  }
  /** waiting at the landing: rocking a little on the current */
  moor(t: number) {
    this.boat.position.y = -0.3 + Math.sin(t * 1.1) * 0.03;
    this.boat.rotation.z = Math.sin(t * 0.8) * 0.012;
    this.boat.rotation.x = Math.sin(t * 0.6 + 1) * 0.015;
    this.oar.rotation.y = Math.sin(t * 0.4) * 0.08;
  }
  /** where a seated passenger's eyes are, in the world */
  seatWorld() {
    this.boat.updateMatrixWorld(true);
    return this.boat.localToWorld(this.seatEye.clone());
  }
  dispose() {
    this.scene.remove(this.boat);
  }

  /** where you will stand on the landing when you step ashore (set by the scene) */
  land = new THREE.Vector3(0, 1.6, 64);
  /** the last seconds: you stand up in the boat and step onto the landing */
  readonly stepDur = 3.4;
  private splashT = 0;
  private stepped = 0;
  onSplash?: () => void;
  onStep?: () => void;

  /** 0..1 progress of the ride itself */
  get progress() {
    return Math.min(1, this.t / (this.dur - this.stepDur));
  }
  get stepping() {
    return this.t > this.dur - this.stepDur;
  }

  /**
   * You ride in the boat, sitting on the thwart just ahead of the canopy, facing the bow.
   * lookYaw / lookPitch are your own glances (mouse), added on top of where the boat points.
   */
  update(dt: number, cam: THREE.PerspectiveCamera, lookYaw = 0, lookPitch = 0) {
    this.t += dt;
    const p = this.progress;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const bx = THREE.MathUtils.lerp(this.from.x, this.to.x, e) + Math.sin(e * Math.PI) * 6;
    const bz = THREE.MathUtils.lerp(this.from.z, this.to.z, e);
    const ahead = Math.min(1, e + 0.02);
    const nx = THREE.MathUtils.lerp(this.from.x, this.to.x, ahead) + Math.sin(ahead * Math.PI) * 6;
    const nz = THREE.MathUtils.lerp(this.from.z, this.to.z, ahead);
    const calm = this.stepping ? 0.4 : 1;
    this.boat.position.set(bx, -0.3 + Math.sin(this.t * 1.3) * 0.05 * calm, bz);
    if (p < 0.995) this.boat.rotation.y = Math.atan2(-(nz - bz), nx - bx);
    this.boat.rotation.z = Math.sin(this.t * 0.9) * 0.02 * calm; // pitching bow to stern
    this.boat.rotation.x = Math.sin(this.t * 0.7 + 1) * 0.025 * calm; // rolling side to side
    this.oar.rotation.y = this.stepping ? 0 : Math.sin(this.t * 1.6) * 0.5;
    this.boat.updateMatrixWorld(true);
    // the paddle dips: a splash every stroke
    this.splashT += dt;
    if (!this.stepping && this.splashT > 1.95) {
      this.splashT = 0;
      this.onSplash?.();
    }

    // sitting in the boat: eyes a little under a metre above the floorboards
    const seat = this.boat.localToWorld(this.seatEye.clone());
    const fwd = new THREE.Vector3(1, 0, 0).applyQuaternion(this.boat.quaternion);
    const boatYaw = Math.atan2(-fwd.x, -fwd.z);
    // toward the end you turn your head to the landing and the gate beyond it
    const toTemple = Math.atan2(-(0 - seat.x), -(40 - seat.z));
    let dYaw = toTemple - boatYaw;
    dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
    const turn = THREE.MathUtils.smoothstep(p, 0.6, 0.95);
    const drift = Math.sin(this.t * 0.35) * 0.35 * (1 - turn); // looking around at the river and hills
    let yaw = boatYaw + dYaw * turn + drift + lookYaw;
    let pitch = -0.04 + lookPitch + this.boat.rotation.z * 0.6;
    let roll = this.boat.rotation.x * 0.7;

    if (!this.stepping) {
      cam.position.copy(seat);
    } else {
      // stand up, steady yourself, and step across onto the landing, then walk to its middle
      const k = (this.t - (this.dur - this.stepDur)) / this.stepDur;
      const rise = THREE.MathUtils.smoothstep(k, 0, 0.3);
      const walk = THREE.MathUtils.smoothstep(k, 0.3, 1);
      const standing = seat.clone().add(new THREE.Vector3(0, 0.62 * rise, 0));
      cam.position.lerpVectors(standing, this.land, walk);
      // a step's rise and fall, three steps
      cam.position.y += Math.abs(Math.sin(walk * Math.PI * 3)) * 0.05 * (walk > 0 && walk < 1 ? 1 : 0) - (k < 0.3 ? Math.sin(rise * Math.PI) * 0.04 : 0);
      const steps = Math.floor(walk * 3 + 0.5);
      if (steps > this.stepped) {
        this.stepped = steps;
        this.onStep?.();
      }
      // turn to face up the path to the temple (yaw 0 looks along -z)
      const face = THREE.MathUtils.smoothstep(k, 0.15, 0.9);
      let dy = 0 - yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      yaw += dy * face;
      pitch *= 1 - face;
      roll *= 1 - rise;
    }
    cam.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
    if (this.t >= this.dur) this.done = true;
  }

  /** going home: the boat backs off the landing and heads out the way it came */
  depart(dt: number, k: number) {
    const yaw = this.boat.rotation.y;
    const fwd = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    // reverse off the landing, then swing round and away
    this.boat.position.addScaledVector(fwd, -dt * (0.6 + k * 2.4));
    this.boat.rotation.y += dt * 0.25 * Math.min(1, k * 2);
    this.oar.rotation.y = Math.sin(k * 30) * 0.5;
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
    // the offerings sit on a low red-lacquered table (kỷ), never on the mat itself
    const table = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.6), mat(0x8f1f17, { roughness: 0.4 }));
    top.position.y = 0.42;
    table.add(top);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.07), mat(0x5a1410));
      leg.position.set(sx * 0.48, 0.2, sz * 0.24);
      table.add(leg);
    }));
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.08, 18), mat(0xd6a12b, { metalness: 0.45, roughness: 0.35 }));
    tray.position.y = 0.49;
    table.add(tray);
    [0xe2b23a, 0xf08a2a, 0xc81e1e, 0x8db27a, 0xf2e6c8].forEach((c, i) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(c, { roughness: 0.5 }));
      f.position.set(Math.cos(i * 1.26) * 0.14, 0.58, Math.sin(i * 1.26) * 0.14);
      table.add(f);
    });
    table.position.set(0, y, -12.4);
    this.g.add(table);

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

/* ------------------------------------------------------------------ */
/* the people who belong to the temple: always busy with something      */
/* ------------------------------------------------------------------ */
type Busy = { fig: Person; at: THREE.Vector3; update: (t: number, dt: number) => void; when: 'day' | 'always' };

/**
 * Residents and regulars, each doing what people do at a temple: an old man sweeping the
 * courtyard, two elders over tea by the keeper, a devotee bowing with incense at the great
 * burner, someone feeding paper offerings to the furnace, the amulet-stall seller, two women
 * kneeling in prayer in the hall, and children chasing each other near the gate.
 */
export class Residents {
  private list: Busy[] = [];
  private g = new THREE.Group();

  constructor(scene: THREE.Scene, private ground: Ground, floorY: number) {
    const gy = (x: number, z: number) => this.ground(x, z);
    const add = (fig: Person, x: number, z: number, face: number, when: Busy['when'], update: Busy['update']) => {
      fig.position.set(x, gy(x, z), z);
      fig.rotation.y = face;
      this.g.add(fig);
      this.list.push({ fig, at: new THREE.Vector3(x, 0, z), update, when });
    };
    const wood = new THREE.MeshStandardMaterial({ color: 0x5b3b22, roughness: 0.7 });

    // 1. the sweeper: a chổi rơm broom, long slow strokes back and forth across the brick
    const sweeper = person({ sex: 'm', elder: true, outfit: 'aonau', robe: 0x6b5a44, trousers: 0x2a2620, hair: 'khanxep', h: 1.6 });
    const broom = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 6), wood);
    handle.position.y = -0.55;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 10), new THREE.MeshStandardMaterial({ color: 0xc8a75a, roughness: 0.95 }));
    head.position.y = -1.25;
    broom.add(handle, head);
    broom.rotation.x = 0.5;
    sweeper.userData.j.arms[1].hand.add(broom);
    add(sweeper, 10, 24, Math.PI / 2, 'day', (t) => {
      const j = sweeper.userData.j;
      const u = (Math.sin(t * 0.12) + 1) / 2; // drifting slowly along a row of bricks
      sweeper.position.x = 8 + u * 6;
      sweeper.position.z = 24 + Math.sin(t * 0.05) * 3;
      sweeper.rotation.y = Math.cos(t * 0.12) > 0 ? Math.PI / 2 : -Math.PI / 2;
      j.torso.rotation.x = 0.35;
      j.arms.forEach((a, i) => {
        a.sh.rotation.set(-0.7 + Math.sin(t * 2.2) * 0.35, 0, (i ? -1 : 1) * 0.25);
        a.el.rotation.set(-0.5, 0, 0);
      });
      j.legs.forEach((l) => (l.hip.rotation.x = l.knee.rotation.x = 0));
    });

    // 2. tea by the keeper: a low table, a pot, two elders kneeling and talking
    const table = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: 0x6a3a20, roughness: 0.5 }));
    top.position.y = 0.32;
    table.add(top);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), wood);
      leg.position.set(sx * 0.4, 0.15, sz * 0.25);
      table.add(leg);
    }));
    const porcelain = new THREE.MeshStandardMaterial({ color: 0xeef2f0, roughness: 0.3 });
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), porcelain);
    pot.position.set(0, 0.42, 0);
    table.add(pot);
    [-0.2, 0.2].forEach((x) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.04, 10), porcelain);
      cup.position.set(x, 0.37, 0.12);
      table.add(cup);
    });
    table.position.set(6.8, gy(6.8, 19.6), 19.6);
    this.g.add(table);
    [[6.1, 19.6, Math.PI / 2], [7.5, 19.6, -Math.PI / 2]].forEach(([x, z, face], i) => {
      const elder = person({ sex: i ? 'f' : 'm', elder: true, outfit: i ? 'aonau' : 'aothe', robe: i ? 0x5b3a2a : 0x1f2a3e, hair: i ? 'khanvan' : 'khanxep', pose: 'kneel', h: 1.58 });
      add(elder, x, z, face, 'day', (t) => {
        const j = elder.userData.j;
        // one talks with a hand, the other lifts a cup now and then
        const sip = Math.max(0, Math.sin(t * 0.4 + i * 2)) > 0.92;
        j.arms[1].sh.rotation.set(sip ? -1.3 : -0.5 + Math.sin(t * (i ? 1.1 : 1.7)) * 0.15, 0, -0.2);
        j.arms[1].el.rotation.set(sip ? -1.6 : -0.9, 0, 0);
        j.arms[0].sh.rotation.set(-0.4, 0, 0.2);
        j.arms[0].el.rotation.set(-0.8, 0, 0);
        j.head.rotation.y = Math.sin(t * 0.3 + i) * 0.25;
        j.head.rotation.x = Math.sin(t * 1.3 + i) * 0.05;
      });
    });

    // 3. a devotee with incense at the great burner: raise, bow, again
    const devotee = person({ sex: 'f', outfit: 'aodai', robe: 0x9e2a1e, hair: 'bun', h: 1.55 });
    const sticks = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 5), new THREE.MeshStandardMaterial({ color: 0xb5332a }));
    sticks.position.set(0, -0.08, 0.06);
    devotee.userData.j.arms[1].hand.add(sticks);
    add(devotee, 0.4, 15.9, Math.PI, 'always', (t) => {
      const k = (Math.sin(t * 0.9) + 1) / 2;
      pray(devotee, 1, k);
    });

    // 4. at the furnace: feeding gold paper to the fire
    const burnerP = person({ sex: 'm', outfit: 'aothe', robe: 0x34507a, trousers: 0x2a2620, hair: 'short', h: 1.66 });
    add(burnerP, 14.6, 11.7, Math.PI - 0.6, 'day', (t) => {
      const j = burnerP.userData.j;
      const feed = (Math.sin(t * 1.2) + 1) / 2;
      j.torso.rotation.x = 0.15 + feed * 0.2;
      j.arms.forEach((a, i) => {
        a.sh.rotation.set(-0.6 - feed * 0.6, 0, (i ? -1 : 1) * 0.2);
        a.el.rotation.set(-0.4, 0, 0);
      });
    });

    // 5. the amulet seller behind her stall, arranging, calling softly
    const seller = person({ sex: 'f', outfit: 'aonau', robe: 0x8a5a3b, under: 0x2a2420, hair: 'bun', hat: 'non', h: 1.52 });
    add(seller, 10.35, 33.1, Math.PI - 0.4, 'day', (t) => {
      const j = seller.userData.j;
      j.arms.forEach((a, i) => {
        a.sh.rotation.set(-0.7 + Math.sin(t * 1.4 + i) * 0.2, 0, (i ? -1 : 1) * 0.3);
        a.el.rotation.set(-0.7, 0, 0);
      });
      j.head.rotation.y = Math.sin(t * 0.25) * 0.5;
    });

    // 6. two women kneeling before the altar, bowing slowly
    [[-3.3, -6.9], [-1.7, -7.3]].forEach(([x, z], i) => {
      const w = person({ sex: 'f', elder: i === 0, outfit: i ? 'aodai' : 'aonau', robe: i ? 0xf1ead8 : 0x5b3a2a, hair: i ? 'bun' : 'khanvan', pose: 'kneel', h: 1.55 });
      w.position.y = floorY;
      add(w, x, z, Math.PI, 'always', (t) => {
        w.position.y = floorY;
        pray(w, 1, Math.max(0, Math.sin(t * 0.55 + i * 1.7)) * 1.1);
      });
    });

    // 7. children chasing each other round and round near the gate
    [0, 1].forEach((i) => {
      const kid = person({ sex: i ? 'm' : 'f', outfit: i ? 'aothe' : 'aonau', robe: i ? 0x2f7a5a : 0xc8302a, trousers: 0x2a2620, hair: i ? 'short' : 'bun', h: 1.12 });
      let ph = i * 0.9;
      add(kid, -7, 31, 0, 'day', (t, dt) => {
        ph += dt * 1.4;
        const cx = -7.5, cz = 30.5, r = 2.4;
        kid.position.x = cx + Math.cos(ph) * r;
        kid.position.z = cz + Math.sin(ph) * r;
        kid.position.y = this.ground(kid.position.x, kid.position.z) + Math.abs(Math.sin(t * 9 + i)) * 0.05;
        kid.rotation.y = -ph; // facing along the circle
        walk(kid, t * 9 + i * 2, 1.3);
      });
    });

    this.g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    scene.add(this.g);
  }

  update(dt: number, t: number, player: THREE.Vector3, night: boolean, visible: boolean) {
    this.g.visible = visible;
    if (!visible) return;
    for (const b of this.list) {
      const on = (b.when === 'always' || !night) && Math.hypot(player.x - b.fig.position.x, player.z - b.fig.position.z) < 45;
      b.fig.visible = on;
      if (on) b.update(t, dt);
    }
  }
}
