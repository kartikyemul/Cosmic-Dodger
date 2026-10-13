import type { Game } from "@/game/game";
import { find, html, pad, showPanel } from "./dom";

export interface Hud {
  el: HTMLElement;
  setOpen: (open: boolean) => void;
  setScore: (score: number) => void;
}

export function createHud(game: Game): Hud {
  const el = html<HTMLElement>(`
    <div class="hud" data-open="false" inert>
      <span></span>
      <div class="hud-center">
        <div class="glass pill score numeric">000000</div>
        <div class="best-line">Best <span class="numeric best-value">000000</span></div>
      </div>
      <button class="icon-btn glass" type="button" aria-label="Pause">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3" y="2" width="3.4" height="12" rx="1.2" fill="currentColor" />
          <rect x="9.6" y="2" width="3.4" height="12" rx="1.2" fill="currentColor" />
        </svg>
      </button>
    </div>`);

  const scoreEl = find<HTMLElement>(el, ".score");
  const bestEl = find<HTMLElement>(el, ".best-value");
  find<HTMLButtonElement>(el, ".icon-btn").addEventListener("click", () => game.pause());

  const setScore = (score: number): void => {
    scoreEl.textContent = pad(score);
    bestEl.textContent = pad(Math.max(game.best, score));
  };

  return {
    el,
    setScore,
    setOpen(open) {
      showPanel(el, open);
      if (open) setScore(game.score);
    },
  };
}
