import type { Game } from "./game";
import { clamp, lerp, rand } from "./math";
import { withAlpha, type Palette } from "./palette";
import type { Hazard, Well } from "./types";

/**
 * Draws one frame. It only reads game state, never changes it.
 * `alpha` (0 to 1) blends between the previous and current physics step.
 */
export class Renderer {
  private backdrop: CanvasGradient | null = null;
  private bw = 0;
  private bh = 0;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly c: Palette,
  ) {}

  draw(g: Game, alpha: number, now: number): void {
    const { ctx, c } = this;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.void;
    ctx.fillRect(0, 0, g.w, g.h);
    this.drawBackdrop(g);

    ctx.save();
    if (g.shake > 0.2) ctx.translate(rand(-g.shake, g.shake), rand(-g.shake, g.shake));
    this.drawStars(g);
    for (const wl of g.wells) this.drawWell(wl, g, alpha, now);
    for (const hz of g.hazards) this.drawHazard(hz, g, alpha);
    if (g.state !== "over") this.drawPlayer(g, alpha, now);
    this.drawParticles(g);
    ctx.restore();

  }

  private drawBackdrop(g: Game): void {
    if (!this.backdrop || this.bw !== g.w || this.bh !== g.h) {
      const cx = g.w / 2;
      const cy = g.h * 1.05;
      const gr = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(g.w, g.h) * 0.85);
      gr.addColorStop(0, withAlpha(this.c.violet, 0.2));
      gr.addColorStop(0.55, withAlpha(this.c.violet, 0.05));
      gr.addColorStop(1, withAlpha(this.c.violet, 0));
      this.backdrop = gr;
      this.bw = g.w;
      this.bh = g.h;
    }
    this.ctx.fillStyle = this.backdrop;
    this.ctx.fillRect(0, 0, g.w, g.h);
  }

  private drawStars(g: Game): void {
    const { ctx, c } = this;
    ctx.fillStyle = c.text;
    for (const s of g.stars) {
      ctx.globalAlpha = 0.2 + 0.6 * s.z;
      const size = 0.8 + s.z * 1.6;
      ctx.fillRect(s.x, s.y, size, size);
    }
    ctx.globalAlpha = 1;
  }

  private drawWell(wl: Well, g: Game, alpha: number, now: number): void {
    const { ctx, c } = this;
    const x = lerp(wl.px, wl.x, alpha);
    const y = lerp(wl.py, wl.y, alpha);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Rings that slide inward show which way the pull goes.
    ctx.strokeStyle = c.violet;
    ctx.lineWidth = 1.5 * g.scale;
    for (let i = 0; i < 3; i++) {
      const phase = (now / 2200 + i / 3) % 1;
      ctx.globalAlpha = 0.32 * Math.sin(phase * Math.PI);
      ctx.beginPath();
      ctx.arc(x, y, wl.r + (wl.pullR - wl.r) * (1 - phase), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, wl.r * 3.2);
    glow.addColorStop(0, withAlpha(c.violet, 0.6));
    glow.addColorStop(1, withAlpha(c.violet, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, wl.r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = c.void;
    ctx.beginPath();
    ctx.arc(x, y, wl.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.violet;
    ctx.lineWidth = 2.5 * g.scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawHazard(hz: Hazard, g: Game, alpha: number): void {
    const { ctx, c } = this;
    ctx.save();
    ctx.translate(lerp(hz.px, hz.x, alpha), lerp(hz.py, hz.y, alpha));
    ctx.rotate(hz.angle);
    ctx.lineJoin = "round";
    ctx.beginPath();
    const n = hz.shape.length;
    hz.shape.forEach((k, i) => {
      const a = (i / n) * Math.PI * 2;
      const cx = Math.cos(a) * hz.r * k;
      const cy = Math.sin(a) * hz.r * k;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.fillStyle = withAlpha(c.magenta, 0.1);
    ctx.fill();

    // A wide faint stroke plus a thin bright one fakes a glow without the cost of shadowBlur.
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = c.magenta;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 8 * g.scale;
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 2 * g.scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayer(g: Game, alpha: number, now: number): void {
    if (g.grace > 0 && Math.floor(now / 90) % 2 === 0) return;
    const { ctx, c } = this;
    const p = g.player;
    const x = lerp(p.px, p.x, alpha);
    const y = lerp(p.py, p.y, alpha);
    const r = p.r * (g.state === "ready" ? 1 + 0.05 * Math.sin(now / 450) : 1);

    ctx.save();
    ctx.translate(x, y);

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4.2);
    glow.addColorStop(0, withAlpha(c.cyan, 0.35));
    glow.addColorStop(1, withAlpha(c.cyan, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 4.2, 0, Math.PI * 2);
    ctx.fill();

    // The ship leans into its movement.
    ctx.rotate(clamp(p.vx / 1400, -0.45, 0.45));
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.3);
    ctx.lineTo(r * 0.95, r * 0.95);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.95, r * 0.95);
    ctx.closePath();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = c.ink;
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.lineJoin = "round";
    ctx.strokeStyle = c.cyan;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 7 * g.scale;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2 * g.scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawParticles(g: Game): void {
    const { ctx, c } = this;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const q of g.particles) {
      ctx.globalAlpha = clamp(q.life / q.maxLife, 0, 1);
      ctx.fillStyle = c[q.tint];
      ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
    ctx.restore();
  }
}
