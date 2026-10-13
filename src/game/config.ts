/** Tunable game constants. Step 2 (core loop) will lean on these. */
export const CONFIG = {
  /** Fixed physics timestep (seconds). Rendering interpolates between steps. */
  fixedDt: 1 / 120,
  maxFrameDt: 1 / 20,
  /** Cap device pixel ratio so high-density phones keep 60FPS. */
  maxDpr: 2,
  /** Arcade tag: exactly three A-Z or 0-9 characters. */
  tagPattern: /^[A-Z0-9]{3}$/,
  leaderboardSize: 5,
} as const;
