import { clamp, rand } from "./math";
import { DEFAULT_THEME, type Theme } from "./themes";

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  spin: number;
  color: string;
}

/** Small floating decorations for festive themes. Drawn behind the game, kept faint. */
export class Decor {
  private pieces: Piece[] = [];
  private theme: Theme = DEFAULT_THEME;
  private enabled = true;
  private w = 0;
  private h = 0;

  setTheme(theme: Theme, reduceMotion: boolean): void {
    this.theme = theme;
    this.enabled = !reduceMotion;
    this.seed();
  }

  resize(w: number, h: number): void {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.seed();
  }

  update(dt: number, now: number): void {
    const kind = this.theme.decor;
    if (kind === "twinkle") return;
    for (const p of this.pieces) {
      const sway = kind === "embers" ? 0 : Math.sin(now / 1200 + p.phase) * 12;
      p.x += (p.vx + sway) * dt;
      p.y += p.vy * dt;
      if (p.y > this.h + 30 || p.y < -30 || p.x < -30 || p.x > this.w + 30) Object.assign(p, this.make(false));
    }
  }

  draw(ctx: CanvasRenderingContext2D, now: number): void {
    if (this.pieces.length === 0) return;
    const kind = this.theme.decor;
    ctx.save();
    ctx.globalCompositeOperation = kind === "embers" || kind === "lanterns" || kind === "twinkle" ? "lighter" : "source-over";
    for (const p of this.pieces) {
      ctx.fillStyle = p.color;
      if (kind === "snow") {
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "embers") {
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 * p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "lanterns") {
        ctx.globalAlpha = 0.14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20 * p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.fillRect(p.x - 4.5 * p.size, p.y - 6 * p.size, 9 * p.size, 12 * p.size);
      } else if (kind === "confetti") {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase + (now / 1000) * p.spin);
        ctx.fillRect(-4 * p.size, -2 * p.size, 8 * p.size, 4 * p.size);
        ctx.restore();
      } else if (kind === "leaves") {
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 6 * p.size, 3 * p.size, p.phase + (now / 1500) * p.spin * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "twinkle") {
        const pulse = 0.5 + 0.5 * Math.sin(now / 700 + p.phase);
        const s = 5 * p.size;
        ctx.globalAlpha = 0.15 + 0.65 * pulse;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.3, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.3, p.y);
        ctx.closePath();
        ctx.moveTo(p.x - s, p.y);
        ctx.lineTo(p.x, p.y + s * 0.3);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x, p.y - s * 0.3);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private seed(): void {
    if (!this.enabled || this.theme.decor === "none" || this.w < 1) {
      this.pieces = [];
      return;
    }
    const count = clamp(Math.round((this.w * this.h) / 22000), 18, 48);
    this.pieces = Array.from({ length: count }, () => this.make(true));
  }

  private make(anywhere: boolean): Piece {
    const kind = this.theme.decor;
    const rises = kind === "embers" || kind === "lanterns";
    let vx = 0;
    let vy = rand(20, 50);
    if (kind === "embers") {
      vx = rand(-10, 10);
      vy = -rand(25, 70);
    } else if (kind === "lanterns") {
      vy = -rand(12, 26);
    } else if (kind === "confetti") {
      vx = rand(-15, 15);
      vy = rand(40, 90);
    } else if (kind === "leaves") {
      vx = rand(-25, 10);
      vy = rand(25, 55);
    } else if (kind === "twinkle") {
      vy = 0;
    }
    return {
      x: rand(0, this.w),
      y: anywhere ? rand(0, this.h) : rises ? this.h + 20 : -20,
      vx,
      vy,
      size: rand(0.7, 1.3),
      phase: rand(0, Math.PI * 2),
      spin: rand(-3, 3),
      color: this.theme.colors[Math.floor(rand(0, this.theme.colors.length))] ?? "#ffffff",
    };
  }
}
