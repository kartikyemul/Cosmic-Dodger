import { CONFIG } from "./config";
import { clamp, rand, smoothstep } from "./math";
import type { Hazard, Well } from "./types";

const PEAK = 0.8;

/** progress runs from 0 to 1 along the journey. Gets harder, then eases off near the planet. */
export function difficulty(progress: number): number {
  const rise = smoothstep(0, 0.55, progress) * PEAK;
  const calm = smoothstep(0.8, 1, progress) * 0.4;
  return clamp(rise - calm, 0, 1);
}

export const hazardInterval = (d: number): number =>
  CONFIG.hazardIntervalStart + (CONFIG.hazardIntervalEnd - CONFIG.hazardIntervalStart) * d;

export function spawnHazard(
  w: number,
  h: number,
  scale: number,
  d: number,
  targetX: number,
): Hazard {
  const r = rand(14, 34) * scale;
  const x = rand(r, w - r);
  const y = -r * 1.5;
  const vy = (rand(150, 270) + 260 * d) * scale;
  let vx = rand(-40, 40) * scale;

  // As the run gets harder, more rocks are aimed at where you are right now.
  if (Math.random() < 0.15 + 0.3 * d) {
    const fallTime = (h * 0.8 + r * 1.5) / vy;
    vx = clamp(((targetX - x) / fallTime) * 0.85, -320 * scale, 320 * scale);
  }

  const shape = Array.from({ length: 7 }, () => rand(0.78, 1.12));
  return { x, y, px: x, py: y, vx, vy, r, angle: rand(0, Math.PI * 2), spin: rand(-2.2, 2.2), shape };
}

export function spawnWell(w: number, scale: number): Well {
  const r = 18 * scale;
  const pullR = CONFIG.wellPullRadius * scale;
  const x = rand(w * 0.18, w * 0.82);
  const y = -pullR * 0.6;
  return { x, y, px: x, py: y, vx: 0, vy: CONFIG.wellDrift * scale, r, pullR };
}
