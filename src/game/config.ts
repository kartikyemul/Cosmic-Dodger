/**
 * Every tunable number lives here. Change one, save, and the browser
 * reloads instantly, so this is the file to play with.
 */
export const CONFIG = {
  // Loop
  fixedDt: 1 / 120, // physics steps 120 times per second
  maxFrameDt: 1 / 20, // never simulate more than 50ms at once (tab switching)
  maxDpr: 2, // cap pixel density so phones keep 60FPS

  // Player ship
  playerRadius: 13,
  followStiffness: 700, // higher = ship snaps to your finger harder
  followDamping: 0.8, // 1 = no overshoot, lower = bouncier
  maxSpeed: 2400,
  touchLift: 64, // on touch screens the ship floats above your fingertip

  // Hazards and difficulty
  rampSeconds: 90, // time to reach full difficulty
  hazardIntervalStart: 0.65, // seconds between rocks at the start
  hazardIntervalEnd: 0.2, // ...and at full difficulty
  playerHit: 0.7, // hitbox forgiveness: smaller = more forgiving
  hazardHit: 0.85,

  // Gravity wells
  wellFirstAt: 8, // seconds until the first well
  wellIntervalStart: 7,
  wellIntervalEnd: 3.5,
  wellPullRadius: 170,
  wellStrength: 58000,
  wellDrift: 55,

  // Score and effects
  scorePerSecond: 10,
  maxParticles: 400,

  // Used in step 4
  tagPattern: /^[A-Z0-9]{3}$/,
  leaderboardSize: 5,
} as const;
