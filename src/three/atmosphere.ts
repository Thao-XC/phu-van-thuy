import * as THREE from 'three';

/**
 * The main hall's two moods.
 * Afternoon: sunlight in golden shafts through the open doors, dust turning in it, crimson silk,
 * shining brass plates, fresh banana leaves on the offering table.
 * Night: black beyond the doors, red altar candles pulsing, one low oil lamp swaying, and the
 * Mothers' statues throwing towering shadows up the back wall.
 */
type Ground = (x: number, z: number) => number;
const std = (c: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...extra });

function shaftTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, 'rgba(255,226,150,0.85)');
  gr.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 256);
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.25, 'rgba(0,0,0,0)');
  side.addColorStop(0.75, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = side;
  g.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}

export class HallAtmosphere {
  private day = new THREE.Group();
  private night = new THREE.Group();
  private both = new THREE.Group();
  private dust: THREE.Points;
  private dustPos: Float32Array;
  private curtains: THREE.Mesh[] = [];
  private candles: THREE.PointLight[] = [];
  private lamp: THREE.Group;
  private lampLight: THREE.PointLight;
  private shadowLight: THREE.SpotLight;
  /** where the Mothers' faces are, for the gaze */
  readonly faces: THREE.Vector3[];
  private mode: 'day' | 'twilight' | 'night' = 'day';

  private scene: THREE.Scene;
  constructor(scene: THREE.Scene, ground: Ground, o: { hallZ: number; hallD: number; frontZ: number; floorY: number; altarZ: number }) {
    this.scene = scene;
    const F = o.floorY;
    const back = o.hallZ - o.hallD / 2;
    this.faces = [-1.7, 0, 1.7].map((x) => new THREE.Vector3(x, F + 3.0 + 1.72, o.altarZ - 1.0));

    /* ---------- always there: silk, brass, banana leaves ---------- */
    // crimson silk curtains framing the altar, and a valance across the top
    [-1, 1].forEach((sd) => {
      const geo = new THREE.PlaneGeometry(1.4, 5.2, 10, 1);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.08);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, std(0xa8141c, { roughness: 0.45, side: THREE.DoubleSide, emissive: 0x200000 }));
      m.position.set(sd * 3.6, F + 2.8, o.altarZ + 1.8);
      m.userData.base = Float32Array.from(pos.array as Float32Array);
      this.curtains.push(m);
      this.both.add(m);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 12), std(0xd6a12b, { metalness: 0.7, roughness: 0.3 }));
      tie.position.set(sd * 3.6, F + 1.8, o.altarZ + 1.86);
      this.both.add(tie);
    });
    const val = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.7, 20, 1), std(0xa8141c, { roughness: 0.45, side: THREE.DoubleSide }));
    val.position.set(0, F + 5.5, o.altarZ + 1.9);
    this.both.add(val);
    const fringe = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.16), std(0xd6a12b, { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }));
    fringe.position.set(0, F + 5.1, o.altarZ + 1.92);
    this.both.add(fringe);

    // the offering table: brass plates, banana leaves and fruit
    const tz = o.altarZ + 3.4;
    const table = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.1), std(0x6b2a18, { roughness: 0.5 }));
    table.position.set(0, F + 0.9, tz);
    this.both.add(table);
    [-1.5, 1.5].forEach((x) => [-0.45, 0.45].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), std(0x4a1c10));
      leg.position.set(x, F + 0.45, tz + z);
      this.both.add(leg);
    }));
    const brass = std(0xd9a62e, { metalness: 0.95, roughness: 0.18 });
    const leaf = std(0x4f9a3a, { roughness: 0.55, side: THREE.DoubleSide });
    [-1.1, 0, 1.1].forEach((x, i) => {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.06, 24), brass);
      plate.position.set(x, F + 0.99, tz);
      this.both.add(plate);
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.38, 12, 0, Math.PI), leaf);
      l.rotation.x = -Math.PI / 2 + 0.15;
      l.position.set(x, F + 1.04, tz + 0.05);
      this.both.add(l);
      if (i === 1) {
        // a hand of green bananas
        for (let k = 0; k < 6; k++) {
          const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.26, 4, 8), std(0x9cc24a));
          b.rotation.z = Math.PI / 2 - 0.3;
          b.rotation.y = (k - 2.5) * 0.18;
          b.position.set(-0.15 + k * 0.06, F + 1.12, tz);
          this.both.add(b);
        }
      } else {
        for (let k = 0; k < 5; k++) {
          const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), std(k % 2 ? 0xe8a030 : 0xd8401f));
          f.position.set(x + Math.cos(k * 1.3) * 0.15, F + 1.1 + (k === 4 ? 0.1 : 0), tz + Math.sin(k * 1.3) * 0.15);
          this.both.add(f);
        }
      }
    });
    // banana plants by the hall doors
    [
      [-8.5, o.frontZ + 2.2],
      [8.5, o.frontZ + 2.2],
    ].forEach(([x, z]) => {
      const p = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.8, 8), std(0x7f9a4a));
      trunk.position.y = 0.9;
      p.add(trunk);
      for (let k = 0; k < 7; k++) {
        const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.2, 1, 4), leaf);
        const lp = lf.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < lp.count; i++) lp.setZ(i, -Math.pow((lp.getY(i) + 1.1) / 2.2, 2) * 0.8);
        lf.geometry.computeVertexNormals();
        lf.position.set(0, 2.2, 0);
        lf.rotation.set(-0.6, (k / 7) * Math.PI * 2, 0);
        lf.geometry.translate(0, 1.1, 0);
        p.add(lf);
      }
      p.position.set(x, ground(x, z), z);
      this.both.add(p);
    });

    /* ---------- afternoon: sun shafts and dust ---------- */
    const tex = shaftTexture();
    [-4.4, 4.4].forEach((x) => {
      for (let k = 0; k < 3; k++) {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(1.6, 7),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
        );
        m.position.set(x + (k - 1) * 0.35, F + 2.2, o.frontZ - 2.6);
        m.rotation.set(-1.0, (k - 1) * 0.2, 0);
        this.day.add(m);
      }
    });
    const N = 260;
    this.dustPos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const x = (i % 2 ? 4.4 : -4.4) + (Math.random() - 0.5) * 2;
      this.dustPos.set([x, F + 0.3 + Math.random() * 3.6, o.frontZ - 0.5 - Math.random() * 5], i * 3);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(this.dustPos, 3));
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe2a0, size: 0.035, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.day.add(this.dust);
    const sunIn = new THREE.PointLight(0xffd690, 1.2, 12, 2);
    sunIn.position.set(0, F + 2.5, o.frontZ - 3);
    this.day.add(sunIn);

    /* ---------- night: candles, the oil lamp, the towering shadows ---------- */
    [-2.6, 2.6].forEach((x) => {
      const l = new THREE.PointLight(0xff3a1a, 1.6, 9, 2);
      l.position.set(x, F + 2.4, o.altarZ + 1.2);
      this.candles.push(l);
      this.night.add(l);
    });
    this.lamp = new THREE.Group();
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.4, 4), std(0x2a1d14));
    chain.position.y = 1.2;
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0x8a6a2a, { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }));
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
    flame.position.y = 0.06;
    this.lampLight = new THREE.PointLight(0xffa050, 2.4, 11, 2);
    this.lampLight.position.y = 0.1;
    this.lamp.add(chain, bowl, flame, this.lampLight);
    this.lamp.position.set(0, F + 2.6, o.altarZ + 5);
    this.night.add(this.lamp);
    // a low light before the statues throws their shadows up the back wall
    this.shadowLight = new THREE.SpotLight(0xff5a2a, 2, 14, 0.62, 0.7, 1.6);
    this.shadowLight.position.set(0, F + 1.3, o.altarZ + 2.6);
    this.shadowLight.target.position.set(0, F + 6, back);
    this.shadowLight.castShadow = true;
    this.shadowLight.shadow.mapSize.set(1024, 1024);
    this.shadowLight.shadow.bias = -0.002;
    this.night.add(this.shadowLight, this.shadowLight.target);

    scene.add(this.both, this.day, this.night);
    this.setMode('day');
  }

  setMode(m: 'day' | 'twilight' | 'night') {
    this.mode = m;
    this.day.visible = m === 'day';
    this.night.visible = m === 'night';
    this.shadowLight.castShadow = m === 'night';
    // the altar's own glow: full by day, a low ember at night
    const g = this.scene.getObjectByName('altarGlow') as THREE.PointLight | undefined;
    if (g) {
      g.intensity = m === 'night' ? 1.4 : m === 'twilight' ? 3.5 : 4;
      g.color.setHex(m === 'night' ? 0xff4a20 : 0xffb45a);
    }
  }

  update(t: number, dt: number) {
    if (this.mode === 'day') {
      for (let i = 0; i < this.dustPos.length; i += 3) {
        this.dustPos[i] += Math.sin(t * 0.3 + i) * dt * 0.05;
        this.dustPos[i + 1] += (Math.sin(t * 0.2 + i * 0.7) * 0.5 + 0.15) * dt * 0.08;
        if (this.dustPos[i + 1] > 5) this.dustPos[i + 1] = 1.3;
      }
      (this.dust.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
    if (this.mode === 'night') {
      this.candles.forEach((l, i) => (l.intensity = 0.8 + Math.sin(t * 2.2 + i) * 0.35 + Math.random() * 0.2));
      this.lamp.rotation.z = Math.sin(t * 0.6) * 0.06;
      this.lamp.rotation.x = Math.sin(t * 0.45) * 0.04;
      this.lampLight.intensity = 1.0 + Math.random() * 0.25;
      this.shadowLight.intensity = 1.9 + Math.sin(t * 2.2) * 0.6 + Math.random() * 0.3;
    }
    // silk stirs in the draught
    this.curtains.forEach((c, k) => {
      const pos = c.geometry.attributes.position as THREE.BufferAttribute;
      const base = c.userData.base as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const y = base[i * 3 + 1];
        pos.setZ(i, base[i * 3 + 2] + Math.sin(t * 1.1 + base[i * 3] * 6 + k) * 0.04 * (1 - (y + 2.6) / 5.2));
      }
      pos.needsUpdate = true;
    });
  }
}
