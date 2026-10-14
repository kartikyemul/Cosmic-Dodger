/** Anything that moves. px/py is the previous step's position, used for smooth rendering. */
export interface Body {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  r: number;
}

/** A falling neon rock. `shape` holds the radius multiplier of each corner. */
export interface Hazard extends Body {
  angle: number;
  spin: number;
  shape: number[];
}

/** A gravity well: deadly core, pulls the ship toward it inside pullR. */
export interface Well extends Body {
  pullR: number;
}

export type Tint = "cyan" | "violet" | "magenta" | "lime" | "text";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  tint: Tint;
}

export interface Star {
  x: number;
  y: number;
  /** Depth from 0 (far, slow, dim) to 1 (near, fast, bright). */
  z: number;
}

export type GameState = "ready" | "playing" | "paused" | "won" | "over";
