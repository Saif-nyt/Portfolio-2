import * as THREE from "three";

let flameTex: THREE.Texture | null = null;
let smokeTex: THREE.Texture | null = null;
let dotTex: THREE.Texture | null = null;
let mistTex: THREE.Texture | null = null;

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

export function getFlameTexture(): THREE.Texture {
  if (flameTex) return flameTex;
  const [c, ctx] = makeCanvas(128);
  const img = ctx.createImageData(128, 128);
  const core = [255, 246, 214];
  const mid = [255, 176, 76];
  const edge = [232, 62, 20];
  for (let y = 0; y < 128; y++) {
    const ty = y / 127;
    const width = 5 + 30 * Math.pow(ty, 0.5) * (1 - 0.35 * Math.pow(ty, 3));
    const bottomFade = 1 - Math.pow(Math.max(0, (ty - 0.84) / 0.16), 2);
    const vert = Math.pow(ty, 0.5) * bottomFade;
    for (let x = 0; x < 128; x++) {
      const dx = Math.abs(x - 64) / width;
      const hf = dx >= 1 ? 0 : 1 - dx * dx;
      const a = Math.pow(hf, 1.5) * vert;
      const cd = Math.min(1, Math.abs(x - 64) / (width * 1.05));
      let r: number;
      let g: number;
      let b: number;
      if (cd < 0.5) {
        const k = cd / 0.5;
        r = core[0] + (mid[0] - core[0]) * k;
        g = core[1] + (mid[1] - core[1]) * k;
        b = core[2] + (mid[2] - core[2]) * k;
      } else {
        const k = (cd - 0.5) / 0.5;
        r = mid[0] + (edge[0] - mid[0]) * k;
        g = mid[1] + (edge[1] - mid[1]) * k;
        b = mid[2] + (edge[2] - mid[2]) * k;
      }
      const i = (y * 128 + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  flameTex = new THREE.CanvasTexture(c);
  flameTex.colorSpace = THREE.SRGBColorSpace;
  return flameTex;
}

export function getSmokeTexture(): THREE.Texture {
  if (smokeTex) return smokeTex;
  const [c, ctx] = makeCanvas(128);
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(180,190,188,0.42)");
  g.addColorStop(0.55, "rgba(150,160,160,0.16)");
  g.addColorStop(1, "rgba(120,130,130,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  smokeTex = new THREE.CanvasTexture(c);
  smokeTex.colorSpace = THREE.SRGBColorSpace;
  return smokeTex;
}

export function getDotTexture(): THREE.Texture {
  if (dotTex) return dotTex;
  const [c, ctx] = makeCanvas(64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c);
  dotTex.colorSpace = THREE.SRGBColorSpace;
  return dotTex;
}

export function getMistTexture(): THREE.Texture {
  if (mistTex) return mistTex;
  const [c, ctx] = makeCanvas(256);
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
  g.addColorStop(0, "rgba(150,200,196,0.30)");
  g.addColorStop(0.5, "rgba(120,175,172,0.12)");
  g.addColorStop(1, "rgba(90,140,140,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  mistTex = new THREE.CanvasTexture(c);
  mistTex.colorSpace = THREE.SRGBColorSpace;
  return mistTex;
}
