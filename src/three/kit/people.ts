import * as THREE from 'three';

/**
 * The people of the temple: visitors, the keeper, the boatwoman, the cung văn band, the medium.
 *
 * One articulated figure with real proportions (about 7½ heads tall): legs in quần, a fitted
 * bodice, áo dài / áo the / áo nâu panels split at the hips, sleeved arms with hands, a neck, and a
 * painted face. Hair and headwear in the northern way: búi tóc, khăn vấn, khăn xếp, nón lá.
 *
 * Joint convention (so dances and prayers can move them): each arm is a pivot at the shoulder
 * with the arm hanging along -y and the hand ~0.62·k below; rotation.x < 0 swings it forward,
 * rotation.z > 0 swings the LEFT arm (−x) in toward the body. Legs pivot at the hip, knees bend
 * with rotation.x > 0. The figure faces +z, origin at the feet.
 */
export type Outfit = 'aodai' | 'aothe' | 'aonau' | 'robe';
export type Hair = 'bun' | 'long' | 'short' | 'khanvan' | 'khanxep' | 'none';
export interface PersonOpts {
  h?: number;
  sex?: 'f' | 'm';
  elder?: boolean;
  outfit?: Outfit;
  robe: number;
  under?: number;
  trousers?: number;
  hair?: Hair;
  hairColor?: number;
  turban?: number;
  hat?: 'non' | 'crown' | 'none';
  skin?: number;
  pose?: 'stand' | 'kneel';
  ghost?: boolean;
  /** wide ritual sleeves */
  wideSleeves?: boolean;
}
export interface Joints {
  hip: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  arms: { sh: THREE.Group; el: THREE.Group; hand: THREE.Object3D }[];
  legs: { hip: THREE.Group; knee: THREE.Group }[];
  panels: THREE.Mesh[];
  mats: { robe: THREE.MeshStandardMaterial; under: THREE.MeshStandardMaterial; trousers: THREE.MeshStandardMaterial };
  k: number;
  pose: 'stand' | 'kneel';
}
export type Person = THREE.Group & { userData: { j: Joints; head: THREE.Object3D } };

/* ---------------- faces ---------------- */
const faces = new Map<string, THREE.CanvasTexture>();
function faceTex(sex: 'f' | 'm', elder: boolean, skin: number) {
  const key = `${sex}${elder ? 'e' : ''}${skin}`;
  const hit = faces.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  const base = new THREE.Color(skin);
  // canvas colours are sRGB, THREE.Color works in linear: convert back before painting
  const css = (col: THREE.Color, a = 1) => {
    const t = { r: 0, g: 0, b: 0 };
    col.getRGB(t, THREE.SRGBColorSpace);
    return `rgba(${(t.r * 255) | 0},${(t.g * 255) | 0},${(t.b * 255) | 0},${a})`;
  };
  g.fillStyle = css(base);
  g.fillRect(0, 0, 512, 256);
  const cx = 128;
  // a little warmth in the middle of the face, shade toward the sides
  const sh = g.createRadialGradient(cx, 132, 20, cx, 132, 120);
  sh.addColorStop(0, css(base.clone().offsetHSL(0, 0, 0.04)));
  sh.addColorStop(1, css(base.clone().offsetHSL(0, 0, -0.015)));
  g.fillStyle = sh;
  g.fillRect(0, 0, 256, 256);
  const browCol = elder ? '#7d7066' : '#2a1c14';
  // brows
  g.strokeStyle = browCol;
  g.lineCap = 'round';
  g.lineWidth = sex === 'm' ? 4.2 : 2.6;
  [-1, 1].forEach((s) => {
    g.beginPath();
    g.moveTo(cx + s * 8, 104);
    g.quadraticCurveTo(cx + s * 22, sex === 'm' ? 98 : 95, cx + s * 37, 102);
    g.stroke();
  });
  // eyes: almond, dark, a lid line over each
  [-1, 1].forEach((s) => {
    const ex = cx + s * 22;
    g.fillStyle = '#f4ece2';
    g.beginPath();
    g.ellipse(ex, 119, 10, 4.2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1d140f';
    g.beginPath();
    g.arc(ex + s * 0.5, 119, 4.1, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)';
    g.beginPath();
    g.arc(ex + 1.5, 117.5, 1.1, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#1d140f';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(ex - 11, 119);
    g.quadraticCurveTo(ex, 111, ex + 11, 118);
    g.stroke();
    if (elder) {
      g.strokeStyle = 'rgba(120,80,55,.45)';
      g.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(cx + s * (34 + i * 2), 116 + i * 4);
        g.lineTo(cx + s * (42 + i * 2), 114 + i * 5);
        g.stroke();
      }
    }
  });
  // nose
  g.strokeStyle = css(base.clone().offsetHSL(0, 0.05, -0.2), 0.7);
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(cx - 6, 140);
  g.quadraticCurveTo(cx, 145, cx + 6, 140);
  g.stroke();
  // mouth
  g.fillStyle = sex === 'f' && !elder ? '#b5404a' : '#a0625a';
  g.beginPath();
  g.moveTo(cx - 10, 158);
  g.quadraticCurveTo(cx, 153, cx + 10, 158);
  g.quadraticCurveTo(cx, 164, cx - 10, 158);
  g.fill();
  if (elder) {
    // smile lines; and for an old man a wisp of white beard
    g.strokeStyle = 'rgba(120,80,55,.4)';
    g.lineWidth = 1.2;
    [-1, 1].forEach((s) => {
      g.beginPath();
      g.moveTo(cx + s * 14, 142);
      g.quadraticCurveTo(cx + s * 19, 152, cx + s * 15, 162);
      g.stroke();
    });
    if (sex === 'm') {
      g.fillStyle = '#e8e2d8';
      g.beginPath();
      g.moveTo(cx - 9, 170);
      g.quadraticCurveTo(cx, 214, cx + 9, 170);
      g.fill();
    }
  }
  // cheeks
  if (sex === 'f') {
    [-1, 1].forEach((s) => {
      const r = g.createRadialGradient(cx + s * 30, 144, 0, cx + s * 30, 144, 16);
      r.addColorStop(0, 'rgba(225,130,120,.28)');
      r.addColorStop(1, 'rgba(225,130,120,0)');
      g.fillStyle = r;
      g.fillRect(cx + s * 30 - 16, 128, 32, 32);
    });
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  faces.set(key, t);
  return t;
}

/* ---------------- fabric ---------------- */
const fabrics = new Map<string, THREE.CanvasTexture>();
/** a faint woven/printed texture so the silk isn't flat plastic */
function fabricTex(kind: 'silk' | 'cotton') {
  const hit = fabrics.get(kind);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  if (kind === 'cotton') {
    for (let i = 0; i < 128; i += 2) {
      g.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.03})`;
      g.fillRect(0, i, 128, 1);
      g.fillRect(i, 0, 1, 128);
    }
  } else {
    // small scattered flowers, like a printed áo dài silk
    g.globalAlpha = 0.13;
    for (let i = 0; i < 9; i++) {
      const x = (i * 47) % 128, y = (i * 83) % 128;
      g.fillStyle = '#000';
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        g.beginPath();
        g.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3, 1.6, a, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  fabrics.set(kind, t);
  return t;
}

const SKINS = [0xeac7a4, 0xe2b892, 0xd9ab84, 0xf0d0b0];

export function person(o: PersonOpts): Person {
  const sex = o.sex ?? 'f';
  const outfit = o.outfit ?? (sex === 'f' ? 'aodai' : 'aothe');
  const k = (o.h ?? (sex === 'f' ? 1.56 : 1.66)) / 1.6;
  const pose = o.pose ?? 'stand';
  const ghost = o.ghost ? { transparent: true, opacity: 0.5, depthWrite: false, emissive: new THREE.Color(0x6f8a96), emissiveIntensity: 0.5 } : {};
  const skinHex = o.skin ?? SKINS[Math.floor(Math.random() * SKINS.length)];
  const silk = outfit === 'aodai' || outfit === 'robe';
  const robe = new THREE.MeshStandardMaterial({ color: o.robe, roughness: silk ? 0.55 : 0.85, map: fabricTex(silk ? 'silk' : 'cotton'), side: THREE.DoubleSide, ...ghost });
  const under = new THREE.MeshStandardMaterial({ color: o.under ?? o.robe, roughness: 0.7, side: THREE.DoubleSide, ...ghost });
  const trousers = new THREE.MeshStandardMaterial({ color: o.trousers ?? (outfit === 'aonau' ? 0x221c18 : outfit === 'aothe' ? 0xf1ece0 : 0xf4efe6), roughness: 0.8, ...ghost });
  const skin = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.6, ...ghost });
  const hairMat = new THREE.MeshStandardMaterial({ color: o.hairColor ?? (o.elder ? 0x8c867e : 0x15100d), roughness: 0.5, ...ghost });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.8, ...ghost });

  const root = new THREE.Group() as Person;
  const M = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = root) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    // only the big shapes cast shadows: hands, ears and pins aren't worth the draw calls
    geo.computeBoundingSphere();
    m.castShadow = geo.boundingSphere!.radius > 0.08 * k;
    parent.add(m);
    return m;
  };
  /** a tapering tube from 0 down to -len */
  const limb = (r0: number, r1: number, len: number, mat: THREE.Material, parent: THREE.Object3D) => M(new THREE.CylinderGeometry(r0 * k, r1 * k, len * k, 12), mat, 0, (-len / 2) * k, 0, parent);

  const legLen = 0.76;
  const hip = new THREE.Group();
  hip.position.y = (pose === 'kneel' ? 0.25 : legLen) * k;
  root.add(hip);

  /* legs */
  const wide = sex === 'f' || outfit === 'aonau';
  const legs = [-1, 1].map((s) => {
    const lh = new THREE.Group();
    lh.position.x = s * 0.075 * k;
    hip.add(lh);
    limb(0.066, wide ? 0.058 : 0.052, 0.39, trousers, lh);
    const kn = new THREE.Group();
    kn.position.y = -0.39 * k;
    lh.add(kn);
    limb(wide ? 0.058 : 0.05, wide ? 0.062 : 0.045, 0.34, trousers, kn);
    const ft = M(new THREE.BoxGeometry(0.07 * k, 0.035 * k, 0.17 * k), shoe, 0, -0.355 * k, 0.04 * k, kn);
    ft.geometry.translate(0, 0, 0);
    if (pose === 'kneel') {
      lh.rotation.x = -1.48;
      kn.rotation.x = 2.95;
      ft.rotation.x = -0.4;
    }
    return { hip: lh, knee: kn };
  });

  /* torso: a fitted bodice turned on a lathe */
  const torso = new THREE.Group();
  hip.add(torso);
  const f = sex === 'f';
  const body = new THREE.LatheGeometry(
    [
      [0.0, -0.02],
      [f ? 0.15 : 0.14, -0.02],
      [f ? 0.145 : 0.135, 0.06],
      [f ? 0.108 : 0.125, 0.16],
      [f ? 0.125 : 0.135, 0.28],
      [f ? 0.132 : 0.15, 0.36],
      [f ? 0.125 : 0.148, 0.45],
      [0.1, 0.52],
      [0.055, 0.56],
      [0.0, 0.565],
    ].map(([r, y]) => new THREE.Vector2(r * k, y * k)),
    20,
  );
  const bodice = M(body, robe, 0, 0, 0, torso);
  bodice.scale.z = 0.78;
  // the high mandarin collar (cổ áo)
  M(new THREE.CylinderGeometry(0.052 * k, 0.058 * k, 0.06 * k, 16, 1, true), robe, 0, 0.585 * k, 0, torso);
  if (outfit === 'aonau' || outfit === 'robe') {
    // a sash at the waist (thắt lưng)
    const sash = M(new THREE.TorusGeometry(0.122 * k, 0.02 * k, 6, 20), under, 0, 0.12 * k, 0, torso);
    sash.rotation.x = Math.PI / 2;
    sash.scale.y = 0.78;
    const tail = M(new THREE.BoxGeometry(0.05 * k, 0.32 * k, 0.012 * k), under, 0.05 * k, -0.04 * k, 0.11 * k, torso);
    tail.rotation.z = 0.08;
  }

  /* the panels (tà áo): front and back, split at the hips */
  const panelLen = { aodai: 0.66, aothe: 0.56, aonau: 0.3, robe: pose === 'kneel' ? 0.34 : 0.74 }[outfit];
  const arc = { aodai: 1.55, aothe: 1.9, aonau: 2.4, robe: 2.95 }[outfit];
  const flare = { aodai: 0.17, aothe: 0.2, aonau: 0.17, robe: 0.3 }[outfit];
  const panels = [0, Math.PI].map((rot) => {
    const geo = new THREE.CylinderGeometry(0.135 * k, flare * k, panelLen * k, 18, 4, true, -arc / 2, arc);
    geo.translate(0, (-panelLen / 2) * k, 0);
    const p = new THREE.Group();
    p.position.y = 0.1 * k;
    p.rotation.y = rot;
    torso.add(p);
    const m = M(geo, robe, 0, 0, 0, p);
    m.scale.z = 0.85;
    if (pose === 'kneel' && rot === 0) p.rotation.x = -1.25;
    return m;
  });

  /* arms */
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group();
    sh.position.set(s * 0.155 * k, 0.48 * k, 0);
    torso.add(sh);
    M(new THREE.SphereGeometry(0.05 * k, 12, 8), robe, -s * 0.006 * k, -0.01 * k, 0, sh);
    limb(0.052, 0.045, 0.28, robe, sh);
    const el = new THREE.Group();
    el.position.y = -0.28 * k;
    sh.add(el);
    if (o.wideSleeves || outfit === 'robe') {
      const cuff = M(new THREE.CylinderGeometry(0.045 * k, 0.13 * k, 0.27 * k, 14, 1, true), robe, 0, -0.135 * k, 0, el);
      cuff.scale.z = 0.8;
    } else limb(0.045, 0.036, 0.25, robe, el);
    const hand = new THREE.Group();
    hand.position.y = -0.27 * k;
    el.add(hand);
    const palm = M(new THREE.SphereGeometry(0.036 * k, 10, 8), skin, 0, -0.03 * k, 0, hand);
    palm.scale.set(0.75, 1.35, 0.45);
    const th = M(new THREE.CapsuleGeometry(0.009 * k, 0.03 * k, 3, 6), skin, -s * 0.024 * k, -0.02 * k, 0.012 * k, hand);
    th.rotation.z = -s * 0.5;
    sh.rotation.z = s * 0.07;
    return { sh, el, hand };
  });

  /* neck and head */
  M(new THREE.CylinderGeometry(0.038 * k, 0.045 * k, 0.1 * k, 12), skin, 0, 0.6 * k, 0.005 * k, torso);
  const head = new THREE.Group();
  head.position.set(0, 0.645 * k, 0.012 * k);
  torso.add(head);
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex(sex, !!o.elder, skinHex), roughness: 0.6, ...ghost });
  const skull = M(new THREE.SphereGeometry(0.098 * k, 28, 20), faceMat, 0, 0.1 * k, 0, head);
  skull.scale.set(0.92, 1.12, 0.98);
  // ears
  [-1, 1].forEach((s) => {
    const e = M(new THREE.SphereGeometry(0.02 * k, 8, 6), skin, s * 0.088 * k, 0.1 * k, -0.005 * k, head);
    e.scale.set(0.5, 1, 0.8);
  });

  /* hair and headwear */
  const hairStyle: Hair = o.hair ?? (sex === 'f' ? (o.elder ? 'khanvan' : 'bun') : o.elder ? 'khanxep' : 'short');
  if (hairStyle !== 'none') {
    // a cap of hair over the crown and back, parted in the middle
    const cap = M(new THREE.SphereGeometry(0.103 * k, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat, 0, 0.11 * k, -0.012 * k, head);
    cap.scale.set(0.95, 1.12, 1.02);
    cap.rotation.x = -0.6;
  }
  if (hairStyle === 'bun') {
    M(new THREE.SphereGeometry(0.055 * k, 14, 10), hairMat, 0, 0.13 * k, -0.105 * k, head);
    const pin = M(new THREE.CylinderGeometry(0.004 * k, 0.004 * k, 0.16 * k, 4), new THREE.MeshStandardMaterial({ color: 0xd6a12b, metalness: 0.6, roughness: 0.3 }), 0, 0.15 * k, -0.11 * k, head);
    pin.rotation.z = 1.2;
  } else if (hairStyle === 'long') {
    const back = new THREE.CylinderGeometry(0.09 * k, 0.11 * k, 0.5 * k, 16, 1, true, Math.PI - 1.2, 2.4);
    M(back, hairMat, 0, -0.1 * k, -0.01 * k, head);
  } else if (hairStyle === 'khanvan') {
    // khăn vấn: a long black cloth wound round the head like a halo
    const tm = new THREE.MeshStandardMaterial({ color: o.turban ?? 0x1c1612, roughness: 0.75, ...ghost });
    for (let i = 0; i < 3; i++) {
      const t = M(new THREE.TorusGeometry(0.1 * k, 0.026 * k, 8, 26), tm, 0, (0.15 + i * 0.022) * k, -0.008 * k, head);
      t.rotation.x = Math.PI / 2 - 0.18 + i * 0.1;
      t.rotation.y = (i - 1) * 0.12;
    }
  } else if (hairStyle === 'khanxep') {
    // khăn xếp: the men's ready-folded turban, a shallow drum of pleated cloth
    const tm = new THREE.MeshStandardMaterial({ color: o.turban ?? 0x141414, roughness: 0.7, ...ghost });
    const drum = M(new THREE.CylinderGeometry(0.108 * k, 0.11 * k, 0.07 * k, 24), tm, 0, 0.17 * k, -0.008 * k, head);
    drum.rotation.x = -0.12;
    for (let i = 0; i < 3; i++) {
      const pl = M(new THREE.TorusGeometry(0.109 * k, 0.006 * k, 4, 24), tm, 0, (0.145 + i * 0.022) * k, -0.008 * k - i * 0.003 * k, head);
      pl.rotation.x = Math.PI / 2 - 0.12;
    }
  }
  if (o.hat === 'non') {
    // nón lá: a palm-leaf cone with ribs, tied under the chin
    const non = M(new THREE.ConeGeometry(0.27 * k, 0.2 * k, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xe6d6a2, roughness: 0.9, side: THREE.DoubleSide, ...ghost }), 0, 0.27 * k, 0, head);
    non.rotation.x = -0.08;
    const strap = M(new THREE.TorusGeometry(0.1 * k, 0.004 * k, 4, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0xb8382b }), 0, 0.12 * k, 0.01 * k, head);
    strap.rotation.z = Math.PI;
    strap.rotation.y = Math.PI / 2;
  } else if (o.hat === 'crown') {
    const gold = new THREE.MeshStandardMaterial({ color: 0xe2b23a, metalness: 0.7, roughness: 0.3, ...ghost });
    M(new THREE.CylinderGeometry(0.105 * k, 0.1 * k, 0.05 * k, 20, 1, true), gold, 0, 0.2 * k, 0, head);
    for (let i = 0; i < 5; i++) {
      const a = Math.PI / 2 + ((i - 2) / 5) * Math.PI * 1.2;
      const p = M(new THREE.ConeGeometry(0.018 * k, 0.07 * k, 5), gold, Math.cos(a) * 0.1 * k, 0.25 * k, Math.sin(a) * 0.1 * k, head);
      p.rotation.x = Math.sin(a) * 0.2;
    }
    M(new THREE.SphereGeometry(0.014 * k, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc81e1e, emissive: 0x400000 }), 0, 0.22 * k, 0.105 * k, head);
  }

  root.userData.j = { hip, torso, head, arms, legs, panels, mats: { robe, under, trousers }, k, pose };
  root.userData.head = head;
  return root;
}

/* ---------------- poses ---------------- */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** an easy walk: legs and arms swing, the tà áo sway behind */
export function walk(p: Person, phase: number, amt = 1) {
  const j = p.userData.j;
  const s = Math.sin(phase), c = Math.cos(phase);
  j.legs[0].hip.rotation.x = s * 0.42 * amt;
  j.legs[1].hip.rotation.x = -s * 0.42 * amt;
  j.legs[0].knee.rotation.x = Math.max(0, -c) * 0.7 * amt + 0.05;
  j.legs[1].knee.rotation.x = Math.max(0, c) * 0.7 * amt + 0.05;
  j.arms[0].sh.rotation.x = -s * 0.28 * amt;
  j.arms[1].sh.rotation.x = s * 0.28 * amt;
  j.arms.forEach((a, i) => {
    a.el.rotation.x = -0.18 * amt;
    a.el.rotation.z = 0;
    a.sh.rotation.z = (i ? 1 : -1) * 0.07;
  });
  j.panels[0].parent!.rotation.x = -Math.abs(s) * 0.12 * amt;
  j.panels[1].parent!.rotation.x = 0.1 * amt + Math.abs(c) * 0.08 * amt;
  j.torso.rotation.x = 0.03 * amt;
  j.head.rotation.x = 0;
  j.hip.rotation.y = s * 0.05 * amt;
}
/** hands joined before the chest (chắp tay); k blends in, bow tips the body forward */
export function pray(p: Person, k: number, bow = 0) {
  const j = p.userData.j;
  j.arms.forEach((a, i) => {
    const sd = i ? -1 : 1;
    a.sh.rotation.x = lerp(a.sh.rotation.x, -0.55, k);
    a.sh.rotation.z = lerp(a.sh.rotation.z, sd * 0.42, k);
    a.el.rotation.x = lerp(a.el.rotation.x, -1.75, k);
    a.el.rotation.z = lerp(a.el.rotation.z, sd * 0.35, k);
  });
  j.torso.rotation.x = bow * 0.55;
  j.head.rotation.x = bow * 0.25;
}
/** standing still: legs together, arms resting, a slow breath */
export function rest(p: Person, t: number, clasp = false) {
  const j = p.userData.j;
  if (j.pose === 'stand') j.legs.forEach((l) => ((l.hip.rotation.x = 0), (l.knee.rotation.x = 0)));
  j.panels.forEach((m) => (m.parent!.rotation.x = j.pose === 'kneel' && m === j.panels[0] ? -1.25 : 0));
  j.arms.forEach((a, i) => {
    const sd = i ? -1 : 1;
    a.sh.rotation.x = clasp ? -0.25 : 0.02;
    a.sh.rotation.z = clasp ? sd * 0.25 : -sd * 0.07;
    a.el.rotation.x = clasp ? -0.9 : -0.1;
    a.el.rotation.z = clasp ? sd * 0.4 : 0;
  });
  j.torso.rotation.x = Math.sin(t * 1.3) * 0.012;
  j.head.rotation.x = 0;
  j.hip.rotation.y = 0;
}
