import type { Game } from "@/game/game";
import { find, html, showPanel, type Panel } from "./dom";

export function createPause(game: Game): Panel {
  const el = html<HTMLElement>(`
    <section class="panel dim" data-open="false" inert>
      <div class="card glass glass-strong">
        <p class="item eyebrow">Paused</p>
        <h2 class="item heading">Take a breath</h2>
        <button class="item btn btn-primary" type="button">Resume</button>
        <p class="item hint">or press Esc</p>
      </div>
    </section>`);

  const button = find<HTMLButtonElement>(el, ".btn-primary");
  button.addEventListener("click", () => game.resume());

  return {
    el,
    setOpen(open) {
      showPanel(el, open);
      if (open) button.focus({ preventScroll: true });
    },
  };
}
