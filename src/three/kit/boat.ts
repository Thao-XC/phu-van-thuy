import * as THREE from 'three';

/**
 * A northern river đò: a lacquered wooden sampan with an upswept bow and stern, planked sides,
 * painted eyes at the bow (mắt thuyền, so the boat can see its way), a woven bamboo canopy
 * (mui) on bent ribs, thwarts, floorboards, a lantern on a bamboo stalk and a little tray of
 * offerings for the temple. Local axes: bow toward +x, waterline at y = 0.
 */
const tex = (() => {
  const cache: Record<string, THREE.CanvasTexture> = {};
  return (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d')!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat);
    }
    return (cache[key] = t);
  };
})();

/** tarred planks running bow to stern, a red-lacquered sheer strake at the top */
const planks = () =>
  tex('planks', 512, 256, (g) => {
    g.fillStyle = '#5b3a22';
    g.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 32) {
      g.fillStyle = y / 32 % 2 ? '#62402a' : '#563620';
      g.fillRect(0, y, 512, 32);
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(0, y, 512, 2);
      // grain
      g.strokeStyle = 'rgba(30,15,5,.25)';
      g.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        g.beginPath();
        const yy = y + 4 + k * 4.5 + Math.random() * 2;
        g.moveTo(0, yy);
        for (let x = 0; x <= 512; x += 32) g.lineTo(x, yy + Math.sin(x * 0.02 + k) * 1.5);
        g.stroke();
      }
      // treenails
      g.fillStyle = 'rgba(20,10,4,.6)';
      for (let x = 20; x < 512; x += 64) g.fillRect(x, y + 14, 3, 3);
    }
    // the red sheer strake along the top edge (v = 1 at the gunwale)
    g.fillStyle = '#9e2a1e';
    g.fillRect(0, 0, 512, 22);
    g.fillStyle = '#d6a12b';
    g.fillRect(0, 22, 512, 3);
  });

/** woven bamboo for the canopy: a tight diagonal twill */
const weave = () =>
  tex(
    'weave',
    128,
    128,
    (g) => {
      g.fillStyle = '#b08a52';
      g.fillRect(0, 0, 128, 128);
      for (let i = -128; i < 256; i += 8) {
        g.strokeStyle = 'rgba(70,45,15,.55)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + 128, 128);
        g.stroke();
        g.strokeStyle = 'rgba(235,205,150,.35)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(i + 128, 0);
        g.lineTo(i, 128);
        g.stroke();
      }
    },
    [6, 3],
  );

/** the painted eye on the bow */
const eye = () =>
  tex('eye', 256, 128, (g) => {
    g.clearRect(0, 0, 256, 128);
    g.fillStyle = '#f3ead6';
    g.beginPath();
    g.ellipse(128, 64, 110, 46, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = '#9e2a1e';
    g.stroke();
    g.fillStyle = '#16110d';
    g.beginPath();
    g.arc(140, 64, 32, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f3ead6';
    g.beginPath();
    g.arc(150, 54, 8, 0, Math.PI * 2);
    g.fill();
    // a lash sweeping back
    g.strokeStyle = '#16110d';
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(20, 60);
    g.quadraticCurveTo(-10, 30, 10, 10);
    g.stroke();
  });

const L = 6.4; // length
const half = (x: number) => 0.74 * Math.pow(Math.max(0, 1 - Math.pow(x / (L / 2), 2)), 0.55);
const sheer = (x: number) => 0.36 + 0.3 * Math.pow(Math.abs(x) / (L / 2), 3.4);
const keel = (x: number) => -0.2 * (1 - Math.pow(x / (L / 2), 2));

/** the hull: cross-sections along the length, each a rounded U from gunwale to gunwale */
function hullGeometry() {
  const NX = 48, NU = 22;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NX; i++) {
    const x = -L / 2 + (L * i) / NX;
    const w = Math.max(0.02, half(x)), top = sheer(x), bot = keel(x);
    for (let j = 0; j <= NU; j++) {
      const a = -Math.PI / 2 + (Math.PI * j) / NU; // -90° port gunwale … +90° starboard gunwale
      const s = Math.sin(a);
      const c = Math.cos(a);
      // flare outward toward the gunwale, rounded at the bilge
      const z = s * w * (0.9 + 0.1 * Math.abs(s));
      const y = bot + (top - bot) * (1 - Math.pow(c, 0.8));
      pos.push(x, y, z);
      uv.push(i / NX, Math.abs(s));
    }
  }
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NU; j++) {
      const a = i * (NU + 1) + j, b = a + NU + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export interface BoatParts {
  g: THREE.Group;
  /** the stern oar's pivot, to rock while rowing */
  oar: THREE.Group;
  /** where a seated passenger's eyes go (local) */
  seatEye: THREE.Vector3;
}

export function makeBoat(): BoatParts {
  const g = new THREE.Group();
  const lacquerRed = new THREE.MeshStandardMaterial({ color: 0x9e2a1e, roughness: 0.4 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x3b2414, roughness: 0.7 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.75 });
  const bamboo = new THREE.MeshStandardMaterial({ color: 0xa88a4e, roughness: 0.7 });
  const add = <T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0) => {
    o.position.set(x, y, z);
    o.traverse((m) => ((m as THREE.Mesh).castShadow = true));
    g.add(o);
    return o;
  };

  // hull: planked and lacquered outside, dark tarred wood inside
  const hg = hullGeometry();
  add(new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ map: planks(), roughness: 0.65, side: THREE.FrontSide })));
  add(new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: 0x3e2716, roughness: 0.85, side: THREE.BackSide })));
  // gunwale rails: a lacquered rod along each sheer line
  [-1, 1].forEach((sd) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -L / 2 + 0.05 + ((L - 0.1) * i) / 40;
      pts.push(new THREE.Vector3(x, sheer(x) + 0.015, sd * half(x) * 1.0));
    }
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.035, 8), lacquerRed));
  });
  // stem and stern posts curling up
  [-1, 1].forEach((sd) => {
    const x = sd * (L / 2 - 0.05);
    const post = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16, Math.PI * 0.8), lacquerRed);
    post.rotation.set(0, 0, sd > 0 ? -0.2 : Math.PI + 0.2);
    add(post, x, sheer(x) + 0.02, 0);
  });
  // floorboards and thwarts
  for (let i = 0; i < 9; i++) add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.9), wood), -2.4 + i * 0.6, -0.08, 0);
  [1.05, -2.15, 2.3].forEach((x) => add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, half(x) * 2 - 0.06), wood), x, 0.3, 0));

  // the painted eyes on the bow
  [-1, 1].forEach((sd) => {
    const x = 2.55;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshStandardMaterial({ map: eye(), transparent: true, roughness: 0.5, side: THREE.DoubleSide }));
    m.position.set(x, sheer(x) - 0.17, sd * (half(x) + 0.012));
    m.rotation.y = sd > 0 ? 0 : Math.PI;
    m.rotation.y += sd * -0.32; // follow the hull's taper toward the bow
    if (sd < 0) m.scale.x = -1;
    g.add(m);
  });

  // the canopy (mui): bent bamboo ribs under a woven mat, behind the passenger
  const mui = new THREE.Group();
  const r = 0.78, x0 = -1.85, x1 = -0.2;
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x1 - x0, 24, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ map: weave(), roughness: 0.85, side: THREE.DoubleSide }));
  mat.rotation.z = Math.PI / 2;
  mui.add(mat);
  for (let i = 0; i <= 4; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.022, 6, 20, Math.PI), darkWood);
    rib.rotation.y = Math.PI / 2;
    rib.position.x = (x1 - x0) / 2 - (i / 4) * (x1 - x0);
    mui.add(rib);
  }
  add(mui, (x0 + x1) / 2, 0.28, 0);

  // the bow lantern on a bamboo stalk, and a tray of offerings at the passenger's feet
  // the stalk leans out over the starboard side, so the lamp lights the water, not your eyes
  const stalk = add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.7, 6), bamboo), 3.0, sheer(3.0) + 0.2, 0.55);
  stalk.rotation.set(0.6, 0, -0.15);
  const lamp = new THREE.Group();
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), new THREE.MeshStandardMaterial({ color: 0xc81e1e, emissive: 0xff6a2a, emissiveIntensity: 1.1, roughness: 0.5 }));
  shade.scale.y = 1.2;
  lamp.add(shade);
  [-1, 1].forEach((s) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 10), new THREE.MeshStandardMaterial({ color: 0xd6a12b, metalness: 0.5, roughness: 0.4 }));
    cap.position.y = s * 0.145;
    lamp.add(cap);
  });
  const glow = new THREE.PointLight(0xffa860, 1.4, 9, 2);
  lamp.add(glow);
  add(lamp, 3.05, sheer(3.0) + 0.38, 0.86);
  const tray = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.05, 18), new THREE.MeshStandardMaterial({ color: 0xc8302a, roughness: 0.4 })), 1.75, -0.02, 0.18);
  [0xe2b23a, 0xf08a2a, 0x8db27a].forEach((c, i) => {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
    fruit.position.set(Math.cos(i * 2.1) * 0.08, 0.06, Math.sin(i * 2.1) * 0.08);
    tray.add(fruit);
  });
  const sticks = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 5), new THREE.MeshStandardMaterial({ color: 0xb5332a }));
  sticks.position.set(0, 0.16, 0);
  sticks.rotation.z = 0.5;
  tray.add(sticks);

  // the long stern oar (mái chèo), worked standing
  const oar = new THREE.Group();
  // from the handle in her hands down and back into the water behind the stern
  const A = new THREE.Vector3(0.75, 0.9, 0), B = new THREE.Vector3(-1.9, -0.55, 0);
  const dir = B.clone().sub(A);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, dir.length(), 8), wood);
  shaft.position.copy(A).addScaledVector(dir, 0.5);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  oar.add(shaft);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.03), wood);
  blade.position.copy(B);
  blade.quaternion.copy(shaft.quaternion);
  oar.add(blade);
  add(oar, -2.95, sheer(-2.95) + 0.05, 0.3);

  return { g, oar, seatEye: new THREE.Vector3(1.0, 1.08, 0) };
}
