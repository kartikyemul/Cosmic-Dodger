/**
 * Canvas can't use Tailwind classes, so it reads the same CSS variables.
 * style.css stays the single source of truth for colour.
 */
const read = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export interface Palette {
  void: string;
  ink: string;
  cyan: string;
  violet: string;
  magenta: string;
  lime: string;
  text: string;
}

export function loadPalette(): Palette {
  return {
    void: read("--color-void", "#000000"),
    ink: read("--color-ink-900", "#0a0c15"),
    cyan: read("--color-neon-cyan", "#1ee6ff"),
    violet: read("--color-neon-violet", "#8b5cff"),
    magenta: read("--color-neon-magenta", "#ff3d9a"),
    lime: read("--color-neon-lime", "#b6ff3d"),
    text: read("--color-text-primary", "#f4f6ff"),
  };
}

/** "#8b5cff" + 0.5 -> "rgba(139, 92, 255, 0.5)". Needed for canvas gradients. */
export function withAlpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  const digits = m?.[1];
  if (!digits) return hex;
  const n = parseInt(digits, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
