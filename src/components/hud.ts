import { WIN_SCORE, type Game } from "@/game/game";
import { audio } from "@/game/audio";
import { nextStage } from "@/game/journey";
import { find, html, pad, showPanel } from "./dom";

export interface Hud {
  el: HTMLElement;
  setOpen: (open: boolean) => void;
  setScore: (score: number) => void;
}

export function createHud(game: Game): Hud {
  const el = html<HTMLElement>(`
    <div class="hud" data-open="false" inert>
      <button class="icon-btn mute glass" type="button" aria-label="Mute">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor"
          stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7h3l4-3v10l-4-3H3z" />
          <path d="M13 6.5a4 4 0 0 1 0 5" />
          <path class="slash" d="M3 15L15 3" />
        </svg>
      </button>
      <div class="hud-center">
        <div class="glass pill score numeric">000000</div>
        <div class="track"><div class="track-fill"></div></div>
        <div class="best-line">Next <span class="next-name">Neptune</span> · Best <span class="numeric best-value">000000</span></div>
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
  const fill = find<HTMLElement>(el, ".track-fill");
  const nextEl = find<HTMLElement>(el, ".next-name");
  find<HTMLButtonElement>(el, ".icon-btn:not(.mute)").addEventListener("click", () => game.pause());

  const mute = find<HTMLButtonElement>(el, ".mute");
  const syncMute = (): void => {
    mute.dataset.muted = String(audio.muted);
    mute.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
  };
  mute.addEventListener("click", () => audio.toggleMute());
  audio.onChange = syncMute;
  syncMute();

  const setScore = (score: number): void => {
    scoreEl.textContent = pad(score);
    bestEl.textContent = pad(Math.max(game.best, score));
    fill.style.transform = `scaleX(${Math.min(1, score / WIN_SCORE)})`;
    nextEl.textContent = nextStage(score / WIN_SCORE).name;
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
