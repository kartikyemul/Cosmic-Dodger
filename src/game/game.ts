import { CONFIG } from "./config";
import { Input } from "./input";
import { clamp, lerp, rand } from "./math";
import type { Palette } from "./palette";
import { Renderer } from "./renderer";
import { difficulty, hazardInterval, spawnHazard, spawnWell } from "./spawner";
import type { Body, GameState, Hazard, Particle, Star, Well } from "./types";

export const RESTART_DELAY_MS = 700;
const RESUME_GRACE = 0.8;

const makeBody = (x: number, y: number, r: number): Body => ({
  x, y, px: x, py: y, vx: 0, vy: 0, r,
});

const snap = (b: Body): void => {
  b.px = b.x;
  b.py = b.y;
};

export class Game {
  state: GameState = "ready";
  w = 0;
  h = 0;
  scale = 1;
  elapsed = 0;
  score = 0;
  best = 0;
  newBest = false;
  shake = 0;
  grace = 0;
  lockedUntil = 0;
  readonly player: Body = makeBody(0, 0, CONFIG.playerRadius);
  hazards: Hazard[] = [];
  wells: Well[] = [];
  particles: Particle[] = [];
  stars: Star[] = [];

  // the UI plugs into these
  onStateChange: ((state: GameState) => void) | null = null;
  onScore: ((score: number) => void) | null = null;
  canStart: (() => boolean) | null = null;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: Input;
  private readonly renderer: Renderer;
  private readonly reduceMotion: boolean;
  private acc = 0;
  private last = 0;
  private spawnTimer = 0.6;
  private wellTimer: number = CONFIG.wellFirstAt;
  private trailTimer = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    palette: Palette,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("This browser does not support canvas 2D.");
    this.ctx = ctx;
    this.input = new Input(canvas);
    this.renderer = new Renderer(ctx, palette);
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  run(): void {
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  resize(w: number, h: number, dpr: number): void {
    const d = Math.min(dpr, CONFIG.maxDpr);
    this.canvas.width = Math.round(w * d);
    this.canvas.height = Math.round(h * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.w = w;
    this.h = h;
    this.scale = clamp(Math.min(w, h) / 720, 0.65, 1.35);
    this.player.r = CONFIG.playerRadius * this.scale;
    this.seedStars();
    if (this.state === "playing" || this.state === "paused") this.keepPlayerInside();
    else this.placePlayer();
  }

  /** Starts a run from the start screen or the game over screen. */
  start(): void {
    const canRestart =
      this.state === "ready" || (this.state === "over" && performance.now() >= this.lockedUntil);
    if (!canRestart) return;
    if (this.canStart && !this.canStart()) return;
    this.startRun();
  }

  pause(): void {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.canvas.style.cursor = "default";
    this.onStateChange?.(this.state);
  }

  resume(): void {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.grace = RESUME_GRACE;
    this.canvas.style.cursor = "none";
    this.onStateChange?.(this.state);
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.code !== "Escape" && e.code !== "KeyP") return;
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  };

  private onVisibility = (): void => {
    if (document.hidden) this.pause();
  };

  private frame = (now: number): void => {
    try {
      const dt = Math.min((now - this.last) / 1000, CONFIG.maxFrameDt);
      this.last = now;

      if (this.input.consumePress()) this.start();

      this.acc += dt;
      while (this.acc >= CONFIG.fixedDt) {
        this.step(CONFIG.fixedDt);
        this.acc -= CONFIG.fixedDt;
      }

      this.driftStars(dt);
      this.renderer.draw(this, this.acc / CONFIG.fixedDt, now);
    } catch (err) {
      // one bad frame should never kill the whole loop
      console.error("frame failed", err);
    }
    requestAnimationFrame(this.frame);
  };

  private step(dt: number): void {
    snap(this.player);
    this.hazards.forEach(snap);
    this.wells.forEach(snap);

    if (this.state === "paused") return;
    if (this.state === "playing") this.stepPlaying(dt);
    else if (this.state === "ready") this.movePlayer(dt);

    this.emitTrail(dt);
    this.stepParticles(dt);
    this.shake *= Math.exp(-7 * dt);
  }

  private stepPlaying(dt: number): void {
    this.elapsed += dt;
    const s = Math.floor(this.elapsed * CONFIG.scorePerSecond);
    if (s !== this.score) {
      this.score = s;
      this.onScore?.(s);
    }
    if (this.grace > 0) this.grace -= dt;

    this.spawnThings(dt, difficulty(this.elapsed));
    this.movePlayer(dt);
    this.moveWorld(dt);
    if (this.grace <= 0) this.checkCollisions();
  }

  // player

  private target(): { x: number; y: number } {
    if (!this.input.hasPointer) return { x: this.w / 2, y: this.h * 0.78 };
    const lift = this.input.pointerType === "touch" ? CONFIG.touchLift * this.scale : 0;
    const m = this.player.r * 1.5;
    return {
      x: clamp(this.input.x, m, this.w - m),
      y: clamp(this.input.y - lift, m, this.h - m),
    };
  }

  private movePlayer(dt: number): void {
    const p = this.player;
    const t = this.target();
    const k = CONFIG.followStiffness;
    const c = 2 * Math.sqrt(k) * CONFIG.followDamping;

    p.vx += ((t.x - p.x) * k - p.vx * c) * dt;
    p.vy += ((t.y - p.y) * k - p.vy * c) * dt;

    for (const well of this.wells) {
      const dx = well.x - p.x;
      const dy = well.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < well.pullR && dist > 0.001) {
        const near = 1 - dist / well.pullR;
        const accel = CONFIG.wellStrength * this.scale * near * near;
        p.vx += (dx / dist) * accel * dt;
        p.vy += (dy / dist) * accel * dt;
      }
    }

    const max = CONFIG.maxSpeed * this.scale;
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > max) {
      p.vx = (p.vx / speed) * max;
      p.vy = (p.vy / speed) * max;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    this.keepPlayerInside();
  }

  private keepPlayerInside(): void {
    const p = this.player;
    p.x = clamp(p.x, p.r, this.w - p.r);
    p.y = clamp(p.y, p.r, this.h - p.r);
  }

  private placePlayer(): void {
    const p = this.player;
    const t = this.target();
    p.x = p.px = t.x;
    p.y = p.py = t.y;
    p.vx = 0;
    p.vy = 0;
  }

  // world

  private spawnThings(dt: number, d: number): void {
    this.spawnTimer -= dt;
    while (this.spawnTimer <= 0) {
      const count = Math.random() < d * 0.5 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        this.hazards.push(spawnHazard(this.w, this.h, this.scale, d, this.player.x));
      }
      this.spawnTimer += hazardInterval(d) * rand(0.7, 1.3);
    }

    this.wellTimer -= dt;
    if (this.wellTimer <= 0) {
      this.wells.push(spawnWell(this.w, this.scale));
      this.wellTimer = lerp(CONFIG.wellIntervalStart, CONFIG.wellIntervalEnd, d) * rand(0.8, 1.2);
    }
  }

  private moveWorld(dt: number): void {
    for (const hz of this.hazards) {
      hz.x += hz.vx * dt;
      hz.y += hz.vy * dt;
      hz.angle += hz.spin * dt;
    }
    for (const wl of this.wells) wl.y += wl.vy * dt;

    this.hazards = this.hazards.filter(
      (hz) => hz.y < this.h + hz.r * 2 && hz.x > -hz.r * 4 && hz.x < this.w + hz.r * 4,
    );
    this.wells = this.wells.filter((wl) => wl.y < this.h + wl.pullR);
  }

  private checkCollisions(): void {
    const p = this.player;
    for (const hz of this.hazards) {
      const reach = p.r * CONFIG.playerHit + hz.r * CONFIG.hazardHit;
      if ((hz.x - p.x) ** 2 + (hz.y - p.y) ** 2 < reach * reach) {
        this.die();
        return;
      }
    }
    for (const wl of this.wells) {
      const reach = p.r * CONFIG.playerHit + wl.r;
      if ((wl.x - p.x) ** 2 + (wl.y - p.y) ** 2 < reach * reach) {
        this.die();
        return;
      }
    }
  }

  // state changes

  private startRun(): void {
    this.hazards = [];
    this.wells = [];
    this.particles = [];
    this.elapsed = 0;
    this.score = 0;
    this.newBest = false;
    this.shake = 0;
    this.grace = 0;
    this.spawnTimer = 0.6;
    this.wellTimer = CONFIG.wellFirstAt;
    this.placePlayer();
    this.state = "playing";
    this.canvas.style.cursor = "none";
    this.onScore?.(0);
    this.onStateChange?.(this.state);
  }

  private die(): void {
    const p = this.player;
    this.state = "over";
    this.newBest = this.score > this.best;
    if (this.newBest) this.best = this.score;
    this.lockedUntil = performance.now() + RESTART_DELAY_MS;
    if (!this.reduceMotion) this.shake = 14 * this.scale;
    this.canvas.style.cursor = "default";

    for (let i = 0; i < 48; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(80, 520) * this.scale;
      this.addParticle({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0,
        maxLife: rand(0.4, 0.95),
        size: rand(1.5, 3.5) * this.scale,
        tint: i % 3 === 0 ? "text" : i % 3 === 1 ? "cyan" : "violet",
      });
    }
    this.onStateChange?.(this.state);
  }

  // effects

  private addParticle(q: Particle): void {
    if (this.particles.length >= CONFIG.maxParticles) return;
    this.particles.push({ ...q, life: q.life > 0 ? q.life : q.maxLife });
  }

  private emitTrail(dt: number): void {
    if (this.state === "over") return;
    const p = this.player;
    this.trailTimer += dt;
    while (this.trailTimer >= 0.016) {
      this.trailTimer -= 0.016;
      this.addParticle({
        x: p.x + rand(-3, 3) * this.scale,
        y: p.y + p.r * 0.9,
        vx: -p.vx * 0.04 + rand(-14, 14),
        vy: rand(60, 140) * this.scale - p.vy * 0.04,
        life: 0.34,
        maxLife: 0.34,
        size: rand(1.5, 3) * this.scale,
        tint: "cyan",
      });
    }
  }

  private stepParticles(dt: number): void {
    const damp = Math.exp(-2.4 * dt);
    for (const q of this.particles) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= damp;
      q.vy *= damp;
      q.life -= dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  private seedStars(): void {
    const count = clamp(Math.round((this.w * this.h) / 9000), 40, 160);
    this.stars = Array.from({ length: count }, () => ({
      x: rand(0, this.w),
      y: rand(0, this.h),
      z: rand(0.15, 1),
    }));
  }

  private driftStars(dt: number): void {
    const boost = this.state === "playing" ? 1 + difficulty(this.elapsed) * 1.2 : 1;
    for (const s of this.stars) {
      s.y += (22 + 150 * s.z) * this.scale * boost * dt;
      if (s.y > this.h) {
        s.y = -2;
        s.x = rand(0, this.w);
      }
    }
  }
}
