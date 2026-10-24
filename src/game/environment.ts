import { STAGES } from "./journey";
import { clamp, lerp, rand, smoothstep } from "./math";
import type { Palette } from "./palette";
import { PlanetBake, type PlanetKind } from "./planet";

type RGB = [number, number, number];

interface SkyStop {
  at: number;
  top: RGB;
  bottom: RGB;
}

// deep space for most of the trip, a scorched sky near the sun, then daylight at Earth
const SKY: SkyStop[] = [
  { at: 0.0, top: [0, 0, 0], bottom: [10, 8, 30] },
  { at: 0.78, top: [2, 5, 18], bottom: [10, 20, 48] },
  { at: 0.875, top: [22, 8, 10], bottom: [96, 42, 20] },
  { at: 0.93, top: [10, 30, 80], bottom: [60, 100, 150] },
  { at: 1.0, top: [34, 92, 160], bottom: [156, 208, 214] },
];

interface PlanetInfo {
  kind: PlanetKind;
  size: number;
  rings?: boolean;
  rim: RGB | null;
}

// same order as STAGES in journey.ts (Earth has its own landing scene)
const PLANETS: PlanetInfo[] = [
  { kind: "neptune", size: 0.8, rim: [90, 140, 255] },
  { kind: "uranus", size: 0.75, rim: [150, 230, 240] },
  { kind: "saturn", size: 0.95, rings: true, rim: [240, 215, 160] },
  { kind: "jupiter", size: 1.15, rim: [240, 200, 150] },
  { kind: "mars", size: 0.55, rim: [230, 130, 90] },
  { kind: "venus", size: 0.7, rim: [255, 220, 150] },
  { kind: "mercury", size: 0.45, rim: null },
];

const HALF_WINDOW = 0.05;

const HILLS = [
  { base: 0.7, amp: 0.07, wave: 0.0045, speed: 6, color: "rgb(74, 150, 150)" },
  { base: 0.79, amp: 0.08, wave: 0.0062, speed: 12, color: "rgb(40, 124, 82)" },
  { base: 0.89, amp: 0.07, wave: 0.0085, speed: 22, color: "rgb(22, 92, 52)" },
];

interface Cloud {
  x: number;
  y: number;
  w: number;
  speed: number;
  alpha: number;
}

interface Mote {
  x: number;
  y: number;
  speed: number;
  phase: number;
  size: number;
  tint: number;
}

function sampleSky(p: number): { top: RGB; bottom: RGB } {
  for (let i = 1; i < SKY.length; i++) {
    const a = SKY[i - 1];
    const b = SKY[i];
    if (!a || !b || p > b.at) continue;
    const t = smoothstep(a.at, b.at, p);
    return {
      top: [lerp(a.top[0], b.top[0], t), lerp(a.top[1], b.top[1], t), lerp(a.top[2], b.top[2], t)],
      bottom: [
        lerp(a.bottom[0], b.bottom[0], t),
        lerp(a.bottom[1], b.bottom[1], t),
        lerp(a.bottom[2], b.bottom[2], t),
      ],
    };
  }
  const last = SKY[SKY.length - 1];
  return { top: last?.top ?? [0, 0, 0], bottom: last?.bottom ?? [0, 0, 0] };
}

const rgb = (c: RGB): string => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;

function makeCloudSprite(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const blobs = [
    [60, 78, 38], [100, 62, 46], [145, 66, 50], [190, 78, 40],
    [120, 84, 44], [80, 88, 30], [170, 90, 32],
  ];
  for (const [x, y, r] of blobs) {
    if (x === undefined || y === undefined || r === undefined) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255, 255, 255, 0.55)");
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  return canvas;
}

/**
 * Everything behind the game. One number (progress, 0 to 1) decides what is on screen:
 * seven planets drift past one by one, the sun grows, and at the end Earth rises.
 */
export class Environment {
  shown = 0;
  starAlpha = 1;
  daylight = 0;
  hazeAlpha = 1;

  private lastNow = 0;
  private w = 0;
  private h = 0;
  private readonly textures = new Map<PlanetKind, HTMLCanvasElement>();
  private readonly queue: PlanetKind[] = [...PLANETS.map((p) => p.kind), "earth"];
  private bake: PlanetBake | null = null;
  private readonly cloudSprite = makeCloudSprite();
  private clouds: Cloud[] = [];
  private motes: Mote[] = [];
  private drift = 0;

  constructor(private readonly palette: Palette) {}

  update(target: number, now: number, w: number, h: number): void {
    const dt = clamp((now - this.lastNow) / 1000, 0, 0.1);
    this.lastNow = now;

    // easing in both directions keeps restarts from snapping back to black
    const rate = target < this.shown ? 1.6 : 6;
    this.shown += (target - this.shown) * (1 - Math.exp(-rate * dt));

    const p = this.shown;
    this.starAlpha = 1 - smoothstep(0.9, 0.97, p);
    this.daylight = smoothstep(0.92, 1, p);
    this.hazeAlpha = 1 - smoothstep(0.55, 0.8, p);

    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.seedScenery();
    }
    this.stepBake();
    this.moveScenery(dt, now);
  }

  drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const { top, bottom } = sampleSky(this.shown);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgb(top));
    g.addColorStop(1, rgb(bottom));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // the sun gets bigger as you fly in towards Mercury and then Earth
    const sun = smoothstep(0.62, 0.9, this.shown);
    if (sun < 0.01) return;
    const cx = w * 0.84;
    const cy = h * 0.1;
    const radius = Math.max(w, h) * (0.18 + 0.7 * sun);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, `rgba(255, 240, 205, ${0.9 * sun})`);
    glow.addColorStop(0.12, `rgba(255, 214, 150, ${0.5 * sun})`);
    glow.addColorStop(1, "rgba(255, 190, 120, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, now: number): void {
    PLANETS.forEach((planet, i) => this.drawFlyby(ctx, planet, i, w, h));
    this.drawEarth(ctx, w, h);
    this.drawClouds(ctx);
    this.drawHills(ctx, w, h);
    this.drawMotes(ctx, now);
  }

  // a planet grows as you approach, then slides off to the side as you pass it
  private drawFlyby(ctx: CanvasRenderingContext2D, info: PlanetInfo, index: number, w: number, h: number): void {
    const at = STAGES[index]?.at ?? 0;
    const t = (this.shown - at) / HALF_WINDOW;
    if (Math.abs(t) >= 1) return;

    const near = 1 - Math.abs(t);
    const u = smoothstep(-1, 1, t);
    const side = index % 2 === 0 ? 1 : -1;
    const base = Math.max(w, h * 0.8);
    const R = base * 0.42 * info.size * (0.12 + 0.88 * near * near);
    const cx = w * (0.5 + side * (0.18 + 0.34 * u));
    const cy = h * (0.26 + 0.34 * u);
    const alpha = smoothstep(0, 0.25, near) * 0.92;
    const texture = this.textures.get(info.kind);

    ctx.save();
    ctx.globalAlpha = alpha;
    if (info.rim) this.drawRim(ctx, cx, cy, R, info.rim, w, h);
    if (info.rings) this.drawRings(ctx, cx, cy, R, false);
    if (texture) ctx.drawImage(texture, cx - R, cy - R, R * 2, R * 2);
    if (info.rings) this.drawRings(ctx, cx, cy, R, true);
    ctx.restore();
  }

  private drawRim(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c: RGB, w: number, h: number): void {
    const [r, g, b] = c;
    const rim = ctx.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.12);
    rim.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    rim.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.4)`);
    rim.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Saturn's rings: the back half is drawn first, the front half over the planet
  private drawRings(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, front: boolean): void {
    ctx.save();
    ctx.lineWidth = Math.max(1, R * 0.07);
    const from = front ? 0 : Math.PI;
    const to = front ? Math.PI : Math.PI * 2;
    [1.45, 1.62, 1.8, 2.0].forEach((f, i) => {
      ctx.strokeStyle = `rgba(226, 198, 150, ${[0.55, 0.35, 0.5, 0.3][i] ?? 0.4})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * f, R * f * 0.26, -0.38, from, to);
      ctx.stroke();
    });
    ctx.restore();
  }

  // the last stretch: Earth rises from below, then hills and clouds take over
  private drawEarth(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const p = this.shown;
    const alpha = 1 - smoothstep(0.975, 0.998, p);
    const grow = smoothstep(0.93, 0.995, p);
    if (alpha < 0.01) return;

    const base = Math.max(w, h * 0.8);
    const R = base * (0.55 + 2.05 * grow);
    const top = h * (1.04 - 0.46 * grow);
    if (top >= h) return;
    const cx = w / 2;
    const cy = top + R;

    ctx.save();
    ctx.globalAlpha = alpha;
    this.drawRim(ctx, cx, cy, R, [110, 200, 255], w, h);

    const texture = this.textures.get("earth");
    if (texture) {
      ctx.drawImage(texture, cx - R, cy - R, R * 2, R * 2);
    } else {
      ctx.fillStyle = "rgb(24, 90, 70)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
    }

    // soft haze along the edge makes the atmosphere feel thick
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const haze = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
    haze.addColorStop(0, "rgba(120, 210, 255, 0)");
    haze.addColorStop(1, "rgba(120, 210, 255, 0.28)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  private drawClouds(ctx: CanvasRenderingContext2D): void {
    const fade = smoothstep(0.95, 0.98, this.shown);
    if (fade < 0.01) return;
    ctx.save();
    for (const c of this.clouds) {
      ctx.globalAlpha = c.alpha * fade;
      ctx.drawImage(this.cloudSprite, c.x, c.y, c.w, c.w * 0.5);
    }
    ctx.restore();
  }

  private drawHills(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const fade = smoothstep(0.955, 0.99, this.shown);
    if (fade < 0.01) return;
    const rise = smoothstep(0.955, 1, this.shown);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(210, 255, 190, 0.35)";
    HILLS.forEach((layer, index) => {
      const baseY = lerp(h * 1.1, h * layer.base, rise);
      const amp = h * layer.amp;
      const shift = this.drift * layer.speed;
      ctx.beginPath();
      ctx.moveTo(0, h + 2);
      for (let x = 0; x <= w + 16; x += 16) {
        const u = (x + shift) * layer.wave + index * 2.1;
        const ridge = 0.55 * Math.sin(u) + 0.3 * Math.sin(u * 2.1 + 1.3) + 0.15 * Math.sin(u * 4.3 + 2.7);
        ctx.lineTo(x, baseY - amp * ridge);
      }
      ctx.lineTo(w + 16, h + 2);
      ctx.closePath();
      ctx.fillStyle = layer.color;
      ctx.fill();
      if (index < 2) ctx.stroke();
    });
    ctx.restore();
  }

  private drawMotes(ctx: CanvasRenderingContext2D, now: number): void {
    const fade = smoothstep(0.975, 0.998, this.shown);
    if (fade < 0.01) return;
    const colors = [this.palette.cyan, this.palette.lime, this.palette.violet];
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of this.motes) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 700 + m.phase);
      ctx.fillStyle = colors[m.tint] ?? this.palette.cyan;
      ctx.globalAlpha = fade * (0.12 + 0.1 * pulse);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = fade * (0.35 + 0.65 * pulse);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // planets are painted one after another in the background, a few ms per frame
  private stepBake(): void {
    if (!this.bake) {
      const kind = this.queue.shift();
      if (!kind) return;
      this.bake = new PlanetBake(kind === "earth" ? 512 : 256, kind);
    }
    const bake = this.bake;
    const start = performance.now();
    while (!bake.done && performance.now() - start < 3) bake.step(2);
    if (!bake.done) return;

    const canvas = document.createElement("canvas");
    canvas.width = bake.size;
    canvas.height = bake.size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.putImageData(new ImageData(bake.data, bake.size, bake.size), 0, 0);
      this.textures.set(bake.kind, canvas);
    }
    this.bake = null;
  }

  private seedScenery(): void {
    const { w, h } = this;
    this.clouds = Array.from({ length: 7 }, () => ({
      x: rand(-0.2 * w, w),
      y: rand(0.3 * h, 0.72 * h),
      w: rand(0.35 * w, 0.75 * w),
      speed: rand(6, 16),
      alpha: rand(0.18, 0.4),
    }));
    this.motes = Array.from({ length: 36 }, () => ({
      x: rand(0, w),
      y: rand(0.35 * h, h),
      speed: rand(10, 26),
      phase: rand(0, Math.PI * 2),
      size: rand(1.5, 3.2),
      tint: Math.floor(rand(0, 3)),
    }));
  }

  private moveScenery(dt: number, now: number): void {
    this.drift += dt;
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > this.w) c.x = -c.w;
    }
    for (const m of this.motes) {
      m.y -= m.speed * dt;
      m.x += Math.sin(now / 1500 + m.phase) * 10 * dt;
      if (m.y < this.h * 0.3) {
        m.y = this.h + 10;
        m.x = rand(0, this.w);
      }
    }
  }
}
