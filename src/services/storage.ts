const BEST_KEY = "cosmic-dodger:best";
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
