export interface DailyState {
  /** the day the best below belongs to */
  day: string;
  best: number;
  time: number;
  tries: number;
  streak: number;
  /** the last day a daily run was played */
  last: string;
}

export const EMPTY_DAILY: DailyState = { day: "", best: 0, time: 0, tries: 0, streak: 0, last: "" };

const two = (n: number): string => String(n).padStart(2, "0");

export const dayKey = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;

export const yesterdayKey = (date: Date = new Date()): string =>
  dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));

/** Turns a day like "2026-11-08" into a number, so every player gets the same seed that day. */
export function seedFromKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A small random number generator: the same seed always gives the same numbers. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function recordDaily(prev: DailyState, today: string, yesterday: string, score: number, time: number): DailyState {
  const sameDay = prev.day === today;
  const bestBefore = sameDay ? prev.best : 0;
  const improved = score > bestBefore;
  const streak = prev.last === today ? prev.streak : prev.last === yesterday ? prev.streak + 1 : 1;
  return {
    day: today,
    best: improved ? score : bestBefore,
    time: improved ? time : sameDay ? prev.time : 0,
    tries: (sameDay ? prev.tries : 0) + 1,
    streak,
    last: today,
  };
}

/** The streak to show: it is lost if you skipped yesterday. */
export const currentStreak = (state: DailyState, today: string, yesterday: string): number =>
  state.last === today || state.last === yesterday ? state.streak : 0;
