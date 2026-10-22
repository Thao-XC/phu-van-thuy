import * as THREE from 'three';
import { robedFigure } from './encounters/figures';

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
  fig: THREE.Group;
  route: Stop[];
  i: number;
  wait: number;
  phase: number;
}

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
      const fig = robedFigure({ robe: r.robe, under: r.under, h: r.h, hat: 'none' });
      // khăn vấn turban
      const khan = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 6, 14), new THREE.MeshStandardMaterial({ color: r.under === 0xf1ead8 ? 0x2a2a2a : r.under, roughness: 0.8 }));
      khan.rotation.x = Math.PI / 2;
      khan.position.y = 1.52 * (r.h / 1.7);
      fig.add(khan);
      fig.traverse((o) => ((o as THREE.Mesh).castShadow = true));
      const s = r.route[k % r.route.length];
      fig.position.set(s.x, ground(s.x, s.z), s.z);
      scene.add(fig);
      if (k >= ROUTES.length) fig.userData.hidden = true;
      this.list.push({ fig, route: r.route, i: (k * 3) % r.route.length, wait: 1 + k, phase: k * 1.3 });
    });
  }
  update(dt: number, t: number, player: THREE.Vector3, visible: boolean) {
    for (const v of this.list) {
      v.fig.visible = visible && !v.fig.userData.hidden;
      if (!v.fig.visible) continue;
      const stop = v.route[v.i];
      if (v.wait > 0) {
        v.wait -= dt;
        // bowing with joined hands while praying
        v.fig.rotation.x = stop.pray ? Math.max(0, Math.sin(t * 1.4 + v.phase)) * 0.32 : 0;
        if (v.wait <= 0) v.i = (v.i + 1) % v.route.length;
        continue;
      }
      v.fig.rotation.x = 0;
      const dx = stop.x - v.fig.position.x, dz = stop.z - v.fig.position.z;
      const d = Math.hypot(dx, dz);
      // let the visitor pass
      if (Math.hypot(player.x - v.fig.position.x, player.z - v.fig.position.z) < 1.3) continue;
      if (d < 0.15) {
        v.wait = stop.pray ?? 0.4;
        continue;
      }
      const step = Math.min(d, 1.05 * dt);
      v.fig.position.x += (dx / d) * step;
      v.fig.position.z += (dz / d) * step;
      v.fig.position.y = this.ground(v.fig.position.x, v.fig.position.z) + Math.abs(Math.sin(t * 6 + v.phase)) * 0.03;
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
    const woman = robedFigure({ robe: 0x5a4632, under: 0x2b2420, h: 1.55, hat: 'none' });
    woman.position.set(-2.6, -0.2, 0);
    woman.rotation.y = Math.PI / 2;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.2, 18), new THREE.MeshStandardMaterial({ color: 0xe8d9a8, roughness: 0.9 }));
    hat.position.y = 1.58;
    woman.add(hat);
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
