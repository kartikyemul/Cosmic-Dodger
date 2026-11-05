const BEST_KEY = "cosmic-dodger:v2:best";
const TAG_KEY = "cosmic-dodger:tag";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode or blocked storage: the game still works, it just forgets
  }
}

export function loadBest(): number {
  const n = Number(read(BEST_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export const saveBest = (score: number): void => write(BEST_KEY, String(Math.floor(score)));

export const loadTag = (): string => read(TAG_KEY) ?? "";

export const saveTag = (tag: string): void => write(TAG_KEY, tag);

const MUTE_KEY = "cosmic-dodger:muted";
const RUNS_KEY = "cosmic-dodger:v2:runs";

export const loadMuted = (): boolean => read(MUTE_KEY) === "1";
export const saveMuted = (muted: boolean): void => write(MUTE_KEY, muted ? "1" : "0");

export interface Run {
  tag: string;
  score: number;
  time: number;
}

function isRun(value: unknown): value is Run {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.tag === "string" &&
    typeof r.score === "number" &&
    Number.isFinite(r.score) &&
    typeof r.time === "number" &&
    Number.isFinite(r.time)
  );
}

/** Best runs on this device. Bad or edited data is ignored instead of crashing. */
export function loadRuns(): Run[] {
  try {
    const data: unknown = JSON.parse(read(RUNS_KEY) ?? "[]");
    return Array.isArray(data) ? data.filter(isRun).slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function addRun(run: Run): void {
  const runs = [...loadRuns(), run].sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 5);
  write(RUNS_KEY, JSON.stringify(runs));
}

const LIFT_KEY = "cosmic-dodger:lift";
export const LIFT_DEFAULT = 110;

export function loadLift(): number {
  const n = Number(read(LIFT_KEY));
  return Number.isFinite(n) && n >= 30 && n <= 240 ? n : LIFT_DEFAULT;
}

export const saveLift = (px: number): void => write(LIFT_KEY, String(Math.round(px)));

const LOOK_KEY = "cosmic-dodger:look";
const FAR_KEY = "cosmic-dodger:v2:far";

export interface Look {
  ship: string;
  color: string;
  theme: string;
}

export const DEFAULT_LOOK: Look = { ship: "dart", color: "theme", theme: "auto" };

export function loadLook(): Look {
  try {
    const data: unknown = JSON.parse(read(LOOK_KEY) ?? "null");
    if (typeof data === "object" && data !== null) {
      const d = data as Record<string, unknown>;
      return {
        ship: typeof d.ship === "string" ? d.ship : DEFAULT_LOOK.ship,
        color: typeof d.color === "string" ? d.color : DEFAULT_LOOK.color,
        theme: typeof d.theme === "string" ? d.theme : DEFAULT_LOOK.theme,
      };
    }
  } catch {
    // bad data, use the defaults
  }
  return { ...DEFAULT_LOOK };
}

export const saveLook = (look: Look): void => write(LOOK_KEY, JSON.stringify(look));

/** The furthest planet you have ever reached, 0 to 8. */
export function loadFar(): number {
  const n = Math.floor(Number(read(FAR_KEY)));
  return Number.isFinite(n) ? Math.min(8, Math.max(0, n)) : 0;
}

export const saveFar = (n: number): void => write(FAR_KEY, String(Math.min(8, Math.max(0, Math.floor(n)))));
