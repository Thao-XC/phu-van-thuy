import * as THREE from 'three';
import type { EncounterDef, EncounterKit, EncounterRuntime, EncounterApi, EncounterPlayer } from '../encounters/types';
import { fishSchool, koi, turtle, coralPatch, seaweed, dragon, robedFigure, spiritOrbs, lightShaft } from '../encounters/figures';
import { soundService } from '../../services/soundService';

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

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
type Place = { zone: (x: number, z: number) => boolean; exit: { x: number; z: number; rotY: number } };

function timeline() {
  const fired = new Set<string>();
  return (key: string, cond: boolean, fn: () => void) => {
    if (cond && !fired.has(key)) {
      fired.add(key);
      fn();
    }
  };
}

function floor(root: THREE.Group, ground: (x: number, z: number) => number, size: number, color: number, seg = 70) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const base = new THREE.Color(color);
  const tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    p.setY(i, ground(p.getX(i), p.getZ(i)));
    const h = Math.sin(p.getX(i) * 12.9898 + p.getZ(i) * 78.233) * 43758.5453;
    tmp.copy(base).offsetHSL(0, 0, (h - Math.floor(h) - 0.5) * 0.08);
    cols.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  m.receiveShadow = true;
  root.add(m);
  return m;
}

function place<T extends THREE.Object3D>(root: THREE.Group, o: T, x: number, y: number, z: number, rotY = 0, s = 1): T {
  o.position.set(x, y, z);
  o.rotation.y = rotY;
  o.scale.multiplyScalar(s);
  root.add(o);
  return o;
}

const dist = (p: { x: number; z: number }, x: number, z: number) => Math.hypot(p.x - x, p.z - z);
const face = (o: THREE.Object3D, p: EncounterPlayer) => (o.rotation.y = Math.atan2(p.x - o.position.x, p.z - o.position.z));

/** A glowing collectible with a soft light that bobs and spins */
function glowItem(root: THREE.Group, obj: THREE.Object3D, x: number, y: number, z: number, color: number) {
  const g = new THREE.Group();
  g.add(obj);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }));
  g.add(halo);
  const light = new THREE.PointLight(color, 6, 9, 2);
  g.add(light);
  g.position.set(x, y, z);
  root.add(g);
  return { g, x, z, y, taken: false };
}

/** Three things to find. Returns how many are taken. */
function collect(items: ReturnType<typeof glowItem>[], p: EncounterPlayer, t: number, onTake: (i: number, n: number) => void, r = 2) {
  let n = 0;
  items.forEach((it, i) => {
    if (it.taken) {
      n++;
      return;
    }
    it.g.position.y = it.y + Math.sin(t * 2 + i) * 0.25;
    it.g.rotation.y = t * 1.2;
    if (dist(p, it.x, it.z) < r) {
      it.taken = true;
      it.g.visible = false;
      soundService.playBellChime();
      n++;
      onTake(i, items.filter((x) => x.taken).length);
    }
  });
  return n;
}

/** A Mother appearing in a column of light, robe in her palace colour */
function motherApparition(root: THREE.Group, robe: number, under: number, x: number, y: number, z: number) {
  const fig = robedFigure({ robe, under, longHair: true, hat: 'crown', h: 2.4 });
  fig.position.set(x, y, z);
  fig.visible = false;
  root.add(fig);
  const shaft = lightShaft(26, 2.4, robe === 0xf4f1ea ? 0xffffff : robe);
  shaft.position.set(x, y + 13, z);
  shaft.visible = false;
  (shaft.material as THREE.MeshBasicMaterial).opacity = 0.14;
  root.add(shaft);
  const glow = new THREE.PointLight(robe, 0, 16, 1.6);
  glow.position.set(x, y + 2.5, z);
  root.add(glow);
  return {
    fig,
    show() {
      fig.visible = true;
      shaft.visible = true;
      glow.intensity = 22;
    },
  };
}

const scarfCaption = (api: EncounterApi, color: string, palace: string) =>
  api.caption(`She places a ${color} scarf in your hands. "Take it home. The ${palace} is with you."`, 5);

/* ================================================================== */
/* 1. Thoải phủ: the Water Palace (white)                              */
/* ================================================================== */
export const thoaiPhu = (p: Place): EncounterDef => ({
  id: 'realm-thoai',
  title: 'Thoải phủ',
  zone: p.zone,
  exit: p.exit,
  diveColor: 0x1d5a66,
  card: {
    title: 'Thoải phủ: the Water Palace',
    jp: 'Mẫu Thoải · 水府',
    body: [
      'Mẫu Thoải, the Mother of the Water Palace, rules rivers, lakes and the sea, and she always wears white. In many tellings she is a daughter of the Dragon King (Long Vương).',
      'In a land of rice paddies, deltas and floods, water gives life and takes it away. Fishermen, boatmen and families living along the Red River pray to her for calm water and safe journeys.',
      'In the hầu đồng ceremony, the ladies of the Water Palace often dance as if rowing a boat, with oars made of fans.',
    ],
    ending: 'You surface in the lotus pond, dry as if you had never left. In your hands, a white silk scarf.',
  },
  build: (k: EncounterKit): EncounterRuntime => {
    const { root, vk } = k;
    const ground = (x: number, z: number) => Math.sin(x * 0.13) * Math.cos(z * 0.11) * 0.7 + Math.max(0, Math.hypot(x, z) - 32) * 0.7;
    floor(root, ground, 120, 0xd9cfae);
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshBasicMaterial({ color: 0x9fe6ee, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
    surf.rotation.x = Math.PI / 2;
    surf.position.y = 18;
    root.add(surf);
    const anims: ((t: number) => void)[] = [];
    // the pearl-white palace
    const pal = new THREE.Group();
    const white = vk.v.plasterWhite;
    pal.add(at(new THREE.Mesh(new THREE.BoxGeometry(16, 5, 9), white), 0, 2.5, 0));
    pal.add(at(new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.2), new THREE.MeshBasicMaterial({ color: 0x0c2a33 })), 0, 2, 4.55));
    const r1 = vk.roof({ w: 19, d: 12, h: 2.4, dragons: true });
    r1.position.y = 5;
    pal.add(r1);
    const r2 = vk.roof({ w: 10, d: 7, h: 2.2 });
    r2.position.y = 7.6;
    pal.add(r2);
    pal.add(at(new THREE.Mesh(new THREE.BoxGeometry(8, 1.6, 5), white), 0, 6.6, 0));
    place(root, pal, 0, 0, -22);
    const pglow = new THREE.PointLight(0xdffaff, 26, 40, 1.4);
    pglow.position.set(0, 7, -14);
    root.add(pglow);
    // sea life
    const school = place(root, fishSchool(110, [0xf4f1ea, 0xbfe3ff, 0xf2c94c], 16, 9), 0, 3, 0);
    anims.push(school.userData.animate!);
    const kelp = place(root, seaweed(70, 56, 0x4f8a5a, 4.5), 0, 0, 0);
    anims.push(kelp.userData.animate!);
    place(root, coralPatch(46, 50, 7), 0, 0, 6);
    const kois = [koi(2.2, [0xf6efe6, 0xe0461f]), koi(1.8, [0xf6efe6, 0x1b1b1b]), koi(2.0, [0xf2c94c, 0xf6efe6])];
    kois.forEach((f) => root.add(f));
    const tur = place(root, turtle(), 8, 5, 6, 0, 1.6);
    // the white dragon of the Water Palace
    const drg = dragon({ color: 0xeef3f6, len: 30 });
    drg.userData.pathAt = (u: number, t: number) => {
      const a = t * 0.22 - u * 3.2;
      return new THREE.Vector3(Math.cos(a) * 20, 9 + Math.sin(a * 2) * 2.5, Math.sin(a) * 20 - 6);
    };
    root.add(drg);
    anims.push(drg.userData.animate!);
    // something vast in the deep
    const shadow = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshBasicMaterial({ color: 0x06161c, transparent: true, opacity: 0.0, depthWrite: false }));
    shadow.scale.set(14, 3, 5);
    root.add(shadow);
    [[-12, 6], [12, -4], [0, 14], [-18, -16], [18, -20]].forEach(([x, z]) => place(root, lightShaft(20, 2.4), x, 0, z));
    // three pearls
    const pearl = () => new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.3, emissive: 0xbfe9ff, emissiveIntensity: 0.6 }));
    const clam = () => {
      const g = new THREE.Group();
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf2d6c8, roughness: 0.6, side: THREE.DoubleSide }));
      sh.rotation.x = Math.PI;
      sh.position.y = 0.05;
      g.add(sh);
      const top = sh.clone();
      top.rotation.x = -0.8;
      top.position.set(0, 0.25, -0.5);
      g.add(top);
      return g;
    };
    const spots: [number, number][] = [[-14, 4], [15, 10], [9, -13]];
    spots.forEach(([x, z]) => place(root, clam(), x, ground(x, z), z));
    const items = spots.map(([x, z]) => glowItem(root, pearl(), x, ground(x, z) + 0.9, z, 0xbfe9ff));
    const mo = motherApparition(root, 0xf4f1ea, 0xd8e6ee, 0, 0, -15.5);
    const tl = timeline();
    let got = 0;
    return {
      enter: { x: 0, z: 22, rotY: 0 },
      ground,
      bounds: { x0: -28, x1: 28, z0: -20, z1: 28 },
      walkable: (x, z) => !(Math.abs(x) < 8.6 && z < -17.2),
      env: { bg: 0x0d4552, fog: 0x2a8090, density: 0.035, sun: 1.0, sunColor: 0xd8f6ff, hemi: 1.0, ambient: 0.4 },
      underwater: true,
      update: (t, _dt, pl, api) => {
        anims.forEach((a) => a(t));
        kois.forEach((f, i) => {
          const a = t * (0.3 + i * 0.07) + i * 2;
          f.position.set(Math.cos(a) * (8 + i * 3), 2 + i, Math.sin(a) * (8 + i * 3) + 4);
          f.rotation.y = -a;
          f.userData.animate?.(t);
        });
        tur.position.set(8 + Math.sin(t * 0.2) * 6, 5 + Math.sin(t * 0.5), 6 + Math.cos(t * 0.2) * 4);
        tur.rotation.y = t * 0.2 + Math.PI / 2;
        tl('in', t > 0.4, () => {
          soundService.playSplash();
          api.caption('The pond has no bottom. You sink, slowly, into pale green light…', 5);
        });
        tl('palace', t > 6, () => api.caption('A palace of white tiles below the water. Somewhere, three pearls are glowing.', 5));
        // the shadow passes overhead once
        if (t > 14 && t < 26) {
          const u = (t - 14) / 12;
          shadow.position.set(-40 + u * 80, 15, -2 + Math.sin(u * 3) * 4);
          (shadow.material as THREE.MeshBasicMaterial).opacity = Math.sin(u * Math.PI) * 0.75;
        }
        tl('shadow', t > 16, () => {
          soundService.playRumble(3);
          api.caption('Something vast passes above you, blotting out the light… then it is gone.', 5);
        });
        got = collect(items, pl, t, (_i, n) => api.caption(n < 3 ? `A pearl of the Water Palace (${n} of 3).` : 'The third pearl. The palace doors begin to glow.', 4));
        tl('mother', got === 3, () => {
          mo.show();
          api.flash(0xffffff, 0.6, 1.0);
          api.caption('Mẫu Thoải, the Water Mother, stands at the palace gate. Go to her.', 5);
        });
        if (mo.fig.visible) face(mo.fig, pl);
        tl('scarf', got === 3 && dist(pl, 0, -15.5) < 3.2, () => {
          scarfCaption(api, 'white', 'Water Palace');
          api.end(0xffffff, 2.4);
        });
        tl('timeout', t > 240, () => api.end(0x9fe6ee, 2));
      },
    };
  },
});

/* ================================================================== */
/* 2. Thượng Ngàn: the Mountain & Forest Palace (green)                */
/* ================================================================== */
export const thuongNgan = (p: Place): EncounterDef => ({
  id: 'realm-thuong-ngan',
  title: 'Thượng Ngàn',
  zone: p.zone,
  exit: p.exit,
  diveColor: 0x0f2414,
  card: {
    title: 'Thượng Ngàn: the Mountain & Forest Palace',
    jp: 'Mẫu Thượng Ngàn · 岳府',
    body: [
      'Mẫu Thượng Ngàn rules the mountains and forests, the animals and plants, and the peoples of the highlands. She wears green. Among her best-known temples are Đền Bắc Lệ in Lạng Sơn and Đền Suối Mỡ in Bắc Giang.',
      'The forest palace is full of spirits: the little Cô and Cậu who play in the woods, and Ông Hổ, Lord Tiger, the guardian of the mountains, who also crouches beneath temple altars.',
      'Its ladies dance with baskets and fans in the hầu đồng, and often speak with the accents of the highland peoples.',
    ],
    ending: 'You step out of the grotto with forest moss on your sleeves, and a green scarf around your wrist.',
  },
  build: (k: EncounterKit): EncounterRuntime => {
    const { root, nat, vk } = k;
    const pathX = (z: number) => Math.sin(z * 0.08) * 7;
    const ground = (x: number, z: number) => Math.max(0, Math.abs(x - pathX(z)) - 3) * 0.35 + Math.sin(x * 0.2) * Math.cos(z * 0.17) * 0.8 + Math.max(0, -z - 20) * 0.25;
    floor(root, ground, 140, 0x2f4a2a);
    const anims: ((t: number) => void)[] = [];
    // forest: big broadleaf trees, bamboo and palms, keeping the path clear
    const clear = (x: number, z: number) => Math.abs(x - pathX(z)) < 5 || Math.hypot(x, z + 34) < 10;
    const g1 = nat.forest('broadleaf', nat.scatter(110, { x0: -60, x1: 60, z0: -60, z1: 50 }, clear, 11), [1.0, 1.7], ground);
    const g2 = nat.forest('bamboo', nat.scatter(50, { x0: -50, x1: 50, z0: -55, z1: 45 }, clear, 23), [0.9, 1.2], ground);
    const g3 = nat.forest('palm', nat.scatter(16, { x0: -40, x1: 40, z0: -50, z1: 40 }, clear, 37), [0.8, 1.0], ground);
    [g1, g2, g3].forEach((g) => root.add(g));
    // karst walls around the clearing
    [[-22, -44, 10, 30], [20, -46, 12, 34], [0, -60, 16, 40], [-34, -20, 9, 22], [34, -16, 9, 24]].forEach(([x, z, r, h], i) => {
      const m = vk.karst(r, h, i + 3);
      m.position.x = x;
      m.position.z = z;
      m.position.y += ground(x, z) - 2;
      root.add(m);
    });
    // waterfall into the clearing
    const wf = nat.waterfall(16, 4);
    place(root, wf, 0, ground(0, -44) - 1, -44);
    // fireflies
    const ff = place(root, spiritOrbs(46, 0xd9ff8a, 26, 6), 0, 0, -6);
    ff.scale.setScalar(0.5);
    anims.push(ff.userData.animate!);
    // the little forest girl who leads the way (Cô Bé Thượng Ngàn)
    const girl = robedFigure({ robe: 0x3f9a4f, under: 0xe8d28a, longHair: true, h: 1.3 });
    root.add(girl);
    // tiger eyes in the dark, and later the tiger himself
    const eyes = new THREE.Group();
    [-0.3, 0.3].forEach((x) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23a }));
      e.position.x = x;
      eyes.add(e);
    });
    place(root, eyes, 14, ground(14, -6) + 1.2, -6, -1.2);
    const tiger = vk.tiger(0xe0a030);
    tiger.scale.setScalar(3.2);
    tiger.visible = false;
    place(root, tiger, -4.5, ground(-4.5, -34), -34, Math.PI / 2);
    // three gifts of the forest
    const orchid = () => {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const pet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc77dd9, emissive: 0x3a1048 }));
        pet.scale.set(1, 0.5, 1.6);
        pet.position.set(Math.cos(i * 1.25) * 0.18, 0, Math.sin(i * 1.25) * 0.18);
        pet.rotation.y = -i * 1.25;
        g.add(pet);
      }
      return g;
    };
    const shoot = () => new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 7), new THREE.MeshStandardMaterial({ color: 0xc8b46a, roughness: 0.7 }));
    const betel = () => {
      const g = new THREE.Group();
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 6), new THREE.MeshStandardMaterial({ color: 0x3f8a3a }));
      leaf.scale.set(1, 0.2, 1.4);
      g.add(leaf);
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd9a020 }));
      nut.position.y = 0.15;
      g.add(nut);
      return g;
    };
    const giftSpots: [number, number, string][] = [[pathX(10) + 1.5, 10, 'A wild orchid (lan rừng), glowing faintly'], [pathX(-8) - 1.5, -8, 'A young bamboo shoot (măng tre)'], [pathX(-24) + 1.2, -24, 'Betel leaves and an areca nut (trầu cau), the oldest offering of all']];
    const makers = [orchid, shoot, betel];
    const items = giftSpots.map(([x, z], i) => glowItem(root, makers[i](), x, ground(x, z) + 1.0, z, 0xb6ff9a));
    const mo = motherApparition(root, 0x2f8a4a, 0xd8f0b0, 0, ground(0, -36), -36);
    const tl = timeline();
    let got = 0;
    return {
      enter: { x: pathX(34), z: 34, rotY: 0 },
      ground,
      bounds: { x0: -40, x1: 40, z0: -40, z1: 40 },
      walkable: (x, z) => Math.abs(x - pathX(z)) < 9 || Math.hypot(x, z + 34) < 10,
      env: { bg: 0x10241a, fog: 0x2f4f3a, density: 0.035, sun: 0.55, sunColor: 0xc9e6a0, hemi: 0.7, ambient: 0.3 },
      update: (t, _dt, pl, api) => {
        anims.forEach((a) => a(t));
        // the girl stays a little ahead of you, toward the next gift
        const next = items.find((i) => !i.taken);
        const gz = next ? Math.max(next.z, pl.z - 7) : -30;
        const gx = pathX(gz) - 1;
        girl.position.x += (gx - girl.position.x) * 0.03;
        girl.position.z += (gz - girl.position.z) * 0.03;
        girl.position.y = ground(girl.position.x, girl.position.z) + Math.abs(Math.sin(t * 5)) * 0.08;
        face(girl, pl);
        eyes.visible = !tiger.visible && Math.sin(t * 0.7) > -0.2;
        eyes.position.set(pathX(pl.z - 10) + 12, ground(pathX(pl.z - 10) + 12, pl.z - 10) + 1.2, pl.z - 10);
        tl('in', t > 0.5, () => api.caption('Inside the grotto the rock opens onto a forest at dusk. Fireflies drift between the trees.', 5));
        tl('girl', t > 6, () => api.caption('A little girl in green waves at you, then skips ahead along the path. Follow her.', 5));
        tl('eyes', t > 16, () => {
          soundService.playRumble(2);
          api.caption('Two yellow eyes watch you from the dark between the trees.', 5);
        });
        got = collect(items, pl, t, (i, n) => api.caption(`${giftSpots[i][2]} (${n} of 3).`, 5), 2.2);
        tl('mother', got === 3, () => {
          mo.show();
          tiger.visible = true;
          api.caption('In the clearing by the waterfall: Mẫu Thượng Ngàn, and beside her, the tiger. He was guarding you all along.', 6);
        });
        if (mo.fig.visible) face(mo.fig, pl);
        tl('scarf', got === 3 && dist(pl, 0, -36) < 3.4, () => {
          scarfCaption(api, 'green', 'Mountain and Forest Palace');
          api.end(0x0f2414, 2.4);
        });
        tl('timeout', t > 240, () => api.end(0x0f2414, 2));
      },
    };
  },
});

/* ================================================================== */
/* 3. Thiên phủ: the Heaven Palace (red)                              */
/* ================================================================== */
export const thienPhu = (p: Place): EncounterDef => ({
  id: 'realm-thien',
  title: 'Thiên phủ',
  zone: p.zone,
  exit: p.exit,
  diveColor: 0xfff1d6,
  card: {
    title: 'Thiên phủ: the Heaven Palace',
    jp: 'Mẫu Liễu Hạnh · 天府',
    body: [
      'The Heaven Palace is ruled by the Mother of the Upper Heavens, who wears red. She is often identified with Thánh Mẫu Liễu Hạnh, the most beloved goddess of Vietnamese folk belief.',
      'Legend says Liễu Hạnh was a daughter of the Jade Emperor. At a heavenly banquet she broke a precious jade cup, and was sent down to live among people. She chose to come back to earth again and again.',
      'She is one of the Four Immortals (Tứ bất tử) of Vietnam, and her great temples include Phủ Dầy in Nam Định and Phủ Tây Hồ in Hà Nội.',
    ],
    ending: 'The bell is still humming when you open your eyes in the tower. A red scarf is folded over your arm.',
  },
  build: (k: EncounterKit): EncounterRuntime => {
    const { root, vk } = k;
    // cloud islands joined by cloud paths
    const isl: [number, number, number][] = [[0, 24, 7], [-14, 8, 6], [14, 4, 6], [0, -6, 6], [0, -24, 10]];
    const onIsland = (x: number, z: number) => isl.some(([ix, iz, r]) => Math.hypot(x - ix, z - iz) < r);
    const bridges: [number, number, number, number][] = [[0, 24, -14, 8], [0, 24, 14, 4], [-14, 8, 0, -6], [14, 4, 0, -6], [0, -6, 0, -24]];
    const onBridge = (x: number, z: number) =>
      bridges.some(([x0, z0, x1, z1]) => {
        const dx = x1 - x0, dz = z1 - z0;
        const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz)));
        return Math.hypot(x - (x0 + dx * t), z - (z0 + dz * t)) < 1.8;
      });
    const ground = () => 0;
    const cloudM = new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 1, emissive: 0x3a2a1a, emissiveIntensity: 0.15 });
    const puff = (x: number, z: number, r: number) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudM);
      m.scale.y = 0.4;
      m.position.set(x, -r * 0.3, z);
      root.add(m);
    };
    isl.forEach(([x, z, r]) => {
      puff(x, z, r);
      for (let i = 0; i < 6; i++) puff(x + Math.cos(i) * r * 0.8, z + Math.sin(i) * r * 0.8, r * 0.45);
    });
    bridges.forEach(([x0, z0, x1, z1]) => {
      const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.6);
      for (let i = 0; i <= n; i++) puff(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, 1.6);
    });
    // a sea of cloud far below
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0xf3c9a0 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -40;
    root.add(sea);
    // the red and gold palace of heaven
    const pal = vk.mainHall({ w: 14, d: 9, name: '天府' });
    pal.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh && m.material === vk.v.ochre) m.material = vk.v.lacquer;
    });
    place(root, pal, 0, -1, -28);
    const pglow = new THREE.PointLight(0xffc77a, 30, 40, 1.4);
    pglow.position.set(0, 6, -20);
    root.add(pglow);
    // cranes circling
    const cranes: THREE.Group[] = [];
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group();
      const w = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide });
      c.add(scl(new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), w), 0.6, 0.6, 1.6));
      [-1, 1].forEach((s) => {
        const wing = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), w);
        wing.position.x = s * 1.1;
        wing.rotation.x = -Math.PI / 2;
        wing.name = 'wing' + s;
        c.add(wing);
      });
      c.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: 0xd0201a })), 0, 0.25, 0.7));
      root.add(c);
      cranes.push(c);
    }
    // three shards of the jade cup
    const jade = new THREE.MeshStandardMaterial({ color: 0x7fd6a8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x1f5a3a });
    const shard = (a: number) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.6, 12, 1, true, a, 2.1), jade);
      (m.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      return m;
    };
    const items = [[-14, 8], [14, 4], [0, -6]].map(([x, z], i) => glowItem(root, shard(i * 2.1), x, 1.4, z, 0x9cffcc));
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.6, 16, 1, true), jade);
    cup.position.set(1.6, 1.4, -19.6);
    cup.visible = false;
    root.add(cup);
    const mo = motherApparition(root, 0xc0262d, 0xf2c14e, 0, 0, -21.5);
    const tl = timeline();
    let got = 0;
    return {
      enter: { x: 0, z: 26, rotY: 0 },
      ground,
      bounds: { x0: -24, x1: 24, z0: -34, z1: 32 },
      walkable: (x, z) => onIsland(x, z) || onBridge(x, z),
      env: { bg: 0xf6c99a, fog: 0xfbe2c2, density: 0.012, sun: 2.2, sunColor: 0xffe2b0, hemi: 0.9, ambient: 0.45 },
      update: (t, _dt, pl, api) => {
        cranes.forEach((c, i) => {
          const a = t * 0.25 + (i / 6) * Math.PI * 2;
          c.position.set(Math.cos(a) * (18 + i), 6 + Math.sin(t + i) * 1.5, Math.sin(a) * (18 + i) - 4);
          c.rotation.y = -a;
          c.children.forEach((w) => {
            if (w.name.startsWith('wing')) w.rotation.z = (w.name.endsWith('-1') ? 1 : -1) * Math.sin(t * 4 + i) * 0.5;
          });
        });
        tl('in', t > 0.5, () => api.caption('The bell\'s voice lifts you up and up, through the evening sky, above the clouds.', 5));
        tl('cup', t > 6, () => api.caption('A red and gold palace floats ahead. Pieces of something green glitter on the clouds.', 5));
        got = collect(items, pl, t, (_i, n) => {
          if (n === 1) {
            soundService.playThunder();
            api.shake(0.25, 1.0);
            api.caption('A shard of jade. Thunder rolls somewhere below the clouds (1 of 3).', 5);
          } else api.caption(n < 3 ? `Another shard of the jade cup (${n} of 3).` : 'The last shard. They pull toward the palace, as if they want to be whole.', 5);
        });
        if (got === 3) {
          cup.visible = true;
          cup.rotation.y = t;
        }
        tl('mother', got === 3, () => {
          mo.show();
          api.flash(0xffe2b0, 0.7, 1.2);
          api.caption('A lady in red takes the mended cup. "I broke it, long ago, and was sent down to live among you. I have never regretted it."', 7);
        });
        if (mo.fig.visible) face(mo.fig, pl);
        tl('scarf', got === 3 && dist(pl, 0, -21.5) < 3.4, () => {
          scarfCaption(api, 'red', 'Heaven Palace');
          api.end(0xfff1d6, 2.4);
        });
        tl('timeout', t > 240, () => api.end(0xfff1d6, 2));
      },
    };
  },
});

/* ================================================================== */
/* 4. Địa phủ: the Earth Palace (yellow)                               */
/* ================================================================== */
export const diaPhu = (p: Place): EncounterDef => ({
  id: 'realm-dia',
  title: 'Địa phủ',
  zone: p.zone,
  exit: p.exit,
  diveColor: 0x2a1c08,
  card: {
    title: 'Địa phủ: the Earth Palace',
    jp: 'Mẫu Địa · 地府',
    body: [
      'The Earth Palace belongs to Mẫu Địa, the Earth Mother, who wears yellow. She rules the land itself: soil and harvest, the fertility of fields and families.',
      'In the Mother Goddess religion the Earth Palace is not the underworld of Buddhist tales, but the living earth everyone stands on. She is the least often shown in statues of the four Mothers.',
      'Rice, land and the ancestors buried in it are bound together in Vietnamese life. Every family altar remembers the people who worked this earth before.',
    ],
    ending: 'You climb out from between the banyan\'s roots with golden dust on your hands, and a yellow scarf.',
  },
  build: (k: EncounterKit): EncounterRuntime => {
    const { root, vk } = k;
    // rice terraces stepping down from the centre
    const ground = (x: number, z: number) => {
      const r = Math.hypot(x, z);
      return -Math.floor(Math.max(0, r - 6) / 6) * 0.9 + Math.sin(x * 0.1) * 0.15;
    };
    floor(root, ground, 140, 0x6b5a24, 90);
    // golden rice on each terrace
    const rice = new THREE.InstancedMesh(new THREE.ConeGeometry(0.16, 0.5, 5), new THREE.MeshStandardMaterial({ color: 0xe0b23a, roughness: 0.8, emissive: 0x2a1c00 }), 2400);
    const M4 = new THREE.Matrix4();
    let n = 0;
    for (let i = 0; n < 2400 && i < 6000; i++) {
      const a = i * 2.399, r = 7 + (i % 60) * 0.55;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < 2.2) continue; // the path
      M4.makeTranslation(x, ground(x, z) + 0.25, z);
      rice.setMatrixAt(n++, M4);
    }
    rice.count = n;
    root.add(rice);
    const anims: ((t: number) => void)[] = [];
    // an amber moon
    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf2b84a }));
    moon.position.set(-30, 26, -70);
    root.add(moon);
    // banyan and a village gate at the centre
    place(root, vk.banyan(0.9), -7, ground(-7, -2), -2);
    // three unlit lanterns for the ancestors
    const lanterns: { l: THREE.Group; x: number; z: number; lit: boolean; light: THREE.PointLight }[] = [];
    [[-14, -14], [16, -10], [0, -30]].forEach(([x, z]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3, 6), vk.v.wood);
      place(root, pole, x, ground(x, z) + 1.5, z);
      const l = vk.lantern(0.45, 0x7a6a50);
      place(root, l, x, ground(x, z) + 3.2, z);
      (l.userData.glowMat as THREE.MeshStandardMaterial).emissiveIntensity = 0.05;
      const light = new THREE.PointLight(0xffb45a, 0, 14, 1.6);
      light.position.set(x, ground(x, z) + 3, z);
      root.add(light);
      lanterns.push({ l, x, z, lit: false, light });
    });
    // wandering souls, pale and quiet, keeping their distance
    const souls = Array.from({ length: 6 }, (_, i) => {
      const s = robedFigure({ robe: 0xdfe6e8, under: 0xc9d2d6, longHair: i % 2 === 0, ghost: true, h: 1.6 });
      root.add(s);
      return { s, a: (i / 6) * Math.PI * 2 };
    });
    const orbs = place(root, spiritOrbs(40, 0xffd27a, 18, 10), 0, 0, -10);
    orbs.visible = false;
    anims.push(orbs.userData.animate!);
    const mo = motherApparition(root, 0xd9a21a, 0xf3e2b0, 0, ground(0, -36), -36);
    const tl = timeline();
    let lit = 0;
    return {
      enter: { x: 0, z: 30, rotY: 0 },
      ground,
      bounds: { x0: -34, x1: 34, z0: -42, z1: 36 },
      env: { bg: 0x1a1408, fog: 0x3a2a12, density: 0.03, sun: 0.7, sunColor: 0xf2b84a, hemi: 0.45, ambient: 0.22 },
      update: (t, _dt, pl, api) => {
        anims.forEach((a) => a(t));
        tl('in', t > 0.5, () => api.caption('Under the banyan\'s roots the earth opens onto golden rice fields beneath an amber moon.', 5));
        tl('lanterns', t > 6, () => api.caption('Three paper lanterns stand dark in the fields. Someone should light them for those who came before.', 6));
        souls.forEach(({ s, a }, i) => {
          if (lit === 3) {
            s.visible = false;
            return;
          }
          const ang = a + t * 0.05;
          const r = 9 + Math.sin(t * 0.3 + i) * 2;
          s.position.set(pl.x + Math.cos(ang) * r, ground(pl.x + Math.cos(ang) * r, pl.z + Math.sin(ang) * r), pl.z + Math.sin(ang) * r);
          face(s, pl);
        });
        tl('souls', t > 14, () => {
          soundService.playRumble(2);
          api.caption('Pale figures stand among the rice, at the edge of your sight. They do not come closer. They are waiting.', 6);
        });
        lanterns.forEach((L) => {
          if (L.lit || dist(pl, L.x, L.z) > 2.6) return;
          L.lit = true;
          lit++;
          L.light.intensity = 16;
          const mat = L.l.userData.glowMat as THREE.MeshStandardMaterial;
          mat.color.set(0xd8341e);
          mat.emissive.set(0xd8341e);
          mat.emissiveIntensity = 1.6;
          soundService.playBellChime();
          api.caption(lit < 3 ? `The lantern catches and glows warm (${lit} of 3). One of the pale figures bows.` : 'The third lantern. The pale figures lift their hands, and rise into the night as golden lights.', 6);
        });
        tl('free', lit === 3, () => {
          orbs.visible = true;
          setTimeout(() => {
            mo.show();
            api.caption('In the middle of the field, a lady in yellow is waiting: Mẫu Địa, the Earth Mother.', 5);
          }, 3500);
        });
        if (mo.fig.visible) face(mo.fig, pl);
        tl('scarf', mo.fig.visible && dist(pl, 0, -36) < 3.4, () => {
          scarfCaption(api, 'yellow', 'Earth Palace');
          api.end(0x2a1c08, 2.4);
        });
        tl('timeout', t > 240, () => api.end(0x2a1c08, 2));
      },
    };
  },
});

/* ================================================================== */
/* 5. Hầu đồng: the ceremony                                           */
/* ================================================================== */
export const hauDong = (p: Place): EncounterDef => ({
  id: 'haudong',
  title: 'Hầu đồng',
  zone: p.zone,
  exit: p.exit,
  diveColor: 0x120806,
  card: {
    title: 'Hầu đồng: the ceremony',
    jp: 'Hầu đồng · Lên đồng',
    body: [
      'In hầu đồng, a medium (thanh đồng) becomes the vessel for the spirits of the Four Palaces, one after another. Each spirit (giá đồng) arrives under a red veil, and the medium is dressed in its colours and dances its story.',
      'The cung văn musicians sing chầu văn, with the moon lute (đàn nguyệt), clappers and drums, telling each spirit\'s deeds and welcoming it. At the end the medium shares lộc, blessed gifts, with everyone present.',
      'For decades it was discouraged as superstition. In 2016 UNESCO inscribed the "Practices related to the Viet beliefs in the Mother Goddesses of Three Realms" on its list of the Intangible Cultural Heritage of Humanity.',
    ],
    ending: 'The music fades. In your hand: a red envelope of lộc, still warm.',
  },
  build: (k: EncounterKit): EncounterRuntime => {
    const { root, vk } = k;
    const ground = () => 0;
    // the hall at night
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), vk.v.brick);
    fl.rotation.x = -Math.PI / 2;
    root.add(fl);
    const back = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 0.4), vk.v.ochre);
    back.position.set(0, 4.5, -10);
    root.add(back);
    [-13, 13].forEach((x) => root.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 9, 20), vk.v.ochre), x, 4.5, 0)));
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(26, 0.3, 20), new THREE.MeshStandardMaterial({ color: 0x2a1610 }));
    ceil.position.y = 9;
    root.add(ceil);
    const alt = vk.altar();
    place(root, alt, 0, 0, -7.6);
    for (let i = 0; i < 6; i++) {
      const l = vk.lantern(0.45);
      place(root, l, -10 + i * 4, 7.4, -2 + (i % 2) * 4);
      (l.userData.glowMat as THREE.MeshStandardMaterial).emissiveIntensity = 1.6;
    }
    const warm = new THREE.PointLight(0xffa04a, 30, 30, 1.4);
    warm.position.set(0, 6, 0);
    root.add(warm);
    // a red mat where the medium sits
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), new THREE.MeshStandardMaterial({ color: 0xa8231e }));
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(0, 0.02, -2.8);
    root.add(mat);
    // devotees seated along both sides, and the musicians
    const robes = [0x6d2a6a, 0x2c5fa8, 0x8e1b1b, 0x3f6b35, 0xd9a21a, 0xf4f1ea];
    for (let side = -1; side <= 1; side += 2)
      for (let i = 0; i < 6; i++) {
        const f = vk.figure(robes[(i + (side > 0 ? 2 : 0)) % robes.length], 0x1a1a1a, 0.9);
        place(root, f, side * (6.5 + (i % 2) * 1.4), 0, 4 - Math.floor(i / 2) * 2.4 + (i % 2) * 0.6, side * -Math.PI / 2);
      }
    const lute = () => {
      const g = new THREE.Group();
      g.add(rot(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 18), vk.v.wood), Math.PI / 2, 0, 0));
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.05), vk.v.wood);
      neck.position.y = 0.7;
      g.add(neck);
      return g;
    };
    for (let i = 0; i < 3; i++) {
      const m = vk.figure(0x2a2a3a, 0x1a1a1a, 0.95);
      place(root, m, -9.6, 0, -4 + i * 1.6, Math.PI / 2);
      if (i === 1) place(root, lute(), -9.0, 0.6, -2.4, Math.PI / 2);
    }
    // the medium: rebuilt in each palace's colours
    const COSTUMES = [
      { robe: 0xc0262d, under: 0xf2c14e, line: 'The first spirit arrives from the Heaven Palace, in red.' },
      { robe: 0x2f8a4a, under: 0xe8d28a, line: 'Now a lady of the Mountains and Forests, in green, dancing with a fan.' },
      { robe: 0xf4f1ea, under: 0xc9d8e6, line: 'A princess of the Water Palace, in white, rowing an invisible boat.' },
      { robe: 0xd9a21a, under: 0xf6e2a8, line: 'And from the Earth Palace, in yellow, scattering blessings like seed.' },
    ];
    let medium: THREE.Group = robedFigure({ robe: 0xa8231e, under: 0xa8231e, h: 1.75 });
    place(root, medium, 0, 0, -2.8, 0);
    const veil = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xc0262d, side: THREE.DoubleSide, roughness: 0.7 }));
    veil.position.set(0, 1.3, -2.8);
    root.add(veil);
    const dress = (i: number) => {
      root.remove(medium);
      const c = COSTUMES[i];
      medium = robedFigure({ robe: c.robe, under: c.under, hat: 'crown', h: 1.8 });
      medium.position.set(0, 0, -2.8);
      root.add(medium);
    };
    // lộc: sweets and red envelopes thrown to the crowd
    const N = 140;
    const locPos = new Float32Array(N * 3);
    const locVel = new Float32Array(N * 3);
    const locG = new THREE.BufferGeometry();
    locG.setAttribute('position', new THREE.BufferAttribute(locPos, 3));
    const loc = new THREE.Points(locG, new THREE.PointsMaterial({ color: 0xff4a3a, size: 0.22 }));
    loc.visible = false;
    root.add(loc);
    const throwLoc = () => {
      for (let i = 0; i < N; i++) {
        locPos.set([0, 1.6, -2.8], i * 3);
        const a = Math.random() * Math.PI * 2;
        const s = 2 + Math.random() * 5;
        locVel.set([Math.cos(a) * s, 4 + Math.random() * 4, Math.abs(Math.sin(a)) * s], i * 3);
      }
      loc.visible = true;
    };
    const tl = timeline();
    let stage = -1;
    return {
      enter: { x: 0, z: 7, rotY: 0 },
      ground,
      bounds: { x0: -5, x1: 5, z0: 1, z1: 8 },
      env: { bg: 0x120806, fog: 0x2a1208, density: 0.02, sun: 0.2, sunColor: 0xffb070, hemi: 0.35, ambient: 0.35 },
      update: (t, dt, pl, api) => {
        tl('in', t > 0.5, () => {
          soundService.startChauVan();
          api.caption('Night. The hall is full. The cung văn begin: the moon lute, the clappers, a voice rising.', 6);
        });
        tl('veil', t > 6, () => api.caption('The medium sits beneath a red veil, waiting for a spirit to descend.', 5));
        const s = t < 11 ? -1 : t < 18 ? 0 : t < 25 ? 1 : t < 32 ? 2 : 3;
        if (s !== stage && s >= 0) {
          stage = s;
          veil.visible = false;
          dress(s);
          api.flash(Number(COSTUMES[s].robe), 0.5, 0.8);
          api.caption(COSTUMES[s].line, 6);
        }
        if (stage >= 0) {
          // dance: turning, swaying, arms lifting
          medium.rotation.y = Math.sin(t * 1.4) * 1.2 + (stage === 2 ? Math.sin(t * 2.4) * 0.2 : 0);
          medium.position.x = Math.sin(t * 0.7) * 0.8;
          medium.position.y = Math.abs(Math.sin(t * 2.8)) * 0.08;
          medium.rotation.z = Math.sin(t * 2) * 0.08;
        } else {
          veil.rotation.y = t * 0.2;
        }
        tl('loc', t > 37, () => {
          throwLoc();
          soundService.playBellChime();
          api.caption('The medium tosses lộc to everyone: sweets, fruit, little red envelopes. One lands right in your hands.', 6);
        });
        if (loc.visible) {
          for (let i = 0; i < N; i++) {
            locVel[i * 3 + 1] -= 9.8 * dt;
            for (let k = 0; k < 3; k++) locPos[i * 3 + k] += locVel[i * 3 + k] * dt;
            if (locPos[i * 3 + 1] < 0.05) {
              locPos[i * 3 + 1] = 0.05;
              locVel.set([0, 0, 0], i * 3);
            }
          }
          locG.attributes.position.needsUpdate = true;
        }
        void pl;
        tl('end', t > 44, () => {
          soundService.stopChauVan();
          api.end(0x120806, 2.6);
        });
      },
    };
  },
});
