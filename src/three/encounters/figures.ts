import * as THREE from 'three';
import { person } from '../kit/people';

/**
 * Low-poly characters and creatures for the secret worlds.
 * Every builder returns a Group whose origin sits at the figure's feet / belly,
 * plus (where it moves) an `animate(t)` stored on userData.
 */

const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true, ...extra });

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

export type Animated = THREE.Group & { userData: { animate?: (t: number) => void } };

/* ---------------------------------------------------------------- */
/* People & spirits                                                  */
/* ---------------------------------------------------------------- */

/** A standing robed figure in Vietnamese ritual dress (spirits, Mothers, mediums, the realm folk) */
export function robedFigure(o: {
  robe: number;
  under?: number;
  skin?: number;
  hair?: number;
  h?: number;
  longHair?: boolean;
  hat?: 'eboshi' | 'crown' | 'none';
  ghost?: boolean;
  sleeves?: number;
}): Animated {
  const male = o.hat === 'eboshi';
  return person({
    sex: male ? 'm' : 'f',
    outfit: 'robe',
    robe: o.robe,
    under: o.under,
    skin: o.skin,
    hairColor: o.hair,
    h: o.h ?? 1.7,
    hair: male ? 'khanxep' : o.longHair ? 'long' : 'bun',
    hat: o.hat === 'crown' ? 'crown' : 'none',
    ghost: o.ghost,
    wideSleeves: true,
  }) as unknown as Animated;
}

/** Mermaid (ningyo): human upper body, long hair, shimmering fish tail */
export function mermaid(): Animated {
  const g = new THREE.Group() as Animated;
  const skin = std(0xf3d6c2);
  const hair = std(0x1b2a3a);
  const scale = std(0x3fb6a8, { metalness: 0.4, roughness: 0.35, emissive: 0x0b3a35 });
  const body = new THREE.Group();
  body.add(mesh(new THREE.SphereGeometry(0.22, 12, 10), skin, 0, 0.35, 0));
  body.children[0].scale.set(1, 1.3, 0.7);
  body.add(mesh(new THREE.SphereGeometry(0.15, 12, 10), skin, 0, 0.78, 0.02));
  body.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), hair, 0, 0.81, -0.03));
  const locks = mesh(new THREE.BoxGeometry(0.34, 0.75, 0.06), hair, 0, 0.42, -0.16);
  body.add(locks);
  [-1, 1].forEach((s) => {
    const arm = mesh(new THREE.CapsuleGeometry(0.045, 0.42, 4, 6), skin, s * 0.24, 0.42, 0.05);
    arm.rotation.z = s * 0.6;
    body.add(arm);
  });
  // shell top
  [-0.09, 0.09].forEach((x) => body.add(mesh(new THREE.SphereGeometry(0.07, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf2b5c2), x, 0.4, 0.13)));
  g.add(body);
  // tail: chain of tapering segments
  const segs: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const r = 0.2 - i * 0.03;
    const seg = mesh(new THREE.SphereGeometry(Math.max(0.05, r), 10, 8), scale, 0, 0.1 - i * 0.22, 0);
    seg.scale.set(1, 1.4, 0.8);
    g.add(seg);
    segs.push(seg);
  }
  const fin = mesh(new THREE.ConeGeometry(0.3, 0.4, 3), std(0x7fe0d0, { transparent: true, opacity: 0.85 }), 0, -1.35, 0);
  fin.rotation.z = Math.PI;
  fin.scale.z = 0.2;
  g.add(fin);
  g.userData.animate = (t: number) => {
    segs.forEach((s, i) => (s.position.z = Math.sin(t * 3 - i * 0.6) * 0.06 * i));
    fin.position.z = Math.sin(t * 3 - 4) * 0.4;
    fin.rotation.x = Math.sin(t * 3 - 4) * 0.4;
    locks.rotation.x = Math.sin(t * 1.5) * 0.15;
  };
  return g;
}

/** Heike crab: a face pressed into its shell (canvas-drawn samurai scowl) */
let heikeTex: THREE.CanvasTexture | null = null;
export function heikeCrab(): THREE.Group {
  if (!heikeTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d')!;
    x.fillStyle = '#8a3b25';
    x.fillRect(0, 0, 128, 128);
    x.strokeStyle = '#4a1c10';
    x.lineWidth = 7;
    x.lineCap = 'round';
    // furrowed brows, glaring eyes, grimace
    x.beginPath(); x.moveTo(24, 46); x.lineTo(56, 58); x.stroke();
    x.beginPath(); x.moveTo(104, 46); x.lineTo(72, 58); x.stroke();
    x.beginPath(); x.ellipse(44, 70, 10, 6, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(84, 70, 10, 6, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(38, 100); x.quadraticCurveTo(64, 86, 90, 100); x.stroke();
    x.beginPath(); x.moveTo(64, 30); x.lineTo(64, 52); x.stroke();
    heikeTex = new THREE.CanvasTexture(c);
    heikeTex.colorSpace = THREE.SRGBColorSpace;
  }
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ map: heikeTex, roughness: 0.6 });
  const shell = mesh(new THREE.SphereGeometry(0.35, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), shellMat, 0, 0.12, 0);
  shell.scale.set(1, 0.5, 1);
  shell.rotation.y = Math.PI;
  g.add(shell);
  const legMat = std(0x7a321e);
  for (let i = 0; i < 4; i++)
    [-1, 1].forEach((s) => {
      const leg = mesh(new THREE.CapsuleGeometry(0.03, 0.35, 3, 5), legMat, s * 0.38, 0.1, -0.15 + i * 0.1);
      leg.rotation.z = s * 1.0;
      g.add(leg);
    });
  [-1, 1].forEach((s) => g.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), legMat, s * 0.25, 0.14, 0.32)));
  return g;
}

/** School of small fish circling a centre (instanced) */
export function fishSchool(n: number, colors: number[], radius: number, height: number): Animated {
  const g = new THREE.Group() as Animated;
  const geo = new THREE.ConeGeometry(0.09, 0.4, 5);
  geo.rotateZ(-Math.PI / 2);
  const per = Math.ceil(n / colors.length);
  const meshes = colors.map((c) => new THREE.InstancedMesh(geo, std(c, { emissive: c, emissiveIntensity: 0.15 }), per));
  meshes.forEach((m) => g.add(m));
  const seeds = Array.from({ length: n }, (_, i) => ({ a: Math.random() * Math.PI * 2, r: radius * (0.5 + Math.random() * 0.5), y: Math.random() * height, s: 0.4 + Math.random() * 0.3, i }));
  const tmp = new THREE.Object3D();
  g.userData.animate = (t: number) => {
    seeds.forEach((f, idx) => {
      const a = f.a + t * f.s;
      tmp.position.set(Math.cos(a) * f.r, f.y + Math.sin(t * 2 + f.i) * 0.2, Math.sin(a) * f.r);
      tmp.rotation.set(0, -a, 0);
      tmp.updateMatrix();
      const mi = meshes[idx % meshes.length];
      mi.setMatrixAt(Math.floor(idx / meshes.length), tmp.matrix);
    });
    meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
  };
  g.userData.animate(0);
  return g;
}

/** Long fish body built from a lathe (shark, koi) */
function fishBody(len: number, girth: number, mat: THREE.Material): THREE.Mesh {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push(new THREE.Vector2(Math.max(0.001, Math.sin(Math.PI * Math.pow(t, 0.7)) * girth * (1 - t * 0.55)), -len / 2 + t * len));
  }
  const geo = new THREE.LatheGeometry(pts, 14);
  geo.rotateX(Math.PI / 2); // nose toward +z
  return mesh(geo, mat);
}

/** Tiger shark: striped, with a swaying tail. Faces +z. */
export function shark(len = 4.2): Animated {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d')!;
  const grad = x.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#5c6670');
  grad.addColorStop(0.55, '#7d8790');
  grad.addColorStop(0.6, '#e8e6df');
  x.fillStyle = grad;
  x.fillRect(0, 0, 256, 64);
  x.fillStyle = 'rgba(40,46,52,0.6)';
  for (let i = 0; i < 18; i++) x.fillRect(20 + i * 12, 4, 4, 22);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const skin = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const g = new THREE.Group() as Animated;
  const body = fishBody(len, len * 0.13, skin);
  g.add(body);
  const finMat = std(0x5a646d);
  const dorsal = mesh(new THREE.ConeGeometry(len * 0.09, len * 0.2, 3), finMat, 0, len * 0.14, len * 0.05);
  dorsal.scale.z = 0.25;
  dorsal.rotation.x = -0.3;
  g.add(dorsal);
  [-1, 1].forEach((s) => {
    const pec = mesh(new THREE.ConeGeometry(len * 0.06, len * 0.22, 3), finMat, s * len * 0.12, -len * 0.04, len * 0.12);
    pec.rotation.set(0.4, 0, s * 1.4);
    pec.scale.z = 0.25;
    g.add(pec);
  });
  const tail = new THREE.Group();
  const upper = mesh(new THREE.ConeGeometry(len * 0.06, len * 0.28, 3), finMat, 0, len * 0.1, -len * 0.06);
  upper.rotation.x = -0.8;
  upper.scale.z = 0.25;
  tail.add(upper);
  const lower = mesh(new THREE.ConeGeometry(len * 0.05, len * 0.18, 3), finMat, 0, -len * 0.06, -len * 0.04);
  lower.rotation.x = -2.4;
  lower.scale.z = 0.25;
  tail.add(lower);
  tail.position.z = -len * 0.5;
  g.add(tail);
  // jaw with teeth
  const mouth = mesh(new THREE.BoxGeometry(len * 0.12, len * 0.012, len * 0.04), std(0x2a1414), 0, -len * 0.04, len * 0.43);
  g.add(mouth);
  for (let i = 0; i < 7; i++) g.add(mesh(new THREE.ConeGeometry(0.02, 0.07, 4), std(0xffffff), -len * 0.05 + i * len * 0.017, -len * 0.035, len * 0.445));
  const eyeMat = std(0x050505);
  [-1, 1].forEach((s) => g.add(mesh(new THREE.SphereGeometry(len * 0.016, 6, 6), eyeMat, s * len * 0.07, len * 0.03, len * 0.36)));
  g.userData.animate = (t: number) => {
    tail.rotation.y = Math.sin(t * 6) * 0.45;
    body.rotation.y = Math.sin(t * 6 + 1) * 0.04;
  };
  return g;
}

/** Koi (giant, ancient) — faces +z */
export function koi(len = 2.2, colors = [0xf6efe6, 0xe0461f]): Animated {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const x = c.getContext('2d')!;
  x.fillStyle = '#' + colors[0].toString(16).padStart(6, '0');
  x.fillRect(0, 0, 128, 64);
  x.fillStyle = '#' + colors[1].toString(16).padStart(6, '0');
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    x.ellipse(15 + i * 25 + Math.random() * 10, 15 + Math.random() * 20, 10 + Math.random() * 8, 8 + Math.random() * 6, 0, 0, Math.PI * 2);
    x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group() as Animated;
  const body = fishBody(len, len * 0.16, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.1 }));
  g.add(body);
  const finMat = std(0xf3d9c6, { transparent: true, opacity: 0.8 });
  const tail = mesh(new THREE.ConeGeometry(len * 0.15, len * 0.3, 3), finMat, 0, 0, -len * 0.55);
  tail.rotation.x = Math.PI / 2;
  tail.scale.x = 0.15;
  g.add(tail);
  [-1, 1].forEach((s) => g.add(mesh(new THREE.CapsuleGeometry(0.012 * len, 0.2 * len, 3, 4), std(0xd8b39a), s * len * 0.06, -len * 0.04, len * 0.48)));
  g.userData.animate = (t: number) => {
    tail.rotation.y = Math.sin(t * 3) * 0.5;
  };
  return g;
}

export function turtle(): Animated {
  const g = new THREE.Group() as Animated;
  const shellM = std(0x5b6b3a);
  const skin = std(0x8c9a6a);
  const shell = mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), shellM);
  shell.scale.set(1, 0.45, 1.25);
  g.add(shell);
  g.add(mesh(new THREE.SphereGeometry(0.17, 10, 8), skin, 0, 0.05, 0.85));
  const flips: THREE.Mesh[] = [];
  [[-1, 0.35], [1, 0.35], [-1, -0.45], [1, -0.45]].forEach(([s, z]) => {
    const f = mesh(new THREE.BoxGeometry(0.55, 0.05, 0.22), skin, s * 0.6, 0, z);
    g.add(f);
    flips.push(f);
  });
  g.userData.animate = (t: number) => flips.forEach((f, i) => (f.rotation.z = Math.sin(t * 2 + (i < 2 ? 0 : 1)) * 0.5 * (i % 2 ? 1 : -1)));
  return g;
}

/** Coral garden of bright branches, fans and brain coral */
export function coralPatch(n: number, spread: number, seed = 1): THREE.Group {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new THREE.Group();
  const colors = [0xff7a6b, 0xffb03a, 0xc56bd8, 0x4fd1c5, 0xf26b9a, 0xf2e15c];
  for (let i = 0; i < n; i++) {
    const c = colors[Math.floor(rnd() * colors.length)];
    const m = std(c, { emissive: c, emissiveIntensity: 0.12 });
    const x = (rnd() - 0.5) * spread, z = (rnd() - 0.5) * spread;
    const kind = rnd();
    if (kind < 0.4) {
      for (let b = 0; b < 4; b++) {
        const br = mesh(new THREE.CylinderGeometry(0.06, 0.12, 1 + rnd(), 6), m, x + (rnd() - 0.5) * 0.4, 0.5, z + (rnd() - 0.5) * 0.4);
        br.rotation.set((rnd() - 0.5) * 0.8, 0, (rnd() - 0.5) * 0.8);
        g.add(br);
      }
    } else if (kind < 0.7) {
      const fan = mesh(new THREE.CircleGeometry(0.7 + rnd() * 0.5, 10, 0, Math.PI), new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.8 }), x, 0, z);
      fan.rotation.y = rnd() * Math.PI;
      g.add(fan);
    } else {
      const brain = mesh(new THREE.IcosahedronGeometry(0.4 + rnd() * 0.5, 1), m, x, 0.2, z);
      brain.scale.y = 0.6;
      g.add(brain);
    }
  }
  return g;
}

/** Swaying kelp / reeds */
export function seaweed(n: number, spread: number, color = 0x3f7a3a, h = 3): Animated {
  const g = new THREE.Group() as Animated;
  const m = std(color, { side: THREE.DoubleSide });
  const blades: THREE.Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const b = mesh(new THREE.PlaneGeometry(0.25, h * (0.6 + Math.random() * 0.6), 1, 6), m, (Math.random() - 0.5) * spread, h * 0.4, (Math.random() - 0.5) * spread);
    b.rotation.y = Math.random() * Math.PI;
    g.add(b);
    blades.push(b);
  }
  g.userData.animate = (t: number) => blades.forEach((b, i) => (b.rotation.z = Math.sin(t * 1.2 + i) * 0.18));
  return g;
}

/** Raijin, the thunder god: red-skinned, on a cloud, ringed by taiko drums with tomoe */
export function raijin(): Animated {
  const g = new THREE.Group() as Animated;
  const skin = std(0xc8371d, { emissive: 0x3a0800 });
  const cloud = std(0x3c3f46);
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.IcosahedronGeometry(1.2 + Math.random() * 0.6, 1), cloud, (i - 2.5) * 1.1, -0.6 + Math.random() * 0.4, Math.random() - 0.5));
  g.add(mesh(new THREE.SphereGeometry(0.9, 12, 10), skin, 0, 1.2, 0));
  g.add(mesh(new THREE.SphereGeometry(0.55, 12, 10), skin, 0, 2.4, 0.1));
  [-1, 1].forEach((s) => {
    const horn = mesh(new THREE.ConeGeometry(0.1, 0.5, 6), std(0xf2e6c8), s * 0.25, 2.95, 0.05);
    horn.rotation.z = -s * 0.3;
    g.add(horn);
    const arm = mesh(new THREE.CapsuleGeometry(0.17, 1.1, 4, 6), skin, s * 1.1, 1.8, 0.2);
    arm.rotation.z = s * 1.0;
    g.add(arm);
  });
  // wild hair
  for (let i = 0; i < 8; i++) {
    const strand = mesh(new THREE.ConeGeometry(0.08, 0.7, 5), std(0x111111), Math.cos(i) * 0.35, 2.8, Math.sin(i) * 0.3 - 0.2);
    strand.rotation.set(-0.6, 0, Math.cos(i) * 0.8);
    g.add(strand);
  }
  // drum ring
  const ring = new THREE.Group();
  const drumTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d')!;
    x.fillStyle = '#e8dcc0';
    x.fillRect(0, 0, 64, 64);
    x.fillStyle = '#b8261b';
    for (let k = 0; k < 3; k++) {
      x.beginPath();
      const a = (k / 3) * Math.PI * 2;
      x.arc(32 + Math.cos(a) * 9, 32 + Math.sin(a) * 9, 9, a, a + Math.PI * 1.3);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI;
    const d = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.4, 14), [std(0x7a2c1a), new THREE.MeshStandardMaterial({ map: drumTex }), new THREE.MeshStandardMaterial({ map: drumTex })] as unknown as THREE.Material, Math.cos(a) * 2.6, 1.6 + Math.sin(a) * 2.6, -0.4);
    d.rotation.x = Math.PI / 2;
    ring.add(d);
  }
  const hoop = mesh(new THREE.TorusGeometry(2.6, 0.06, 6, 40, Math.PI), std(0x3a2a1a), 0, 1.6, -0.4);
  ring.add(hoop);
  g.add(ring);
  g.userData.animate = (t: number) => {
    g.position.y += Math.sin(t * 1.3) * 0.004;
    ring.rotation.z = Math.sin(t * 0.8) * 0.05;
  };
  return g;
}

/** Fudō Myōō: blue wrathful guardian, sword and rope, seated on rock in a halo of flame */
export function fudo(): Animated {
  const g = new THREE.Group() as Animated;
  const skin = std(0x2f4f86, { emissive: 0x0a1428 });
  const robe = std(0xb8261b);
  g.add(mesh(new THREE.DodecahedronGeometry(1.8, 0), std(0x55514b), 0, 0.7, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.6, 1.0, 1.4, 10), robe, 0, 2.1, 0));
  g.add(mesh(new THREE.SphereGeometry(0.75, 12, 10), skin, 0, 3.1, 0));
  g.add(mesh(new THREE.SphereGeometry(0.42, 12, 10), skin, 0, 4.05, 0.05));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.6, 0.06), std(0x111111), 0.32, 3.8, -0.1));
  const sword = mesh(new THREE.BoxGeometry(0.08, 2.4, 0.02), std(0xdfe6ea, { metalness: 0.9, roughness: 0.2 }), 0.9, 3.9, 0.4);
  g.add(sword);
  g.add(mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 16), std(0xe6d3a8), -0.9, 2.6, 0.4));
  const flames: THREE.Mesh[] = [];
  const fm = new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.85 });
  const fm2 = new THREE.MeshBasicMaterial({ color: 0xffc23a, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 18; i++) {
    const a = Math.PI * 0.05 + (i / 17) * Math.PI * 0.9;
    const f = mesh(new THREE.ConeGeometry(0.35, 1.4 + Math.random(), 5), i % 2 ? fm : fm2, Math.cos(a) * 2.1, 3 + Math.sin(a) * 2.1, -0.6);
    f.rotation.z = a - Math.PI / 2;
    g.add(f);
    flames.push(f);
  }
  g.userData.animate = (t: number) => flames.forEach((f, i) => f.scale.set(1, 0.8 + Math.sin(t * 8 + i) * 0.25, 1));
  return g;
}

/** Seated monk under the falls */
export function monk(): THREE.Group {
  const g = new THREE.Group();
  const robe = std(0xf2efe6);
  const skin = std(0xe5c3a0);
  const legs = mesh(new THREE.SphereGeometry(0.5, 12, 8), robe, 0, 0.2, 0.1);
  legs.scale.set(1.2, 0.4, 0.9);
  g.add(legs);
  g.add(mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.8, 10), robe, 0, 0.7, 0));
  g.add(mesh(new THREE.SphereGeometry(0.17, 12, 10), skin, 0, 1.25, 0));
  [-1, 1].forEach((s) => {
    const arm = mesh(new THREE.CapsuleGeometry(0.07, 0.4, 4, 6), robe, s * 0.12, 0.85, 0.22);
    arm.rotation.set(-1.2, 0, s * 0.5);
    g.add(arm);
  });
  return g;
}

/** Ame-no-Uzume dancing on an upturned tub */
export function uzume(): Animated {
  const g = new THREE.Group() as Animated;
  g.add(mesh(new THREE.CylinderGeometry(1.0, 0.9, 0.6, 16), std(0x8a6a43), 0, 0.3, 0));
  const dancer = robedFigure({ robe: 0xf6f1e6, under: 0xc8261b, longHair: true, h: 1.7 });
  dancer.position.y = 0.6;
  g.add(dancer);
  // sakaki branch with bells
  const branch = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 5), std(0x3a6b2a), 0.4, 1.8, 0.2);
  dancer.add(branch);
  g.userData.animate = (t: number) => {
    dancer.rotation.y = Math.sin(t * 3) * 0.7;
    dancer.position.y = 0.6 + Math.abs(Math.sin(t * 6)) * 0.15;
    branch.rotation.z = Math.sin(t * 6) * 0.8;
  };
  return g;
}

export function rooster(): Animated {
  const g = new THREE.Group() as Animated;
  const body = std(0xf6f1e6);
  const comb = std(0xd02a1d);
  const b = mesh(new THREE.SphereGeometry(0.25, 10, 8), body, 0, 0.45, 0);
  b.scale.set(0.8, 1, 1.2);
  g.add(b);
  const head = new THREE.Group();
  head.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), body, 0, 0, 0));
  head.add(mesh(new THREE.BoxGeometry(0.03, 0.1, 0.14), comb, 0, 0.1, 0));
  head.add(mesh(new THREE.ConeGeometry(0.03, 0.08, 4), std(0xe0a32a), 0, -0.01, 0.12));
  head.children[2].rotation.x = Math.PI / 2;
  head.position.set(0, 0.75, 0.18);
  g.add(head);
  const tail = mesh(new THREE.ConeGeometry(0.15, 0.45, 5), std(0x2a2a2a), 0, 0.6, -0.3);
  tail.rotation.x = -0.6;
  g.add(tail);
  [-0.08, 0.08].forEach((x) => g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4), std(0xe0a32a), x, 0.12, 0)));
  g.userData.animate = (t: number) => {
    head.position.z = 0.18 + Math.max(0, Math.sin(t * 2.2)) * 0.08;
    head.rotation.x = -Math.max(0, Math.sin(t * 2.2)) * 0.6;
  };
  return g;
}

/** Seiryū / Ryū: a serpentine dragon whose body follows a moving path. Head at the front. */
export function dragon(o: { color: number; len?: number; segs?: number; radius?: number }): Animated & { userData: { pathAt?: (u: number, t: number) => THREE.Vector3 } } {
  const g = new THREE.Group() as Animated & { userData: { pathAt?: (u: number, t: number) => THREE.Vector3 } };
  const n = o.segs ?? 40;
  const r = o.radius ?? 0.6;
  const scaleMat = std(o.color, { metalness: 0.3, roughness: 0.45, emissive: o.color, emissiveIntensity: 0.12 });
  const bellyMat = std(0xe8d79a);
  const finMat = std(0xe8b23a, { metalness: 0.4 });
  const segsArr: THREE.Group[] = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group();
    const k = 1 - Math.pow(i / n, 1.5) * 0.75;
    const body = new THREE.Mesh(new THREE.SphereGeometry(r * k, 10, 8), scaleMat);
    body.scale.set(1, 1, 1.4);
    s.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(r * k * 0.8, 8, 6), bellyMat);
    belly.position.y = -r * k * 0.35;
    belly.scale.set(0.9, 0.6, 1.3);
    s.add(belly);
    if (i % 2 === 0) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(r * k * 0.35, r * k * 1.2, 4), finMat);
      fin.position.y = r * k * 1.0;
      fin.rotation.x = -0.5;
      s.add(fin);
    }
    if (i === 8 || i === 22) {
      [-1, 1].forEach((sd) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.18, r * 1.2, 3, 6), scaleMat);
        leg.position.set(sd * r * 1.1, -r * 0.6, 0);
        leg.rotation.z = sd * 0.9;
        s.add(leg);
      });
    }
    g.add(s);
    segsArr.push(s);
  }
  // head
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, r * 1.2, r * 2.4), scaleMat);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(r * 1.2, r * 0.7, r * 1.4), scaleMat);
  snout.position.set(0, -r * 0.15, r * 1.7);
  head.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, r * 0.25, r * 1.6), bellyMat);
  jaw.position.set(0, -r * 0.7, r * 1.4);
  head.add(jaw);
  [-1, 1].forEach((sd) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * 2.2, 6), std(0xf2e2b8));
    horn.position.set(sd * r * 0.5, r * 0.9, -r * 0.6);
    horn.rotation.x = -1.1;
    head.add(horn);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(r * 0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23a }));
    eye.position.set(sd * r * 0.75, r * 0.3, r * 0.7);
    head.add(eye);
    const whisker = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.03, r * 0.01, r * 3.5, 4), finMat);
    whisker.position.set(sd * r * 1.3, -r * 0.2, r * 2.0);
    whisker.rotation.z = sd * 1.2;
    head.add(whisker);
  });
  const mane = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, r * 1.4, 7), std(0xf6f1e6));
  mane.position.set(0, r * 0.4, -r * 1.3);
  mane.rotation.x = -1.8;
  head.add(mane);
  g.add(head);

  const P = new THREE.Vector3(), Q = new THREE.Vector3();
  g.userData.animate = (t: number) => {
    const at = g.userData.pathAt;
    if (!at) return;
    const step = (o.len ?? 26) / n / 60;
    for (let i = 0; i < n; i++) {
      P.copy(at(i * step, t));
      Q.copy(at(i * step + step * 0.5, t));
      segsArr[i].position.copy(P);
      segsArr[i].lookAt(Q.x * 2 - P.x, Q.y * 2 - P.y, Q.z * 2 - P.z);
      segsArr[i].rotateY(Math.PI);
    }
    P.copy(at(-step * 1.5, t));
    Q.copy(at(0, t));
    head.position.copy(P);
    head.lookAt(P.x * 2 - Q.x, P.y * 2 - Q.y, P.z * 2 - Q.z);
    jaw.rotation.x = Math.max(0, Math.sin(t * 1.3)) * 0.35;
  };
  return g;
}

/** Glowing orbs (gods, spirits, will-o'-wisps) drifting around a centre */
export function spiritOrbs(n: number, color: number, radius: number, height: number): Animated {
  const g = new THREE.Group() as Animated;
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const halo = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false });
  const orbs = Array.from({ length: n }, (_, i) => {
    const o = new THREE.Group();
    o.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat));
    o.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), halo));
    g.add(o);
    return { o, a: Math.random() * Math.PI * 2, r: radius * (0.3 + Math.random() * 0.7), y: 1 + Math.random() * height, s: 0.15 + Math.random() * 0.25, i };
  });
  g.userData.animate = (t: number) =>
    orbs.forEach((b) => {
      const a = b.a + t * b.s;
      b.o.position.set(Math.cos(a) * b.r, b.y + Math.sin(t + b.i) * 0.6, Math.sin(a) * b.r);
    });
  g.userData.animate(0);
  return g;
}

/** Pale blue spirit flames (onibi / kitsunebi) */
export function ghostFlames(n: number, spread: number, color = 0x7fd6ff): Animated {
  const g = new THREE.Group() as Animated;
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, depthWrite: false });
  const fl = Array.from({ length: n }, (_, i) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.3 + Math.random() * 0.3, 1 + Math.random() * 1.2, 6), mat);
    f.position.set((Math.random() - 0.5) * spread, Math.random() * spread * 0.6, (Math.random() - 0.5) * spread * 0.6);
    g.add(f);
    return { f, i, y: f.position.y };
  });
  g.userData.animate = (t: number) =>
    fl.forEach(({ f, i, y }) => {
      f.scale.set(1, 0.7 + Math.sin(t * 7 + i) * 0.3, 1);
      f.position.y = y + Math.sin(t * 2 + i) * 0.2;
    });
  return g;
}

/** Simple sea-floor treasure box (tamatebako): lacquer box tied with red cord */
export function tamatebako(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), std(0x1a1010, { roughness: 0.2, metalness: 0.2 }), 0, 0.22, 0));
  g.add(mesh(new THREE.BoxGeometry(0.64, 0.06, 0.64), std(0xc9952a, { metalness: 0.7, roughness: 0.3 }), 0, 0.46, 0));
  g.add(mesh(new THREE.BoxGeometry(0.66, 0.05, 0.08), std(0xd02a1d), 0, 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.05, 0.66), std(0xd02a1d), 0, 0.3, 0));
  g.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), std(0xd02a1d), 0, 0.52, 0));
  const glow = new THREE.PointLight(0xffd27a, 6, 6, 2);
  glow.position.y = 0.6;
  g.add(glow);
  return g;
}

/** A shaft of light coming down through water */
export function lightShaft(h: number, r: number, color = 0xcff6ff): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.6, r, h, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
  );
  m.position.y = h / 2;
  return m;
}
