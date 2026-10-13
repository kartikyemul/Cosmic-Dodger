import { RESTART_DELAY_MS, type Game } from "@/game/game";
import { find, html, pad, showPanel, type Panel } from "./dom";

export function createGameOver(game: Game): Panel {
  const el = html<HTMLElement>(`
    <section class="panel dim" data-open="false" inert>
      <div class="card glass glass-strong">
        <p class="item eyebrow">Run over</p>
        <p class="item final-score numeric">000000</p>
        <p class="item badge" data-show="false">New best</p>
        <p class="item hint">Best <span class="numeric best-value">000000</span></p>
        <button class="item btn btn-primary" type="button">Play again</button>
        <p class="item hint">or press Space</p>
      </div>
    </section>`);

  const scoreEl = find<HTMLElement>(el, ".final-score");
  const bestEl = find<HTMLElement>(el, ".best-value");
  const badge = find<HTMLElement>(el, ".badge");
  const button = find<HTMLButtonElement>(el, ".btn-primary");
  let timer = 0;

  button.addEventListener("click", () => game.start());

  return {
    el,
    setOpen(open) {
      showPanel(el, open);
      window.clearTimeout(timer);
      if (!open) return;

      scoreEl.textContent = pad(game.score);
      bestEl.textContent = pad(game.best);
      badge.dataset.show = String(game.newBest);
      button.disabled = true;
      timer = window.setTimeout(() => {
        button.disabled = false;
        button.focus({ preventScroll: true });
      }, RESTART_DELAY_MS);
    },
  };
}
