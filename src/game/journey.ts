// the trip home: eight planets, evenly spaced. Earth is the last one.
const NAMES = ["Neptune", "Uranus", "Saturn", "Jupiter", "Mars", "Venus", "Mercury", "Earth"];

export interface Stage {
  name: string;
  /** progress (0 to 1) at which you reach this planet */
  at: number;
}

export const STAGES: Stage[] = NAMES.map((name, i) => ({ name, at: (i + 1) / NAMES.length }));

export function nextStage(progress: number): Stage {
  return STAGES.find((s) => s.at > progress) ?? STAGES[STAGES.length - 1] ?? { name: "Earth", at: 1 };
}

export const passedStages = (progress: number): number => STAGES.filter((s) => s.at <= progress).length;

/** How many points are left until the next planet. */
export function pointsToNext(progress: number, finalScore: number): { name: string; points: number } {
  const stage = nextStage(progress);
  return { name: stage.name, points: Math.max(0, Math.round((stage.at - progress) * finalScore)) };
}
