import { STAGES } from "./journey";

export interface ShipShape {
  id: string;
  name: string;
  /** corner points, in units of the ship radius */
  points: [number, number][];
  /** how many planets you must have reached to use it */
  at: number;
}

export interface ShipColor {
  id: string;
  name: string;
  /** empty means: use the theme accent */
  hex: string;
  at: number;
}

const circle = (n: number, r: number): [number, number][] =>
  Array.from({ length: n }, (_, i): [number, number] => [
    Math.cos((i / n) * Math.PI * 2) * r,
    Math.sin((i / n) * Math.PI * 2) * r,
  ]);

const DART: ShipShape = {
  id: "dart",
  name: "Dart",
  points: [[0, -1.3], [0.95, 0.95], [0, 0.45], [-0.95, 0.95]],
  at: 0,
};

// every ship has the same hitbox, so the shape is only for looks
export const SHIPS: ShipShape[] = [
  DART,
  { id: "needle", name: "Needle", points: [[0, -1.6], [0.45, 0.9], [0, 0.5], [-0.45, 0.9]], at: 2 },
  { id: "chevron", name: "Chevron", points: [[0, -1.2], [1.1, 1.0], [0, 0.3], [-1.1, 1.0]], at: 4 },
  {
    id: "plane",
    name: "Paper plane",
    points: [[0, -1.4], [1.0, 0.9], [0.15, 0.55], [0, 1.0], [-0.15, 0.55], [-1.0, 0.9]],
    at: 6,
  },
  {
    id: "comet",
    name: "Comet",
    points: [[0, -1.2], [0.8, 0.2], [0.5, 1.1], [0, 0.7], [-0.5, 1.1], [-0.8, 0.2]],
    at: 7,
  },
  { id: "orb", name: "Orb", points: circle(14, 1.05), at: 8 },
];

export const COLORS: ShipColor[] = [
  { id: "theme", name: "Theme", hex: "", at: 0 },
  { id: "cyan", name: "Cyan", hex: "#1ee6ff", at: 0 },
  { id: "violet", name: "Violet", hex: "#8b5cff", at: 0 },
  { id: "lime", name: "Lime", hex: "#b6ff3d", at: 1 },
  { id: "gold", name: "Gold", hex: "#ffc94d", at: 5 },
  { id: "ice", name: "Ice", hex: "#e8f0ff", at: 8 },
];

export const shipById = (id: string): ShipShape => SHIPS.find((s) => s.id === id) ?? DART;

export const colorById = (id: string): ShipColor =>
  COLORS.find((c) => c.id === id) ?? { id: "theme", name: "Theme", hex: "", at: 0 };

export const isUnlocked = (at: number, planetsReached: number): boolean => planetsReached >= at;

export const unlockHint = (at: number): string => `Reach ${STAGES[at - 1]?.name ?? "Earth"}`;

/** Names of everything that opens up when your furthest planet goes from `before` to `after`. */
export function unlockedNames(before: number, after: number): string[] {
  const ships = SHIPS.filter((s) => s.at > before && s.at <= after).map((s) => `${s.name} ship`);
  const colors = COLORS.filter((c) => c.at > before && c.at <= after).map((c) => `${c.name} colour`);
  return [...ships, ...colors];
}

/** Shared with the result screens, set when a run ends. */
export const unlockNotes = { text: "" };
