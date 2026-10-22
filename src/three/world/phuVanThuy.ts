import * as THREE from 'three';
import type { Layout, SpotDef } from './types';
import { hills } from './types';
import { thoaiPhu, thuongNgan, diaPhu, thienPhu, hauDong } from './realms';
import { SECRETS } from '../../data/story';

const at = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => {
  o.position.set(x, y, z);
  return o;
};
const scl = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => {
  o.scale.set(x, y, z);
  return o;
};
const rot = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => {
  o.rotation.set(x, y, z);
  return o;
};

/**
 * Phủ Vân Thủy, "the Cloud and Water Temple": a fictional Mother Goddess temple
 * on a river bend under karst mountains in northern Vietnam.
 *
 * Layout (forward = -z):
 *  river & landing (z≈62) → path past the half-moon lotus pond and a turtle stele →
 *  tam quan gate (z=40) → brick courtyard with banyan, incense burner, furnace, amulet table →
 *  main hall (z≈-12) with the Tứ phủ altar · bell tower to the east · mountain grotto to the west.
 */

// key positions
const GATE_Z = 40;
const HALL = { x: 0, z: -12, w: 22, d: 14 };
const HALL_FRONT = HALL.z + HALL.d / 2; // -5
const POD = { x0: -12.5, x1: 12.5, z0: HALL.z - HALL.d / 2 - 1.5, z1: HALL_FRONT + 1.5 };
const POND = { x: -15, z: 50, r: 8 };
const BANYAN = { x: -14, z: 22 };
const GROTTO = { x: -27, z: -14 };
const BELL = { x: 22, z: -8 };
const FLOOR_Y = 1.08;

export const phuVanThuy: Layout = (ctx) => {
  const { vk, nat, m } = ctx;
  const v = vk.v;

  /* ---------------- ground ---------------- */
  const inPond = (x: number, z: number) => Math.hypot(x - POND.x, z - POND.z) < POND.r && z > POND.z - 0.5;
  ctx.setGround((x, z) => {
    // hall podium and its steps
    if (x > POD.x0 && x < POD.x1 && z > POD.z0 && z < POD.z1) return FLOOR_Y;
    if (Math.abs(x) < 6.6 && z >= POD.z1 && z < POD.z1 + 1.9) return FLOOR_Y * (1 - (z - POD.z1) / 1.9);
    // grotto terrace, climbing to the west
    if (x < -19) {
      const t = Math.min(1, (-19 - x) / 5);
      const base = 2.4 * t * Math.max(0, Math.min(1, (6 - z) / 6));
      return base + Math.max(0, -34 - x) * 1.2;
    }
    // pond bed
    if (inPond(x, z)) return -1.2 * (1 - Math.hypot(x - POND.x, z - POND.z) / POND.r);
    // river bank
    if (z > 63) return -0.6 - (z - 63) * 0.3;
    // outside the enclosure: gentle rolling fields
    if (Math.abs(x) > 32 || z < -26) return Math.max(0, hills(x, z, 1.4, 0.05)) + Math.max(0, -26 - z) * 0.15;
    return 0;
  });
  ctx.terrain(0x55703f, 420, 170);

  /* ---------------- river, landing, path ---------------- */
  const river = ctx.water(-0.35, 420, 140, 0, 136, 0x2f6f6a);
  const pond = ctx.water(-0.25, POND.r * 2, POND.r * 2, POND.x, POND.z, 0x356b4f);
  // keep only the half-moon: clip with a mask disc + cover the flat side with the path bank
  pond.geometry = new THREE.CircleGeometry(POND.r, 40, Math.PI, Math.PI);
  pond.rotation.set(-Math.PI / 2, 0, 0);
  pond.position.set(POND.x, -0.25, POND.z - 0.5);
  ctx.scene.add(vk.lotus(46, (i) => {
    const a = (i * 2.399) % Math.PI, r = 1.2 + ((i * 53) % 60) / 10;
    return [POND.x + Math.cos(a) * r, POND.z - 0.5 + Math.sin(a) * r];
  }, -0.25));
  // stone rim on the straight side
  ctx.add(new THREE.Mesh(new THREE.BoxGeometry(POND.r * 2 + 0.6, 0.35, 0.5), v.stone), POND.x, POND.z - 0.75, 0, 0.1);

  // landing stage and path to the gate
  const dock = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 6), v.wood);
  ctx.add(dock, 0, 65, 0, -0.1);
  ctx.path([[0, 63], [0, 42]], 4.5, 'paving').material = v.stone;
  ctx.path([[0, 39], [0, -1.5]], 4, 'paving').material = v.stone;
  // brick courtyard
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(52, 41), v.brick);
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(-1, 0.02, 18.5);
  yard.receiveShadow = true;
  ctx.scene.add(yard);

  /* ---------------- gate and enclosure ---------------- */
  const gate = vk.tamQuan('PHỦ VÂN THỦY');
  ctx.add(gate, 0, GATE_Z);
  // enclosure walls with little tiled caps
  const wall = (x0: number, z0: number, x1: number, z1: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(L, 2.2, 0.6), v.ochre);
    body.position.y = 1.1;
    g.add(body);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(L + 0.2, 0.25, 1.0), v.tile);
    cap.position.y = 2.3;
    g.add(cap);
    ctx.add(g, (x0 + x1) / 2, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0));
  };
  wall(-32, GATE_Z, -11.5, GATE_Z);
  wall(11.5, GATE_Z, 32, GATE_Z);
  wall(32, GATE_Z, 32, -24);
  wall(-32, GATE_Z, -32, 8);

  /* ---------------- courtyard ---------------- */
  const burner = vk.incenseBurner();
  ctx.add(burner, 0, 14);
  const furnace = vk.furnace();
  ctx.add(furnace, 14, 10, -0.6);
  const banyan = vk.banyan(1.05);
  ctx.add(banyan, BANYAN.x, BANYAN.z);
  // amulet & lộc table under a red parasol
  const stall = new THREE.Group();
  stall.add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 0.9, 1.2), v.lacquer), 0, 0.45, 0));
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.05, 1.3), new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.6 }));
  cloth.position.y = 0.92;
  stall.add(cloth);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), v.wood);
  pole.position.set(1.2, 1.5, -0.4);
  stall.add(pole);
  const parasol = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.6, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xc81e1e, side: THREE.DoubleSide, roughness: 0.7 }));
  parasol.position.set(1.2, 3.0, -0.4);
  stall.add(parasol);
  [0xc81e1e, 0xd4a017, 0x2f8a4a, 0xf4f1ea, 0x2c5fa8].forEach((c, i) => {
    const it = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.06), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
    it.position.set(-1.1 + i * 0.5, 1.1, 0.2);
    stall.add(it);
  });
  ctx.add(stall, 10, 32, -0.4);

  // keeper of the temple (Bà Thủ Từ)
  const keeper = new THREE.Group();
  keeper.name = 'keeper';
  const robe = new THREE.MeshStandardMaterial({ color: 0x6d2a6a, roughness: 0.6 });
  keeper.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.48, 1.35, 10), robe), 0, 0.68, 0));
  keeper.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe0b994 })), 0, 1.5, 0));
  const khan = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 6, 14), new THREE.MeshStandardMaterial({ color: 0x2a1a12 }));
  khan.rotation.x = Math.PI / 2;
  khan.position.y = 1.6;
  keeper.add(khan);
  ctx.add(keeper, 4.5, 16.5, -2.4);

  // five-colour festival flags (cờ ngũ sắc) along the path
  const flagCols = [0xd4a017, 0xc81e1e, 0x2c5fa8, 0xf4f1ea, 0x2f8a4a];
  const flags: THREE.Mesh[] = [];
  [46, 52, 58].forEach((z) =>
    [-3.6, 3.6].forEach((x) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 7, 6), v.lacquer);
      ctx.add(p, x, z, 0, 3.5);
      const tex = (() => {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 160;
        const g = c.getContext('2d')!;
        flagCols.forEach((col, i) => {
          g.fillStyle = '#' + col.toString(16).padStart(6, '0');
          g.fillRect(0, (i * 160) / 5, 64, 160 / 5 + 1);
        });
        return new THREE.CanvasTexture(c);
      })();
      tex.colorSpace = THREE.SRGBColorSpace;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.6, 6, 1), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 }));
      ctx.add(f, x + Math.sign(x) * 0.55, z, Math.PI / 2, 5.4);
      flags.push(f);
    })
  );
  nat.animated.push({
    update: (t) =>
      flags.forEach((f, i) => {
        const p = f.geometry.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < p.count; k++) {
          const x = p.getX(k);
          p.setZ(k, Math.sin(t * 2.4 + x * 3 + i) * 0.12 * (x + 0.5));
        }
        p.needsUpdate = true;
      }),
  });

  // secrets of the grounds: the well, a paper horse, a betel vine on an areca palm, a kapok by the river
  ctx.add(vk.well(), 22, 16.4);
  ctx.add(vk.paperHorse(), 17.4, 10.6, -0.3);
  ctx.add(vk.betelVine(4.2, 0.24), 28, 30);
  ctx.add(vk.kapok(1), -27, 56.5);

  // water-puppet pavilion on the lotus pond: the legend of the Mothers is told here
  const thuyDinh = vk.thuyDinh();
  thuyDinh.position.set(-18.6, 0, 53.6);
  thuyDinh.rotation.y = Math.PI / 2;
  ctx.scene.add(thuyDinh);
  const puppets = thuyDinh.userData.puppets as THREE.Group;
  nat.animated.push({
    update: (t) =>
      puppets.children.forEach((c, i) => {
        c.position.y = Math.sin(t * 1.6 + i * 1.3) * 0.06;
        c.rotation.y = Math.sin(t * 0.7 + i) * 0.35;
      }),
  });

  // turtle stele outside the gate
  const stele = vk.turtleStele('Bia ký Phủ Vân Thủy');
  ctx.add(stele, 12, 52, -0.3);

  /* ---------------- main hall ---------------- */
  const hall = vk.mainHall({ w: HALL.w, d: HALL.d, name: 'MẪU NGHI THIÊN HẠ' });
  ctx.add(hall, HALL.x, HALL.z);
  const altar = vk.altar();
  ctx.add(altar, 0, HALL.z - HALL.d / 2 + 2.4, 0, FLOOR_Y);
  // snakes (Ông Lốt) coiled up the two inner front pillars
  const snakeG = vk.coiledSnake(0x3f8a3f, 4.6, 0.3);
  ctx.add(snakeG, -4.4 - 2.2, HALL.z + HALL.d / 6, 0, FLOOR_Y);
  const snakeW = vk.coiledSnake(0xeeeae0, 4.6, 0.3);
  ctx.add(snakeW, 4.4 + 2.2, HALL.z + HALL.d / 6, 0, FLOOR_Y);
  // fortune-stick table (xin xăm) on the right inside
  const xam = new THREE.Group();
  xam.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.9), v.lacquer), 0, 0.45, 0));
  const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 12), v.bronze);
  tubeM.position.set(-0.3, 1.15, 0);
  xam.add(tubeM);
  for (let k = 0; k < 12; k++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.45, 0.01), v.wood);
    st.position.set(-0.3 + Math.cos(k) * 0.08, 1.45, Math.sin(k) * 0.08);
    xam.add(st);
  }
  [0.25, 0.45].forEach((x) => xam.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), v.gold), x, 0.92, 0.1)));
  ctx.add(xam, 8.8, -9, -Math.PI / 2, FLOOR_Y);
  // red lanterns along the eaves
  const lanterns: THREE.Group[] = [];
  [-8.8, -4.4, 4.4, 8.8].forEach((x) => {
    const l = vk.lantern(0.42);
    ctx.add(l, x, HALL_FRONT + 1.6, 0, FLOOR_Y + 5.6);
    lanterns.push(l);
  });
  [-3.2, 3.2].forEach((x) => {
    const l = vk.lantern(0.5);
    ctx.add(l, x, GATE_Z + 1.6, 0, 4.6);
    lanterns.push(l);
  });
  const lights: THREE.PointLight[] = [];
  [[0, HALL_FRONT + 2, FLOOR_Y + 5], [0, GATE_Z + 2, 4.2], [0, 14, 3.4]].forEach(([x, z, y]) => {
    const pl = new THREE.PointLight(0xff9a4a, 0, 18, 1.6);
    pl.position.set(x, y, z);
    ctx.scene.add(pl);
    lights.push(pl);
  });

  /* ---------------- bell tower and grotto ---------------- */
  const tower = vk.bellTower();
  ctx.add(tower, BELL.x, BELL.z, -Math.PI / 2);
  const grotto = vk.grotto();
  ctx.add(grotto, GROTTO.x, GROTTO.z, Math.PI / 2);
  // stone steps up to the grotto terrace
  for (let i = 0; i < 6; i++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 3), v.stone);
    const x = -19.2 - i * 0.82;
    ctx.add(st, x, -12, 0, -0.15);
  }

  /* ---------------- planting & landscape ---------------- */
  // areca palms (cau) along the path, bamboo and broadleaf trees around the enclosure
  const arecas: [number, number, number?][] = [];
  [44, 49, 55, 60].forEach((z) => [-6.5, 6.5].forEach((x) => arecas.push([x, z, 0.75])));
  [[-26, 34], [-22, 36], [24, 34], [28, 30], [26, 2], [28, 14], [-28, 30]].forEach(([x, z]) => arecas.push([x, z, 0.8]));
  ctx.scene.add(nat.forest('palm', arecas, [0.85, 1.05], ctx.ground));
  ctx.scene.add(nat.forest('bamboo', [[-29, 18], [-29, 4], [29, -18], [-8, -24], [8, -25], [-30, 24], [30, 22], [16, 60], [-26, 60]], [0.8, 1.1], ctx.ground));
  const clear = (x: number, z: number) => (Math.abs(x) < 34 && z > -28 && z < 68) || z > 66;
  ctx.scene.add(nat.forest('broadleaf', nat.scatter(70, { x0: -120, x1: 120, z0: -90, z1: 66 }, clear, 5), [0.9, 1.5], ctx.ground));
  // rice paddies beyond the east wall
  const paddyM = new THREE.MeshStandardMaterial({ color: 0x9cbf4a, roughness: 0.9 });
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), paddyM);
      p.rotation.x = -Math.PI / 2;
      p.position.set(40 + i * 10, ctx.ground(40 + i * 10, -10 + j * 10) + 0.05, -10 + j * 10 + (i % 2) * 2);
      ctx.scene.add(p);
    }
  // karst mountains all around
  const karsts: [number, number, number, number][] = [
    [-48, -20, 14, 38], [-60, 10, 12, 30], [-44, -50, 18, 46], [-10, -70, 20, 52], [26, -66, 16, 40], [56, -44, 14, 34],
    [70, 4, 12, 28], [-80, 40, 16, 34], [40, 150, 20, 40], [-30, 170, 24, 50], [90, 120, 18, 36], [-110, -10, 20, 44],
  ];
  karsts.forEach(([x, z, r, h], i) => {
    const k = vk.karst(r, h, i + 1);
    k.position.x = x;
    k.position.z = z;
    k.position.y += ctx.ground(x, z) - 10;
    ctx.scene.add(k);
  });

  /* ---------------- realms & secrets ---------------- */
  const pondZone = (x: number, z: number) => Math.hypot(x - POND.x, z - (POND.z - 0.5)) < POND.r - 0.8 && z > POND.z - 0.2;
  const banyanZone = (x: number, z: number) => Math.hypot(x - BANYAN.x, z - BANYAN.z) < 3.1;
  const grottoZone = (x: number, z: number) => Math.hypot(x - (GROTTO.x + 1.2), z - GROTTO.z) < 1.8;

  const spots: SpotDef[] = [
    { id: 'gate', type: 'gate', name: 'Three-entrance gate', vi: 'Tam quan', at: [-6.2, 45], look: [-6.2, 40] },
    { id: 'stall', type: 'stall', name: 'Amulet & lộc table', vi: 'Bàn lộc', at: [8.4, 29.8], look: [10, 32] },
    { id: 'keeper', type: 'keeper', name: 'The temple keeper', vi: 'Bà Thủ Từ', at: [1.2, 20.2], look: [4.5, 16.5] },
    { id: 'incense', type: 'incense', name: 'Great incense burner', vi: 'Lư hương', at: [-2.8, 17.2], look: [0, 14] },
    { id: 'furnace', type: 'furnace', name: 'Petition furnace', vi: 'Lò hóa vàng', at: [11.4, 13.4], look: [14, 10] },
    { id: 'altar', type: 'altar', name: 'Altar of the Four Palaces', vi: 'Ban thờ Tứ phủ', at: [0, -9.4], look: [0, -15], r: 3.6 },
    { id: 'fortune', type: 'fortune', name: 'Fortune sticks', vi: 'Xin xăm', at: [6.8, -9], look: [8.8, -9], r: 2.4 },
    { id: 'bell', type: 'bell', name: 'Bell tower', vi: 'Gác chuông', at: [18, -8], look: [BELL.x, BELL.z] },
    { id: 'river', type: 'river', name: 'Lantern landing', vi: 'Bến thả đèn', at: [0, 63], look: [0, 74], r: 3.4 },
    { id: 'seat', type: 'haudong', name: 'Hầu đồng mat', vi: 'Chiếu xem hầu đồng', at: [-3.4, -6.6], look: [0, -11], r: 2.2 },
    { id: 'theatre', type: 'theatre', name: 'Water-puppet pavilion', vi: 'Thủy đình', at: [-7, 54.6], look: [-18.6, 53.6], r: 3.4 },
    { id: 'pond', type: 'view', name: 'Half-moon lotus pond', vi: 'Hồ bán nguyệt', at: [-5, 47], look: [POND.x, POND.z] },
    { id: 'banyan', type: 'view', name: 'The old banyan', vi: 'Cây đa', at: [-8, 26], look: [BANYAN.x, BANYAN.z] },
    { id: 'grotto', type: 'view', name: 'Mountain grotto', vi: 'Sơn trang', at: [-18, -12], look: [GROTTO.x, GROTTO.z] },
  ];

  const walls = (x: number, z: number) => {
    // gate piers and walls along z=40 (openings: centre |x|<2 handled by etiquette, sides 5.1–7.2)
    if (Math.abs(z - GATE_Z) < 1.2) {
      const ax = Math.abs(x);
      return !(ax < 2 || (ax > 5.1 && ax < 7.2));
    }
    // hall walls: back, sides, front with two side doors
    const hx = Math.abs(x - HALL.x);
    if (hx < 11.2 && z > HALL.z - HALL.d / 2 - 0.4 && z < HALL_FRONT + 0.4) {
      if (hx > 10.6) return true; // side walls
      if (z < HALL.z - HALL.d / 2 + 0.6) return true; // back wall
      if (z > HALL_FRONT - 0.5) {
        const door = Math.abs(Math.abs(x) - 4.4) < 1.6;
        return !door && !(Math.abs(x) < 2); // centre door handled by etiquette
      }
    }
    // enclosure walls
    if (Math.abs(Math.abs(x) - 32) < 0.6 && z < GATE_Z && z > -24) return true;
    return false;
  };

  return {
    spots,
    spawn: { x: 0, z: 62, rotY: 0 },
    bounds: { x0: -31, x1: 31, z0: -24, z1: 64 },
    walkable: (x, z) => {
      if (walls(x, z)) return false;
      if (Math.hypot(x - BANYAN.x, z - BANYAN.z) < 2.3) return false;
      if (Math.hypot(x, z - 14) < 1.5) return false; // incense burner
      if (Math.abs(x - 14) < 1.6 && Math.abs(z - 10) < 1.6) return false; // furnace
      if (Math.abs(x - BELL.x) < 3.2 && Math.abs(z - BELL.z) < 3.2 && Math.hypot(x - BELL.x, z - BELL.z) > 1.0 && !(Math.abs(z - BELL.z) < 2.2 && x < BELL.x)) return false;
      if (x < -31.5 + 6 && Math.abs(z - GROTTO.z) < 6 && x < GROTTO.x - 0.5) return false; // rock behind grotto
      if (z < -22) return false;
      if (Math.abs(x - 10) < 1.8 && Math.abs(z - 32) < 1.1) return false; // stall
      if (Math.abs(x - 12) < 1.4 && Math.abs(z - 52) < 1.9) return false; // stele
      if (Math.hypot(x - 22, z - 16.4) < 1.3) return false; // well
      if (Math.abs(x - 17.4) < 1.0 && Math.abs(z - 10.6) < 0.6) return false; // paper horse
      if (Math.hypot(x + 27, z - 56.5) < 1.8) return false; // kapok
      return true;
    },
    encounters: [
      thoaiPhu({ zone: pondZone, exit: { x: -5, z: 47, rotY: Math.PI / 2 } }),
      thuongNgan({ zone: grottoZone, exit: { x: -18, z: -12, rotY: Math.PI / 2 } }),
      diaPhu({ zone: banyanZone, exit: { x: -8, z: 26, rotY: -Math.atan2(-6, 4) } }),
      thienPhu({ zone: () => false, exit: { x: 18, z: -8, rotY: -Math.PI / 2 } }),
      hauDong({ zone: () => false, exit: { x: 0, z: -8.5, rotY: 0 } }),
    ],
    secrets: SECRETS.map((s) => ({ ...s })),
    etiquette: {
      forbidden: [
        { test: (x, z) => Math.abs(x) < 2 && Math.abs(z - GATE_Z) < 1.1, reason: 'The central gate of the tam quan is for the gods. People use the side gates.', penalty: 2 },
        { test: (x, z) => Math.abs(x) < 2 && z > HALL_FRONT - 0.6 && z < HALL_FRONT + 0.5, reason: 'The central door is reserved for the Mothers. Please enter by a side door.', penalty: 2 },
        { test: (x, z) => Math.abs(x) < 4.6 && z < HALL.z - HALL.d / 2 + 4.2 && z > HALL.z - HALL.d / 2, reason: 'Only the temple keeper goes up to the altar. Pray from in front.', penalty: 3 },
      ],
      thresholds: [-4.4, 4.4].map((dx) => ({ test: (x: number, z: number) => Math.abs(x - dx) < 1.6 && Math.abs(z - (HALL_FRONT - 0.1)) < 0.25 })),
      calm: (x, z) => Math.abs(x) < 32 && z < GATE_Z && z > -24,
    },
    nightObjects: [],
    particles: 'leaves',
    smoke: [0, 3.1, 14],
    fog: 0.9,
    orbit: { x: 0, z: 10, r: 46, y: 18 },
    bobbingWater: river,
    onTime: (time: 'day' | 'twilight' | 'night') => {
      const k = time === 'night' ? 1 : time === 'twilight' ? 0.55 : 0;
      (river.material as THREE.MeshStandardMaterial).color.setHex(time === 'night' ? 0x123232 : time === 'twilight' ? 0x2a5e5a : 0x2f6f6a);
      (pond.material as THREE.MeshStandardMaterial).color.setHex(time === 'night' ? 0x16302a : 0x356b4f);
      lights.forEach((l) => (l.intensity = 22 * k));
      lanterns.forEach((l) => {
        const mat = l.userData.glowMat as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.35 + k * 1.6;
      });
    },
  };
};

export const WORLD = { GATE_Z, HALL, HALL_FRONT, POND, BANYAN, GROTTO, BELL, FLOOR_Y };
