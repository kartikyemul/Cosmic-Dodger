import { WIN_CARD_DELAY_MS, type Game } from "@/game/game";
import { find, formatTime, html, pad, showPanel, type Panel } from "./dom";

export function createVictory(game: Game): Panel {
  const el = html<HTMLElement>(`
    <section class="panel dim" data-open="false" inert>
      <div class="card glass glass-strong">
        <p class="item eyebrow">Journey complete</p>
        <h2 class="item title">You made it home</h2>
        <p class="item final-score numeric">100000</p>
        <p class="item badge" data-show="false">New best</p>
        <p class="item hint">Flight time <span class="numeric time">0:00</span> · Best <span class="numeric best-value">000000</span></p>
        <button class="item btn btn-primary" type="button">Fly again</button>
      </div>
    </section>`);

  const scoreEl = find<HTMLElement>(el, ".final-score");
  const timeEl = find<HTMLElement>(el, ".time");
  const bestEl = find<HTMLElement>(el, ".best-value");
  const badge = find<HTMLElement>(el, ".badge");
  const button = find<HTMLButtonElement>(el, ".btn-primary");
  let timer = 0;

  button.addEventListener("click", () => game.start());

  return {
    el,
    setOpen(open) {
      window.clearTimeout(timer);
      if (!open) {
        showPanel(el, false);
        return;
      }
      scoreEl.textContent = pad(game.score);
      timeEl.textContent = formatTime(game.elapsed);
      bestEl.textContent = pad(game.best);
      badge.dataset.show = String(game.newBest);
      button.disabled = true;
      // give the arrival a few quiet seconds before the card appears
      timer = window.setTimeout(() => {
        showPanel(el, true);
        button.disabled = false;
        button.focus({ preventScroll: true });
      }, WIN_CARD_DELAY_MS);
    },
  };
}
