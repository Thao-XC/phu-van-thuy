import * as THREE from 'three';
import type { ShrineTextureLibrary } from '../proceduralTextures';

/**
 * Shared material palette for the shrine kit.
 * Colours are taken from the real buildings: Inari vermilion, aged cypress,
 * oxidised copper roofs (doban), cypress-bark roofs (hiwadabuki), thatch (kaya),
 * Ryukyu red tile, gold leaf, bronze patina and so on.
 */
export type WoodTone = 'vermilion' | 'darkWood' | 'cypress' | 'black' | 'white' | 'gold' | 'stone' | 'bronze';
export type RoofTone = 'tile' | 'copper' | 'bark' | 'thatch' | 'redtile' | 'gold' | 'darkCopper' | 'snow';

export interface KitMaterials {
  wood: Record<WoodTone, THREE.MeshStandardMaterial>;
  roof: Record<RoofTone, THREE.MeshStandardMaterial>;
  plaster: THREE.MeshStandardMaterial;
  shoji: THREE.MeshStandardMaterial;
  granite: THREE.MeshStandardMaterial;
  gravel: THREE.MeshStandardMaterial;
  paving: THREE.MeshStandardMaterial;
  patina: THREE.MeshStandardMaterial;
  bronzeDark: THREE.MeshStandardMaterial;
  rope: THREE.MeshStandardMaterial;
  paper: THREE.MeshStandardMaterial;
  glow: THREE.MeshBasicMaterial;
  water: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  interior: THREE.MeshStandardMaterial;
  green: THREE.MeshStandardMaterial;
  copperTrim: THREE.MeshStandardMaterial;
}

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);

function noiseTexture(base: string, spots: string[], size = 256, density = 1800): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < density; i++) {
    g.fillStyle = spots[i % spots.length];
    g.globalAlpha = 0.25 + Math.random() * 0.35;
    const r = Math.random() * 2.2 + 0.4;
    g.beginPath();
    g.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function stripeTexture(base: string, line: string, horizontal = true, gap = 10, size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  g.strokeStyle = line;
  g.lineWidth = 2;
  for (let p = 0; p < size; p += gap) {
    g.beginPath();
    if (horizontal) {
      g.moveTo(0, p + Math.random() * 2);
      g.lineTo(size, p + Math.random() * 2);
    } else {
      g.moveTo(p, 0);
      g.lineTo(p, size);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createKitMaterials(tex: ShrineTextureLibrary): KitMaterials {
  const tileTex = stripeTexture('#3a3f45', '#1f2327', false, 8);
  tileTex.repeat.set(6, 1);
  const copperTex = stripeTexture('#5f9a86', '#4c8170', false, 12);
  copperTex.repeat.set(5, 1);
  const barkTex = stripeTexture('#6b4a33', '#553926', true, 4);
  barkTex.repeat.set(1, 6);
  const thatchTex = stripeTexture('#a08757', '#857043', false, 3);
  thatchTex.repeat.set(4, 1);
  const redTileTex = stripeTexture('#b8533a', '#f2e6d6', false, 14);
  redTileTex.repeat.set(5, 1);
  const gravelTex = noiseTexture('#cfc8b8', ['#b5ad9b', '#e4ddcd', '#9d9585'], 256, 2600);
  gravelTex.repeat.set(10, 10);
  const pavingTex = noiseTexture('#9b9b96', ['#86868a', '#b3b2ab', '#7a7a76'], 256, 1500);
  pavingTex.repeat.set(4, 4);
  const plasterTex = noiseTexture('#f4efe4', ['#e8e1d2', '#fbf8f1'], 128, 400);

  return {
    wood: {
      vermilion: std({ map: tex.vermilion, color: 0xd9381e, roughness: 0.45 }),
      darkWood: std({ map: tex.darkWood, color: 0x6b5340, roughness: 0.85 }),
      cypress: std({ map: tex.cypressWood, color: 0xc8a27a, roughness: 0.7 }),
      black: std({ color: 0x1c1a1a, roughness: 0.3 }),
      white: std({ color: 0xf2eee6, roughness: 0.8 }),
      gold: std({ color: 0xd39a12, roughness: 0.45, metalness: 0.2, envMapIntensity: 0.3, emissive: 0x2a1600 }),
      stone: std({ map: tex.graniteStone, color: 0x9a9890, roughness: 0.9 }),
      bronze: std({ color: 0x4f6b5c, roughness: 0.55, metalness: 0.45 }),
    },
    roof: {
      tile: std({ map: tileTex, color: 0x6a7076, roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide }),
      copper: std({ map: copperTex, color: 0x9fd0bd, roughness: 0.6, metalness: 0.25, side: THREE.DoubleSide }),
      darkCopper: std({ map: copperTex, color: 0x5c7d70, roughness: 0.6, metalness: 0.25, side: THREE.DoubleSide }),
      bark: std({ map: barkTex, color: 0x9a7357, roughness: 0.85, side: THREE.DoubleSide }),
      thatch: std({ map: thatchTex, color: 0xd8c08c, roughness: 1, side: THREE.DoubleSide }),
      redtile: std({ map: redTileTex, color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide }),
      gold: std({ color: 0xd39a12, roughness: 0.45, metalness: 0.2, envMapIntensity: 0.3, emissive: 0x2a1600, side: THREE.DoubleSide }),
      snow: std({ color: 0xf6f8fb, roughness: 0.95, side: THREE.DoubleSide }),
    },
    plaster: std({ map: plasterTex, color: 0xffffff, roughness: 0.9 }),
    shoji: std({ map: tex.shojiPaper, color: 0xfffcf5, roughness: 0.9 }),
    granite: std({ map: tex.graniteStone, color: 0xa3a19a, roughness: 0.9 }),
    gravel: std({ map: gravelTex, color: 0xb4ab98, roughness: 1 }),
    paving: std({ map: pavingTex, color: 0xb9b6ae, roughness: 0.9 }),
    patina: std({ color: 0x6f8c7c, roughness: 0.6, metalness: 0.35 }),
    bronzeDark: std({ color: 0x3e352b, roughness: 0.45, metalness: 0.6 }),
    rope: std({ map: tex.braidedRope, color: 0xe2c995, roughness: 0.95 }),
    paper: std({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffe3a0 }),
    water: std({ color: 0x2c7584, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.1 }),
    rock: std({ color: 0x5e5a54, roughness: 0.95, flatShading: true }),
    interior: std({ color: 0x1a120c, roughness: 1 }),
    green: std({ color: 0x3e6b3a, roughness: 0.95, flatShading: true }),
    copperTrim: std({ color: 0x6fae98, roughness: 0.5, metalness: 0.3 }),
  };
}

/** Canvas texture with vertical kanji text, for lanterns and gate placards */
export function kanjiTexture(text: string, bg: string, fg: string, w = 256, h = 512, vertical = true): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const chars = [...text];
  if (vertical) {
    const size = Math.min(w * 0.7, (h * 0.8) / chars.length);
    g.font = `bold ${size}px "Noto Serif JP", "Hiragino Mincho ProN", serif`;
    chars.forEach((ch, i) => g.fillText(ch, w / 2, h * 0.1 + size * (i + 0.5) + (h * 0.8 - size * chars.length) / 2));
  } else {
    const size = Math.min(h * 0.7, (w * 0.85) / chars.length);
    g.font = `bold ${size}px "Noto Serif JP", "Hiragino Mincho ProN", serif`;
    g.fillText(text, w / 2, h / 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Vietnamese (quốc ngữ) calligraphy-style text: vertical boards stack one syllable per line */
export function viTexture(text: string, bg: string, fg: string, w = 256, h = 512, vertical = true): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const draw = () => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const words = text.split(/\s+/).filter(Boolean);
    const fontAt = (px: number) => `700 ${px}px "Noto Serif", "Times New Roman", serif`;
    let lines: string[];
    if (vertical) lines = words;
    else {
      // one line if it fits comfortably, otherwise two balanced lines
      g.font = fontAt(h * 0.55);
      lines = g.measureText(text).width < w * 0.9 || words.length < 2 ? [text] : [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')];
    }
    const lineH = (h * (vertical ? 0.86 : 0.8)) / lines.length;
    let size = lineH * (vertical ? 0.62 : 0.78);
    g.font = fontAt(size);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > w * 0.88) size *= (w * 0.88) / widest;
    g.font = fontAt(size);
    const top = (h - lineH * lines.length) / 2;
    lines.forEach((l, i) => g.fillText(l, w / 2, top + lineH * (i + 0.5)));
    t.needsUpdate = true;
  };
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  draw();
  document.fonts?.ready.then(draw).catch(() => undefined);
  return t;
}
