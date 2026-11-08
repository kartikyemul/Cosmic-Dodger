import { RESTART_DELAY_MS, type Game } from "@/game/game";
import { unlockNotes } from "@/game/ships";
import { countUp, find, hangarButton, html, pad, showPanel, type Panel } from "./dom";
import { createModeButton } from "./mode-button";
import { notes } from "./notes";
import { createShareButton } from "./share-button";
import { renderRuns } from "./runs";

export function createGameOver(game: Game): Panel {
  const el = html<HTMLElement>(`
    <section class="panel dim" data-open="false" inert>
      <div class="card glass glass-strong">
        <p class="item eyebrow">Run over</p>
        <p class="item final-score numeric">000000</p>
        <p class="item badge" data-show="false">New best</p>
        <p class="item unlock" data-show="false"></p>
        <p class="item daily-line" data-show="false"></p>
        <p class="item hint nudge" data-show="false"></p>
        <p class="item hint">Best <span class="numeric best-value">000000</span></p>
        <ol class="item runs" data-empty="true" aria-label="Your best runs"></ol>
        <button class="item btn btn-primary" type="button">Play again</button>
        <p class="item hint">or press Space</p>
      </div>
    </section>`);

  const scoreEl = find<HTMLElement>(el, ".final-score");
  const bestEl = find<HTMLElement>(el, ".best-value");
  const badge = find<HTMLElement>(el, ".badge");
  const runsEl = find<HTMLElement>(el, ".runs");
  const unlockEl = find<HTMLElement>(el, ".unlock");
  const dailyEl = find<HTMLElement>(el, ".daily-line");
  const nudgeEl = find<HTMLElement>(el, ".nudge");
  const mode = createModeButton(game);
  const button = find<HTMLButtonElement>(el, ".btn-primary");
  button.after(mode.el);
  mode.el.after(hangarButton());
  button.after(createShareButton(game));
  let timer = 0;

  button.addEventListener("click", () => game.start());

  return {
    el,
    setOpen(open) {
      showPanel(el, open);
      window.clearTimeout(timer);
      if (!open) return;

      countUp(scoreEl, game.score);
      bestEl.textContent = pad(game.best);
      badge.dataset.show = String(game.newBest);
      unlockEl.textContent = unlockNotes.text;
      unlockEl.dataset.show = String(unlockNotes.text !== "");
      dailyEl.textContent = notes.daily;
      dailyEl.dataset.show = String(notes.daily !== "");
      nudgeEl.textContent = notes.nudge;
      nudgeEl.dataset.show = String(notes.nudge !== "");
      mode.sync();
      renderRuns(runsEl);
      button.disabled = true;
      timer = window.setTimeout(() => {
        button.disabled = false;
        button.focus({ preventScroll: true });
      }, RESTART_DELAY_MS);
    },
  };
}
