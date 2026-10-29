import { Environment } from "./environment";
import type { Game } from "./game";
import { clamp, lerp, rand } from "./math";
import { withAlpha, type Palette } from "./palette";
import type { Hazard, Well } from "./types";

export class Renderer {
  private readonly env: Environment;
  private haze: CanvasGradient | null = null;
  private hazeW = 0;
  private hazeH = 0;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly c: Palette,
  ) {
    this.env = new Environment(c);
  }

  draw(g: Game, alpha: number, now: number): void {
    const { ctx } = this;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    this.env.update(g.progress, now, g.w, g.h);
    this.env.drawSky(ctx, g.w, g.h);
    this.drawHaze(g);

    ctx.save();
    if (g.shake > 0.2) ctx.translate(rand(-g.shake, g.shake), rand(-g.shake, g.shake));
    this.drawStars(g);
    this.env.drawGround(ctx, g.w, g.h, now);
    for (const wl of g.wells) this.drawWell(wl, g, alpha, now);
    for (const hz of g.hazards) this.drawHazard(hz, g, alpha);
    this.drawTouch(g, alpha);
    if (g.state !== "over") this.drawPlayer(g, alpha, now);
    this.drawParticles(g);
    ctx.restore();
  }

  // violet glow at the bottom of the screen, only in deep space
  private drawHaze(g: Game): void {
    if (this.env.hazeAlpha < 0.01) return;
    if (!this.haze || this.hazeW !== g.w || this.hazeH !== g.h) {
      const cx = g.w / 2;
      const cy = g.h * 1.05;
      const gr = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(g.w, g.h) * 0.85);
      gr.addColorStop(0, withAlpha(this.c.violet, 0.2));
      gr.addColorStop(0.55, withAlpha(this.c.violet, 0.05));
      gr.addColorStop(1, withAlpha(this.c.violet, 0));
      this.haze = gr;
      this.hazeW = g.w;
      this.hazeH = g.h;
    }
    this.ctx.globalAlpha = this.env.hazeAlpha;
    this.ctx.fillStyle = this.haze;
    this.ctx.fillRect(0, 0, g.w, g.h);
    this.ctx.globalAlpha = 1;
  }

  private drawStars(g: Game): void {
    const fade = this.env.starAlpha;
    if (fade < 0.01) return;
    const { ctx, c } = this;
    ctx.fillStyle = c.text;
    for (const s of g.stars) {
      ctx.globalAlpha = (0.2 + 0.6 * s.z) * fade;
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
    const day = this.env.daylight;
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

    // a dark body keeps the rocks readable once the sky gets bright
    ctx.fillStyle = `rgba(24, 4, 20, ${0.25 + 0.45 * day})`;
    ctx.fill();

    ctx.strokeStyle = c.magenta;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.16 * (1 - 0.5 * day);
    ctx.lineWidth = 8 * g.scale;
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2 * g.scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayer(g: Game, alpha: number, now: number): void {
    if (g.grace > 0 && Math.floor(now / 90) % 2 === 0) return;
    const { ctx, c } = this;
    const day = this.env.daylight;
    const p = g.player;
    const x = lerp(p.px, p.x, alpha);
    const y = lerp(p.py, p.y, alpha);
    const r = p.r * (g.state === "ready" ? 1 + 0.05 * Math.sin(now / 450) : 1);

    ctx.save();
    ctx.translate(x, y);

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4.2);
    glow.addColorStop(0, withAlpha(c.cyan, 0.35 * (1 - 0.5 * day)));
    glow.addColorStop(1, withAlpha(c.cyan, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 4.2, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.lineJoin = "round";
    ctx.strokeStyle = c.cyan;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 7 * g.scale;
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2 * g.scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawTouch(g: Game, alpha: number): void {
    const t = g.touchPoint;
    if (!t || g.state !== "playing") return;
    const { ctx, c } = this;
    const x = lerp(g.player.px, g.player.x, alpha);
    const y = lerp(g.player.py, g.player.y, alpha);
    ctx.save();
    ctx.strokeStyle = c.text;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(t.x, t.y);
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
