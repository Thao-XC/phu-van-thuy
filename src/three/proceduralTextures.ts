import * as THREE from 'three';

export interface ShrineTextureLibrary {
  vermilion: THREE.CanvasTexture;
  darkWood: THREE.CanvasTexture;
  cypressWood: THREE.CanvasTexture;
  roofTile: THREE.CanvasTexture;
  graniteStone: THREE.CanvasTexture;
  shojiPaper: THREE.CanvasTexture;
  goldTrim: THREE.CanvasTexture;
  braidedRope: THREE.CanvasTexture;
  waterFlow: THREE.CanvasTexture;
  lanternPaper: THREE.CanvasTexture;
}

export function createProceduralTextures(): ShrineTextureLibrary {
  // Helper to create canvas
  const makeCanvas = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    draw(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  // 1. Vermilion Shinto Lacquer (朱色 - Shu-iro)
  const vermilion = makeCanvas(512, 512, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#d92b18');
    grad.addColorStop(0.5, '#c52210');
    grad.addColorStop(1, '#a81808');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle natural lacquer woodgrain streaks
    ctx.fillStyle = 'rgba(255, 120, 80, 0.08)';
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * 512;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 3);
    }
    ctx.fillStyle = 'rgba(50, 0, 0, 0.12)';
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 512;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
    }
  });

  // 2. Dark Weathered Timber / Aged Shrine Wood
  const darkWood = makeCanvas(512, 512, (ctx) => {
    ctx.fillStyle = '#2c221c';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 140; i++) {
      const y = Math.random() * 512;
      const h = 1 + Math.random() * 4;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70, 55, 45, 0.18)' : 'rgba(15, 10, 8, 0.28)';
      ctx.fillRect(0, y, 512, h);
    }
  });

  // 3. Cypress / Hinoki Wood
  const cypressWood = makeCanvas(512, 512, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#c99a67');
    grad.addColorStop(1, '#ba8b58');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(120, 75, 40, 0.15)';
    for (let i = 0; i < 100; i++) {
      const y = Math.random() * 512;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
    }
  });

  // 4. Traditional Japanese Roof Tiles (Kawara 瓦)
  const roofTile = makeCanvas(512, 512, (ctx) => {
    ctx.fillStyle = '#22252a';
    ctx.fillRect(0, 0, 512, 512);

    // Overlapping scalloped ridges
    const rows = 16;
    const cols = 8;
    const rowH = 512 / rows;
    const colW = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      // Shadow beneath each tile row
      ctx.fillStyle = '#111316';
      ctx.fillRect(0, y, 512, 4);

      for (let c = 0; c < cols; c++) {
        const x = c * colW;
        ctx.beginPath();
        ctx.arc(x + colW / 2, y + rowH * 0.85, colW * 0.42, Math.PI, 0, false);
        ctx.fillStyle = '#2f343b';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#434954';
        ctx.stroke();
      }
    }
  });

  // 5. Granite Stone (Mikage-ishi) for Lanterns & Sando paving
  const graniteStone = makeCanvas(512, 512, (ctx) => {
    ctx.fillStyle = '#7a7f85';
    ctx.fillRect(0, 0, 512, 512);

    // Granite flecks
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const s = 1 + Math.random() * 2.5;
      const rand = Math.random();
      if (rand < 0.35) {
        ctx.fillStyle = 'rgba(240, 240, 245, 0.45)';
      } else if (rand < 0.7) {
        ctx.fillStyle = 'rgba(25, 30, 35, 0.45)';
      } else {
        ctx.fillStyle = 'rgba(65, 80, 60, 0.2)'; // subtle moss
      }
      ctx.fillRect(x, y, s, s);
    }
  });

  // 6. Shoji Paper (Fibrous Japanese Washi)
  const shojiPaper = makeCanvas(256, 256, (ctx) => {
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle paper fibres
    ctx.fillStyle = 'rgba(200, 190, 175, 0.15)';
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillRect(x, y, 2 + Math.random() * 6, 1);
    }

    // Wooden grid lattice
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3d2c1e';
    for (let x = 0; x <= 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  });

  // 7. Gold Leaf / Kinpaku
  const goldTrim = makeCanvas(256, 256, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#f9d342');
    grad.addColorStop(0.4, '#e5ad23');
    grad.addColorStop(0.7, '#fef08a');
    grad.addColorStop(1, '#c68a15');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  });

  // 8. Braided Shimenawa Straw Rope
  const braidedRope = makeCanvas(256, 256, (ctx) => {
    ctx.fillStyle = '#baa075';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#7c6442';
    ctx.lineWidth = 6;
    for (let y = -256; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + 256);
      ctx.stroke();
    }
  });

  // 9. Water Flow / Pond Ripples
  const waterFlow = makeCanvas(256, 256, (ctx) => {
    ctx.fillStyle = '#1e3a47';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    for (let y = 16; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(64, y - 10, 192, y + 10, 256, y);
      ctx.stroke();
    }
  });

  // 10. Chochin / Lantern Paper with Kanji
  const lanternPaper = makeCanvas(256, 512, (ctx) => {
    ctx.fillStyle = '#cf190c';
    ctx.fillRect(0, 0, 256, 512);

    // Ribs of lantern
    ctx.fillStyle = '#5c0800';
    for (let y = 10; y < 512; y += 24) {
      ctx.fillRect(0, y, 256, 2);
    }

    // Kanji seal in center
    ctx.fillStyle = '#111';
    ctx.font = 'bold 80px "Noto Serif JP", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('奉', 128, 200);
    ctx.fillText('納', 128, 300);
  });

  return {
    vermilion,
    darkWood,
    cypressWood,
    roofTile,
    graniteStone,
    shojiPaper,
    goldTrim,
    braidedRope,
    waterFlow,
    lanternPaper
  };
}
