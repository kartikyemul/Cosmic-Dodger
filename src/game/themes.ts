export type DecorKind = "none" | "snow" | "embers" | "lanterns" | "confetti" | "leaves" | "twinkle";
type RGB = [number, number, number];

export interface Theme {
  id: string;
  name: string;
  /** shown above the title on the start screen */
  greeting: string;
  /** main UI and ship colour */
  accent: string;
  /** second glow colour, used for gravity wells and the title */
  accent2: string;
  /** soft colour wash over deep space, null for none */
  tint: RGB | null;
  decor: DecorKind;
  /** colours of the floating decorations */
  colors: string[];
}

// the rocks always stay pink, so they are easy to read in every theme
export const DEFAULT_THEME: Theme = {
  id: "default",
  name: "Deep Space",
  greeting: "Neon Gravity",
  accent: "#1ee6ff",
  accent2: "#8b5cff",
  tint: null,
  decor: "none",
  colors: [],
};

export const THEMES: Theme[] = [
  DEFAULT_THEME,
  {
    id: "winter", name: "Winter Lights", greeting: "Happy Holidays",
    accent: "#9fd8ff", accent2: "#ffd479", tint: [90, 140, 220], decor: "snow", colors: ["#ffffff", "#cfe9ff"],
  },
  {
    id: "halloween", name: "Haunted Night", greeting: "Happy Halloween",
    accent: "#ff8a2a", accent2: "#9b5cff", tint: [120, 50, 160], decor: "embers", colors: ["#ff8a2a", "#ffb347", "#b57bff"],
  },
  {
    id: "diwali", name: "Diwali Lights", greeting: "Happy Diwali",
    accent: "#ffb830", accent2: "#ff7a1a", tint: [160, 90, 20], decor: "lanterns", colors: ["#ffb830", "#ff7a1a", "#ffd479"],
  },
  {
    id: "holi", name: "Festival of Colours", greeting: "Happy Holi",
    accent: "#ffd23f", accent2: "#3fd0ff", tint: null, decor: "confetti", colors: ["#ff6fb5", "#ffd23f", "#3fd0ff", "#b6ff3d", "#a78bfa"],
  },
  {
    id: "lunar", name: "Lunar New Year", greeting: "Happy Lunar New Year",
    accent: "#ffcf4a", accent2: "#ff5a4d", tint: [150, 30, 30], decor: "lanterns", colors: ["#ff5a4d", "#ffcf4a"],
  },
  {
    id: "eid", name: "Eid Nights", greeting: "Eid Mubarak",
    accent: "#7ee0a8", accent2: "#ffd479", tint: [20, 90, 80], decor: "twinkle", colors: ["#ffd479", "#bff5d6"],
  },
  {
    id: "pride", name: "Pride", greeting: "Happy Pride",
    accent: "#1ee6ff", accent2: "#a78bfa", tint: null, decor: "confetti", colors: ["#ff5d5d", "#ff9f40", "#ffd23f", "#4ade80", "#38bdf8", "#a78bfa"],
  },
  {
    id: "earth", name: "Earth Week", greeting: "Happy Earth Week",
    accent: "#6fe08a", accent2: "#38bdf8", tint: [20, 90, 50], decor: "leaves", colors: ["#6fe08a", "#3fb56a", "#a7f3a0"],
  },
];

// same dates every year, "MM-DD" (a window may cross New Year)
const FIXED = [
  { id: "winter", from: "12-15", to: "01-03" },
  { id: "halloween", from: "10-24", to: "11-01" },
  { id: "pride", from: "06-01", to: "06-30" },
  { id: "earth", from: "04-18", to: "04-24" },
];

// festivals that move every year, "YYYY-MM-DD". Check the dates and add next year's before they pass.
// Eid depends on the moon, so it is only available by choosing it in the Hangar.
const MOVING = [
  { id: "diwali", from: "2026-11-04", to: "2026-11-11" },
  { id: "lunar", from: "2027-02-03", to: "2027-02-13" },
  { id: "holi", from: "2027-03-19", to: "2027-03-25" },
  { id: "diwali", from: "2027-10-26", to: "2027-11-02" },
];

const two = (n: number): string => String(n).padStart(2, "0");

/** The theme that matches today's date, or "default". */
export function autoThemeId(date: Date): string {
  const md = `${two(date.getMonth() + 1)}-${two(date.getDate())}`;
  const iso = `${date.getFullYear()}-${md}`;

  const moving = MOVING.find((w) => iso >= w.from && iso <= w.to);
  if (moving) return moving.id;

  const fixed = FIXED.find((w) => (w.from <= w.to ? md >= w.from && md <= w.to : md >= w.from || md <= w.to));
  return fixed?.id ?? "default";
}

/** choice is "auto", "off" or a theme id */
export function pickTheme(choice: string, date: Date): Theme {
  if (choice === "off") return DEFAULT_THEME;
  const id = choice === "auto" ? autoThemeId(date) : choice;
  return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

function hexRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Swaps the UI colours by overriding the CSS variables from style.css. */
export function applyThemeColors(theme: Theme): void {
  const style = document.documentElement.style;
  const names = ["--color-neon-cyan", "--color-neon-violet", "--shadow-glow-cyan", "--shadow-glow-violet"];
  if (theme.id === "default") {
    names.forEach((n) => style.removeProperty(n));
    return;
  }
  const glow = (hex: string): string => {
    const [r, g, b] = hexRgb(hex);
    return `0 0 24px rgb(${r} ${g} ${b} / 0.45), 0 0 80px rgb(${r} ${g} ${b} / 0.18)`;
  };
  style.setProperty("--color-neon-cyan", theme.accent);
  style.setProperty("--color-neon-violet", theme.accent2);
  style.setProperty("--shadow-glow-cyan", glow(theme.accent));
  style.setProperty("--shadow-glow-violet", glow(theme.accent2));
}
