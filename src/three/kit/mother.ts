import * as THREE from 'three';

/**
 * A sacred statue of a Mother Goddess, seated on her throne.
 * Silk robes embroidered in gold (cloud scrolls and phoenix feathers), a broad gilded collar,
 * long ribbons, wide sleeves meeting over a jade scepter in her lap, a serene painted face,
 * a phoenix crown with a pearl fringe and beaded tassels, and a flame-edged halo behind her.
 * Faces +z. Height ~1.6 * k when seated (head centre ~1.82 * k), like the old figure it replaces.
 */

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
function shade(c: number, f: number) {
  const r = Math.min(255, Math.max(0, ((c >> 16) & 255) * f)), g = Math.min(255, Math.max(0, ((c >> 8) & 255) * f)), b = Math.min(255, Math.max(0, (c & 255) * f));
  return (r << 16) | (g << 8) | b;
}

/** gold embroidery on silk: cloud scrolls, phoenix feathers, a border band */
function embroidery(base: number, gold = '#e8c25a', seed = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, hex(shade(base, 1.08)));
  grad.addColorStop(1, hex(shade(base, 0.86)));
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  // fine silk weave
  g.globalAlpha = 0.08;
  g.strokeStyle = '#ffffff';
  for (let y = 0; y < 512; y += 3) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(512, y);
    g.stroke();
  }
  g.globalAlpha = 1;
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.strokeStyle = gold;
  g.lineCap = 'round';
  // cloud scrolls (mây cuộn)
  for (let i = 0; i < 9; i++) {
    const x = 40 + r() * 432, y = 40 + r() * 330, R = 16 + r() * 14;
    g.lineWidth = 3;
    g.beginPath();
    for (let a = 0; a < Math.PI * 3.2; a += 0.15) {
      const rr = R * (1 - a / (Math.PI * 3.4));
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.stroke();
    g.beginPath();
    g.moveTo(x + R, y);
    g.bezierCurveTo(x + R * 2, y - R, x + R * 3, y + R, x + R * 4, y);
    g.stroke();
  }
  // phoenix feathers
  for (let i = 0; i < 5; i++) {
    const x = 60 + r() * 400, y = 80 + r() * 280, a = r() * Math.PI * 2;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      g.ellipse(k * 9, 0, 22 - k * 2, 6, 0.3 * (k - 2), 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = gold;
    g.beginPath();
    g.arc(0, 0, 4, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  // a border band near the hem: waves and dots
  g.fillStyle = gold;
  g.fillRect(0, 420, 512, 6);
  g.fillRect(0, 492, 512, 6);
  g.lineWidth = 3;
  g.beginPath();
  for (let x = 0; x <= 512; x += 32) g.arc(x + 16, 470, 14, Math.PI, 0);
  g.stroke();
  for (let x = 8; x < 512; x += 16) {
    g.beginPath();
    g.arc(x, 438, 2.5, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** a serene face painted around the front of the head sphere */
function faceTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  const skin = g.createRadialGradient(128, 128, 10, 128, 128, 140);
  skin.addColorStop(0, '#f7e2c6');
  skin.addColorStop(1, '#e9c9a4');
  g.fillStyle = '#ecd0ae';
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = skin;
  g.fillRect(0, 0, 256, 256);
  const cx = 128;
  // brows: long, fine, arched
  g.strokeStyle = '#3a2418';
  g.lineWidth = 2.2;
  [-1, 1].forEach((s) => {
    g.beginPath();
    g.moveTo(cx + s * 6, 104);
    g.quadraticCurveTo(cx + s * 22, 94, cx + s * 40, 102);
    g.stroke();
  });
  // eyes: half-closed, looking down in compassion
  g.lineWidth = 2.6;
  [-1, 1].forEach((s) => {
    g.beginPath();
    g.moveTo(cx + s * 9, 118);
    g.quadraticCurveTo(cx + s * 22, 124, cx + s * 36, 116);
    g.stroke();
    g.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) {
      const x = cx + s * (14 + k * 6);
      g.beginPath();
      g.moveTo(x, 121);
      g.lineTo(x + s * 1.5, 125);
      g.stroke();
    }
    g.lineWidth = 2.6;
  });
  // nose: a soft shadow line
  g.strokeStyle = 'rgba(150,95,60,.55)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(cx - 3, 120);
  g.quadraticCurveTo(cx - 6, 140, cx - 2, 146);
  g.stroke();
  // lips: small, red, a faint smile
  g.fillStyle = '#b5303a';
  g.beginPath();
  g.moveTo(cx - 11, 160);
  g.quadraticCurveTo(cx, 153, cx + 11, 160);
  g.quadraticCurveTo(cx, 168, cx - 11, 160);
  g.fill();
  // cheeks
  const ch = (x: number) => {
    const r = g.createRadialGradient(x, 145, 0, x, 145, 18);
    r.addColorStop(0, 'rgba(232,140,130,.35)');
    r.addColorStop(1, 'rgba(232,140,130,0)');
    g.fillStyle = r;
    g.fillRect(x - 18, 127, 36, 36);
  };
  ch(cx - 30);
  ch(cx + 30);
  // a small jewel-red mark on the brow
  g.fillStyle = '#c0242c';
  g.beginPath();
  g.ellipse(cx, 92, 2.5, 4, 0, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255,240,190,.95)');
  r.addColorStop(0.55, 'rgba(255,200,90,.45)');
  r.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,230,160,.7)';
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30);
    g.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118);
    g.lineWidth = i % 2 ? 1 : 2;
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

const _face = { t: null as THREE.CanvasTexture | null };
const _halo = { t: null as THREE.CanvasTexture | null };

export function sacredMother(robe: number, accent: number, h = 1.5, seed = 1): THREE.Group {
  const k = h / 1.6;
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8a53a, metalness: 0.92, roughness: 0.24, emissive: 0x3a2400, emissiveIntensity: 0.6 });
  const goldDim = new THREE.MeshStandardMaterial({ color: 0xb8862a, metalness: 0.85, roughness: 0.35, emissive: 0x241600 });
  const lacquer = new THREE.MeshStandardMaterial({ color: 0x8e1414, roughness: 0.35, metalness: 0.1 });
  const robeTex = embroidery(robe, '#ecc65c', seed);
  robeTex.repeat.set(2, 1);
  const silk = new THREE.MeshPhysicalMaterial({ map: robeTex, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(shade(robe, 1.5)), sheenRoughness: 0.35 });
  const accentTex = embroidery(accent, '#f6dc8a', seed + 7);
  const silk2 = new THREE.MeshPhysicalMaterial({ map: accentTex, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(shade(accent, 1.4)), sheenRoughness: 0.4, side: THREE.DoubleSide });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1d6b4, roughness: 0.45, emissive: 0x2a1408, emissiveIntensity: 0.25 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.45 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc81e2a, roughness: 0.3, emissive: 0x5a0808, emissiveIntensity: 0.6 });
  const jade = new THREE.MeshStandardMaterial({ color: 0x5fb08a, roughness: 0.2, metalness: 0.1, emissive: 0x0c2a1c });
  const pearl = new THREE.MeshStandardMaterial({ color: 0xfff6e6, roughness: 0.15, metalness: 0.2 });
  const M = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x * k, y * k, z * k);
    o.castShadow = true;
    g.add(o);
    return o;
  };

  /* ---------- the throne (ngai) ---------- */
  M(new THREE.BoxGeometry(1.3 * k, 0.62 * k, 1.0 * k), lacquer, 0, 0.31, -0.08);
  M(new THREE.BoxGeometry(1.36 * k, 0.06 * k, 1.06 * k), gold, 0, 0.64, -0.08);
  const back = new THREE.Shape();
  back.moveTo(-0.66, 0);
  back.lineTo(-0.66, 1.2);
  back.quadraticCurveTo(-0.66, 1.62, -0.3, 1.66);
  back.quadraticCurveTo(0, 1.82, 0.3, 1.66);
  back.quadraticCurveTo(0.66, 1.62, 0.66, 1.2);
  back.lineTo(0.66, 0);
  const bk = new THREE.ExtrudeGeometry(back, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  bk.scale(k, k, k);
  M(bk, lacquer, 0, 0.6, -0.62);
  const rim = new THREE.ExtrudeGeometry(back, { depth: 0.04, bevelEnabled: false });
  rim.scale(k * 1.06, k * 1.04, k);
  M(rim, gold, 0, 0.56, -0.66);
  // dragon-scroll finials and armrests ending in curls
  [-1, 1].forEach((sd) => {
    const curl = M(new THREE.TorusGeometry(0.12 * k, 0.035 * k, 8, 16, Math.PI * 1.5), gold, sd * 0.68, 1.85, -0.58);
    curl.rotation.set(0, sd > 0 ? Math.PI : 0, 0.6 * sd);
    M(new THREE.BoxGeometry(0.1 * k, 0.32 * k, 0.9 * k), lacquer, sd * 0.66, 0.82, -0.08);
    const arm = M(new THREE.TorusGeometry(0.09 * k, 0.03 * k, 8, 14, Math.PI * 1.6), gold, sd * 0.66, 0.98, 0.38);
    arm.rotation.y = Math.PI / 2;
  });
  // a medallion of gold filigree on the throne back
  const med = M(new THREE.TorusGeometry(0.2 * k, 0.018 * k, 8, 40), gold, 0, 1.75, -0.52);
  med.rotation.y = 0;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    M(new THREE.SphereGeometry(0.022 * k, 8, 6), i % 3 ? goldDim : red, Math.cos(a) * 0.26, 1.75 + Math.sin(a) * 0.26, -0.51);
  }

  /* ---------- the halo (hào quang) ---------- */
  const flame = new THREE.Shape();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = 0.42 + (i % 2 ? 0.06 : 0);
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) flame.moveTo(x, y);
    else flame.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.34, 0, Math.PI * 2, true);
  flame.holes.push(hole);
  const hg = new THREE.ExtrudeGeometry(flame, { depth: 0.015, bevelEnabled: false });
  hg.scale(k, k, k);
  M(hg, gold, 0, 1.86, -0.32);
  if (!_halo.t) _halo.t = haloTexture();
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.42 * k, 40), new THREE.MeshBasicMaterial({ map: _halo.t, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(0, 1.86 * k, -0.3 * k);
  g.add(glow);

  /* ---------- the body ---------- */
  // lap and skirt: a flared silk drape over the knees
  const skirtPts = [
    [0.3, 1.02],
    [0.42, 0.9],
    [0.56, 0.72],
    [0.6, 0.62],
    [0.62, 0.1],
    [0.64, 0.0],
  ].map(([r, y]) => new THREE.Vector2(r * k, y * k));
  const skirt = M(new THREE.LatheGeometry(skirtPts, 32), silk, 0, 0, 0.05);
  skirt.scale.z = 0.92;
  const lap = M(new THREE.SphereGeometry(0.5 * k, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), silk, 0, 0.66, 0.18);
  lap.scale.set(1.12, 0.4, 0.9);
  // the front panel, embroidered, falling to the floor
  const panel = M(new THREE.PlaneGeometry(0.38 * k, 0.72 * k, 1, 8), silk2, 0, 0.36, 0.66);
  const pp = panel.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.pow((pp.getY(i) / k + 0.36) / 0.72, 2) * -0.12 * k);
  panel.geometry.computeVertexNormals();
  M(new THREE.BoxGeometry(0.4 * k, 0.03 * k, 0.03 * k), gold, 0, 0.0, 0.66);
  // torso
  const torsoPts = [
    [0.31, 0.98],
    [0.3, 1.1],
    [0.27, 1.3],
    [0.25, 1.46],
    [0.14, 1.58],
    [0.07, 1.62],
  ].map(([r, y]) => new THREE.Vector2(r * k, y * k));
  const torso = M(new THREE.LatheGeometry(torsoPts, 28), silk, 0, 0, 0);
  torso.scale.z = 0.82;
  // sash with long ties
  M(new THREE.CylinderGeometry(0.315 * k, 0.32 * k, 0.07 * k, 28), silk2, 0, 1.02, 0).scale.z = 0.84;
  [-0.06, 0.06].forEach((x, i) => {
    const tie = M(new THREE.BoxGeometry(0.05 * k, 0.5 * k, 0.012 * k), silk2, x, 0.78, 0.6 + i * 0.01);
    tie.rotation.z = x * 1.5;
  });
  // the broad gilded collar (cổ bồng) and a necklace of pearls
  const collar = M(new THREE.CylinderGeometry(0.17 * k, 0.29 * k, 0.07 * k, 32, 1, true), silk2, 0, 1.5, 0);
  collar.scale.z = 0.85;
  const cr = M(new THREE.TorusGeometry(0.29 * k, 0.01 * k, 6, 40), gold, 0, 1.465, 0);
  cr.rotation.x = Math.PI / 2;
  cr.scale.y = 0.85;
  for (let i = 0; i < 22; i++) {
    const a = Math.PI * (0.15 + (i / 21) * 0.7);
    M(new THREE.SphereGeometry(0.014 * k, 8, 6), i % 5 === 2 ? red : pearl, Math.cos(a) * 0.2, 1.43 - Math.sin(a) * 0.12, Math.sin(a) * 0.17 + 0.04);
  }
  // ribbons (dải lụa) falling from the shoulders
  [-1, 1].forEach((sd) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sd * 0.26 * k, 1.48 * k, 0.02 * k),
      new THREE.Vector3(sd * 0.42 * k, 1.1 * k, 0.12 * k),
      new THREE.Vector3(sd * 0.5 * k, 0.7 * k, 0.32 * k),
      new THREE.Vector3(sd * 0.44 * k, 0.25 * k, 0.52 * k),
    ]);
    const rb = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.022 * k, 6), silk2);
    rb.scale.set(1, 1, 1);
    rb.castShadow = true;
    g.add(rb);
  });
  // wide sleeves meeting in the lap, hands holding a jade như ý scepter
  [-1, 1].forEach((sd) => {
    const sleevePts = [
      [0.13, 0],
      [0.11, 0.12],
      [0.09, 0.3],
      [0.08, 0.42],
    ].map(([r, y]) => new THREE.Vector2(r * k, y * k));
    const sl = M(new THREE.LatheGeometry(sleevePts, 20), silk, sd * 0.07, 0.95, 0.4);
    // the sleeve opens at the hand and narrows back up to the shoulder
    const dir = new THREE.Vector3(sd * 0.21, 0.41, -0.34).normalize();
    sl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    sl.scale.set(1, 1.25, 1);
    const hand = M(new THREE.SphereGeometry(0.05 * k, 10, 8), skin, sd * 0.07, 0.95, 0.4);
    hand.scale.set(1.2, 0.8, 1.4);
  });
  const ruyi = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.22 * k, 0.94 * k, 0.42 * k), new THREE.Vector3(0, 0.97 * k, 0.46 * k), new THREE.Vector3(0.2 * k, 1.04 * k, 0.4 * k)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(ruyi, 12, 0.018 * k, 6), jade));
  const ruyiHead = M(new THREE.SphereGeometry(0.05 * k, 12, 8), jade, 0.23, 1.06, 0.4);
  ruyiHead.scale.set(1.2, 0.8, 0.5);

  /* ---------- the head ---------- */
  M(new THREE.CylinderGeometry(0.055 * k, 0.065 * k, 0.12 * k, 12), skin, 0, 1.64, 0);
  if (!_face.t) _face.t = faceTexture();
  const faceMat = new THREE.MeshStandardMaterial({ map: _face.t, roughness: 0.45, emissive: 0x2a1408, emissiveIntensity: 0.25 });
  const head = M(new THREE.SphereGeometry(0.17 * k, 32, 24), faceMat, 0, 1.82, 0);
  head.scale.set(0.92, 1.08, 0.95);
  [-1, 1].forEach((sd) => {
    const ear = M(new THREE.SphereGeometry(0.035 * k, 8, 6), skin, sd * 0.155, 1.81, -0.01);
    ear.scale.set(0.4, 1, 0.7);
    M(new THREE.SphereGeometry(0.014 * k, 8, 6), pearl, sd * 0.16, 1.74, 0.0);
  });
  // hair: a smooth black cap and a bun beneath the crown
  const hc = M(new THREE.SphereGeometry(0.178 * k, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 1.85, -0.012);
  hc.scale.set(0.95, 1.05, 1.0);
  hc.rotation.x = -0.25;

  /* ---------- the phoenix crown (mũ phượng) ---------- */
  const cy = 1.97;
  const band = M(new THREE.CylinderGeometry(0.17 * k, 0.165 * k, 0.07 * k, 32, 1, true), gold, 0, cy, -0.01);
  (band.material as THREE.Material).side = THREE.DoubleSide;
  // the front plate: three cloud-peaks
  const plate = new THREE.Shape();
  plate.moveTo(-0.16, 0);
  plate.quadraticCurveTo(-0.17, 0.1, -0.11, 0.14);
  plate.quadraticCurveTo(-0.07, 0.1, -0.05, 0.17);
  plate.quadraticCurveTo(0, 0.28, 0.05, 0.17);
  plate.quadraticCurveTo(0.07, 0.1, 0.11, 0.14);
  plate.quadraticCurveTo(0.17, 0.1, 0.16, 0);
  plate.lineTo(-0.16, 0);
  // filigree: the plate is lace, not a slab
  [
    [-0.1, 0.07, 0.022],
    [0.1, 0.07, 0.022],
    [-0.045, 0.06, 0.016],
    [0.045, 0.06, 0.016],
    [0, 0.17, 0.018],
    [-0.12, 0.025, 0.012],
    [0.12, 0.025, 0.012],
  ].forEach(([x, y, r]) => {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, Math.PI * 2, true);
    plate.holes.push(h);
  });
  const pg = new THREE.ExtrudeGeometry(plate, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
  pg.scale(k * 0.82, k * 0.82, k);
  const pl = M(pg, gold, 0, cy + 0.02, 0.13);
  pl.rotation.x = -0.25;
  // jewels on the plate
  M(new THREE.SphereGeometry(0.028 * k, 12, 10), red, 0, cy + 0.12, 0.16);
  [-0.09, 0.09].forEach((x) => M(new THREE.SphereGeometry(0.018 * k, 10, 8), jade, x, cy + 0.09, 0.15));
  // phoenix wings on either side, and a tall plume
  [-1, 1].forEach((sd) => {
    const w = new THREE.Shape();
    w.moveTo(0, 0);
    w.quadraticCurveTo(0.1, 0.06, 0.2, 0.18);
    w.quadraticCurveTo(0.16, 0.12, 0.12, 0.13);
    w.quadraticCurveTo(0.14, 0.08, 0.08, 0.06);
    w.quadraticCurveTo(0.09, 0.03, 0, 0.02);
    const wg = new THREE.ExtrudeGeometry(w, { depth: 0.006, bevelEnabled: false });
    wg.scale(sd * k, k, k);
    const wm = M(wg, gold, sd * 0.15, cy + 0.03, 0.02);
    wm.rotation.y = sd * -0.5;
    // beaded tassel from the wing tip to the shoulder
    for (let i = 0; i < 9; i++) M(new THREE.SphereGeometry(0.011 * k, 6, 5), i % 3 === 2 ? red : i % 3 === 1 ? gold : pearl, sd * (0.2 + i * 0.006), cy - 0.03 - i * 0.045, 0.06);
  });
  const plume = new THREE.Shape();
  plume.moveTo(-0.03, 0);
  plume.quadraticCurveTo(-0.05, 0.12, 0, 0.22);
  plume.quadraticCurveTo(0.05, 0.12, 0.03, 0);
  const plg = new THREE.ExtrudeGeometry(plume, { depth: 0.006, bevelEnabled: false });
  plg.scale(k, k, k);
  M(plg, gold, 0, cy + 0.12, -0.02);
  M(new THREE.SphereGeometry(0.02 * k, 10, 8), red, 0, cy + 0.33, 0.0);
  // the pearl fringe over the brow
  for (let sx = -3; sx <= 3; sx++) {
    if (sx === 0) continue;
    for (let i = 0; i < 4; i++) {
      M(new THREE.SphereGeometry(0.0055 * k, 6, 4), i === 3 ? red : pearl, sx * 0.042, cy - 0.035 - i * 0.017, 0.15 - Math.abs(sx) * 0.006);
    }
  }
  return g;
}
