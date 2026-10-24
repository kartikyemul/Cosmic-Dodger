import { clamp, smoothstep } from "./math";

export type PlanetKind =
  | "neptune" | "uranus" | "saturn" | "jupiter" | "mars" | "venus" | "mercury" | "earth";

function hash(ix: number, iy: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const ease = (t: number): number => t * t * (3 - 2 * t);

function noise(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = ease(x - ix);
  const fy = ease(y - iy);
  const fz = ease(z - iz);
  return mix(
    mix(
      mix(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx),
      mix(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx),
      fy,
    ),
    mix(
      mix(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx),
      mix(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx),
      fy,
    ),
    fz,
  );
}

function fbm(x: number, y: number, z: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, y * freq, z * freq) * amp;
    total += amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum / total;
}

type RGB = [number, number, number];
const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];
const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

interface Surface {
  color: RGB;
  water: boolean;
}

function earth(x: number, y: number, z: number): Surface {
  const height = fbm(x * 2.1 + 3.7, y * 2.1 + 3.7, z * 2.1 + 3.7, 4);
  const detail = fbm(x * 7 + 11, y * 7 + 11, z * 7 + 11, 3);
  const sea = 0.47;
  let color: RGB;
  let water = false;
  if (height < sea) {
    water = true;
    color = mixRgb([34, 132, 150], [10, 52, 96], smoothstep(0, 0.35, (sea - height) / sea));
  } else {
    const h = (height - sea) / (1 - sea);
    color = mixRgb([36, 126, 58], [72, 164, 64], clamp(h * 3, 0, 1));
    color = mixRgb(color, [40, 104, 92], smoothstep(0.3, 0.6, h));
    const blue = fbm(x * 3.2 + 21, y * 3.2 + 21, z * 3.2 + 21, 2);
    color = mixRgb(color, [48, 132, 140], smoothstep(0.55, 0.75, blue) * 0.7);
    color = scale(color, 0.82 + detail * 0.36);
  }
  const cloud = fbm(x * 3.4 + 40, y * 3.4 + 40, z * 3.4 + 40, 3);
  color = mixRgb(color, [255, 255, 255], smoothstep(0.52, 0.72, cloud) * 0.85);
  return { color, water };
}

function jupiter(x: number, y: number, z: number): Surface {
  const warp = fbm(x * 2.5 + 5, y * 0.8 + 5, z * 2.5 + 5, 3);
  const band = Math.sin(y * 16 + warp * 4.5) * 0.5 + 0.5;
  let c = mixRgb([232, 212, 176], [168, 104, 62], smoothstep(0.25, 0.75, band));
  c = mixRgb(c, [120, 76, 48], smoothstep(0.8, 1, band) * 0.6);
  const d = ((Math.atan2(x, z) - 0.6) / 0.42) ** 2 + ((y + 0.28) / 0.13) ** 2;
  c = mixRgb(c, [176, 62, 42], (1 - smoothstep(0.4, 1, d)) * 0.9);
  return { color: scale(c, 0.92 + warp * 0.16), water: false };
}

function saturn(x: number, y: number, z: number): Surface {
  const warp = fbm(x * 2 + 2, y * 0.8 + 2, z * 2 + 2, 3);
  const band = Math.sin(y * 12 + warp * 2) * 0.5 + 0.5;
  return { color: mixRgb([208, 176, 116], [240, 222, 172], band), water: false };
}

function uranus(x: number, y: number, z: number): Surface {
  const warp = fbm(x * 2 + 8, y * 0.8 + 8, z * 2 + 8, 2);
  const band = Math.sin(y * 7 + warp) * 0.5 + 0.5;
  return { color: mixRgb([146, 214, 224], [176, 238, 242], band * 0.8), water: false };
}

function neptune(x: number, y: number, z: number): Surface {
  const warp = fbm(x * 2 + 4, y * 0.8 + 4, z * 2 + 4, 3);
  const band = Math.sin(y * 10 + warp * 3) * 0.5 + 0.5;
  let c = mixRgb([34, 66, 184], [70, 112, 226], band);
  const streak = fbm(x * 5 + 1, y * 14 + 1, z * 5 + 1, 3);
  c = mixRgb(c, [230, 240, 255], smoothstep(0.62, 0.76, streak) * 0.7);
  const d = ((Math.atan2(x, z) - 0.8) / 0.4) ** 2 + ((y - 0.25) / 0.15) ** 2;
  c = mixRgb(c, [14, 26, 104], (1 - smoothstep(0.4, 1, d)) * 0.8);
  return { color: c, water: false };
}

function mars(x: number, y: number, z: number): Surface {
  const n = fbm(x * 2.4 + 2, y * 2.4 + 2, z * 2.4 + 2, 4);
  const fine = fbm(x * 9 + 6, y * 9 + 6, z * 9 + 6, 2);
  let c = mixRgb([178, 86, 50], [120, 58, 42], smoothstep(0.42, 0.62, n));
  c = scale(c, 0.85 + fine * 0.3);
  c = mixRgb(c, [240, 236, 232], smoothstep(0.82, 0.92, Math.abs(y)));
  return { color: c, water: false };
}

function venus(x: number, y: number, z: number): Surface {
  const warp = fbm(x * 2 + 9, y * 3 + 9, z * 2 + 9, 3);
  const swirl = fbm(x * 3 + warp * 2, y * 5 + warp * 2, z * 3 + warp * 2, 3);
  return { color: mixRgb([212, 160, 90], [248, 226, 168], smoothstep(0.3, 0.7, swirl)), water: false };
}

function mercury(x: number, y: number, z: number): Surface {
  const plains = fbm(x * 1.8 + 7, y * 1.8 + 7, z * 1.8 + 7, 3);
  const rough = fbm(x * 9 + 3, y * 9 + 3, z * 9 + 3, 3);
  let c = mixRgb([152, 148, 142], [96, 94, 92], smoothstep(0.5, 0.62, plains));
  c = scale(c, 0.78 + rough * 0.5);
  c = scale(c, 1 + (1 - smoothstep(0, 0.035, Math.abs(rough - 0.55))) * 0.25);
  return { color: c, water: false };
}

const SURFACES: Record<PlanetKind, (x: number, y: number, z: number) => Surface> = {
  earth, jupiter, saturn, uranus, neptune, mars, venus, mercury,
};

// light comes from the upper right, like the sun in the sky scene
const LIGHT: RGB = [0.55, -0.55, 0.62];
const LIGHT_LEN = Math.hypot(...LIGHT);
const [LX, LY, LZ] = [LIGHT[0] / LIGHT_LEN, LIGHT[1] / LIGHT_LEN, LIGHT[2] / LIGHT_LEN];

/**
 * Paints a lit planet into an RGBA buffer a few rows at a time,
 * so the game never freezes while it is being made.
 */
export class PlanetBake {
  readonly data: Uint8ClampedArray<ArrayBuffer>;
  private row = 0;

  constructor(
    readonly size: number,
    readonly kind: PlanetKind,
  ) {
    this.data = new Uint8ClampedArray(size * size * 4);
  }

  get done(): boolean {
    return this.row >= this.size;
  }

  step(rows: number): void {
    const end = Math.min(this.size, this.row + rows);
    for (; this.row < end; this.row++) this.paintRow(this.row);
  }

  private paintRow(py: number): void {
    const size = this.size;
    const surface = SURFACES[this.kind];
    const ny = ((py + 0.5) / size) * 2 - 1;
    for (let px = 0; px < size; px++) {
      const nx = ((px + 0.5) / size) * 2 - 1;
      const r2 = nx * nx + ny * ny;
      if (r2 >= 1) continue;
      const nz = Math.sqrt(1 - r2);

      // turn the sphere a little so features are not centred
      const x1 = nx * Math.cos(0.9) + nz * Math.sin(0.9);
      const z1 = -nx * Math.sin(0.9) + nz * Math.cos(0.9);
      const y2 = ny * Math.cos(0.35) - z1 * Math.sin(0.35);
      const z2 = ny * Math.sin(0.35) + z1 * Math.cos(0.35);

      const { color, water } = surface(x1, y2, z2);

      const facing = nx * LX + ny * LY + nz * LZ;
      const light = 0.07 + 0.98 * smoothstep(-0.25, 0.75, facing);
      let spec = 0;
      if (water) {
        const hz = LZ + 1;
        const hl = Math.hypot(LX, LY, hz);
        spec = Math.pow(Math.max(0, (nx * LX + ny * LY + nz * hz) / hl), 40) * 90;
      }

      const i = (py * size + px) * 4;
      this.data[i] = color[0] * light + spec;
      this.data[i + 1] = color[1] * light + spec;
      this.data[i + 2] = color[2] * light + spec + 6;
      this.data[i + 3] = clamp((1 - Math.sqrt(r2)) * size * 0.5, 0, 1) * 255;
    }
  }
}
