import { clamp, smoothstep } from "./math";

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

const DEEP: RGB = [10, 52, 96];
const SHALLOW: RGB = [34, 132, 150];
const LOWLAND: RGB = [36, 126, 58];
const MIDLAND: RGB = [72, 164, 64];
const HIGHLAND: RGB = [40, 104, 92];
const BLUE_FOREST: RGB = [48, 132, 140];

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

  constructor(readonly size: number) {
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
    const ny = ((py + 0.5) / size) * 2 - 1;
    for (let px = 0; px < size; px++) {
      const nx = ((px + 0.5) / size) * 2 - 1;
      const r2 = nx * nx + ny * ny;
      if (r2 >= 1) continue;
      const nz = Math.sqrt(1 - r2);

      // turn the sphere a little so the continents are not centred
      const cosA = Math.cos(0.9);
      const sinA = Math.sin(0.9);
      const x1 = nx * cosA + nz * sinA;
      const z1 = -nx * sinA + nz * cosA;
      const cosB = Math.cos(0.35);
      const sinB = Math.sin(0.35);
      const y2 = ny * cosB - z1 * sinB;
      const z2 = ny * sinB + z1 * cosB;

      const height = fbm(x1 * 2.1 + 3.7, y2 * 2.1 + 3.7, z2 * 2.1 + 3.7, 4);
      const detail = fbm(x1 * 7 + 11, y2 * 7 + 11, z2 * 7 + 11, 3);
      const sea = 0.47;

      let color: RGB;
      let water = false;
      if (height < sea) {
        water = true;
        color = mixRgb(SHALLOW, DEEP, smoothstep(0, 0.35, (sea - height) / sea));
      } else {
        const h = (height - sea) / (1 - sea);
        color = mixRgb(LOWLAND, MIDLAND, clamp(h * 3, 0, 1));
        color = mixRgb(color, HIGHLAND, smoothstep(0.3, 0.6, h));
        const blue = fbm(x1 * 3.2 + 21, y2 * 3.2 + 21, z2 * 3.2 + 21, 2);
        color = mixRgb(color, BLUE_FOREST, smoothstep(0.55, 0.75, blue) * 0.7);
        const shade = 0.82 + detail * 0.36;
        color = [color[0] * shade, color[1] * shade, color[2] * shade];
      }

      const cloud = fbm(x1 * 3.4 + 40, y2 * 3.4 + 40, z2 * 3.4 + 40, 3);
      color = mixRgb(color, [255, 255, 255], smoothstep(0.52, 0.72, cloud) * 0.85);

      const facing = nx * LX + ny * LY + nz * LZ;
      const light = 0.07 + 0.98 * smoothstep(-0.25, 0.75, facing);
      let spec = 0;
      if (water) {
        const hx = LX;
        const hy = LY;
        const hz = LZ + 1;
        const hl = Math.hypot(hx, hy, hz);
        spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 40) * 90;
      }

      const i = (py * size + px) * 4;
      this.data[i] = color[0] * light + spec;
      this.data[i + 1] = color[1] * light + spec;
      this.data[i + 2] = color[2] * light + spec + 6;
      this.data[i + 3] = clamp((1 - Math.sqrt(r2)) * size * 0.5, 0, 1) * 255;
    }
  }
}
