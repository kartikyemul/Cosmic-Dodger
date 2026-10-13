/**
 * Canvas can't use Tailwind classes, so it reads the same CSS variables.
 * style.css stays the single source of truth for colour.
 */
const read = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

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
    void: read("--color-void"),
    ink: read("--color-ink-900"),
    cyan: read("--color-neon-cyan"),
    violet: read("--color-neon-violet"),
    magenta: read("--color-neon-magenta"),
    lime: read("--color-neon-lime"),
    text: read("--color-text-primary"),
  };
}
