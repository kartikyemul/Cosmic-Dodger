import type { Game } from "@/game/game";
import { loadTag, saveTag } from "@/services/storage";
import { cleanTag, isValidTag, randomTag, TAG_MAX, TAG_MIN } from "@/services/tag";
import { find, html, pad, showPanel, type Panel } from "./dom";

export interface StartScreen extends Panel {
  confirmTag: () => boolean;
  getTag: () => string;
}

export function createStartScreen(game: Game): StartScreen {
  const el = html<HTMLElement>(`
    <section class="panel" data-open="true">
      <div class="card glass glass-strong">
        <p class="item eyebrow">Neon Gravity</p>
        <h1 class="item title">Cosmic Dodger</h1>
        <p class="item blurb">Drag, move your mouse or use the arrow keys. Dodge the pink rocks and stay out of the violet pull.</p>
        <label class="item tag-field">
          <span class="field-label">Your tag</span>
          <input class="tag-input numeric" type="text" maxlength="${TAG_MAX}" autocomplete="off"
            autocapitalize="characters" spellcheck="false"
            aria-label="Your arcade tag, ${TAG_MIN} to ${TAG_MAX} characters" />
          <span class="field-hint">${TAG_MIN} to ${TAG_MAX} letters, numbers, _ or -</span>
        </label>
        <button class="item btn btn-primary" type="button">Play</button>
        <p class="item hint">Best <span class="numeric best-value">000000</span></p>
      </div>
    </section>`);

  const input = find<HTMLInputElement>(el, ".tag-input");
  const playButton = find<HTMLButtonElement>(el, ".btn-primary");
  const bestValue = find<HTMLElement>(el, ".best-value");

  const saved = cleanTag(loadTag());
  input.value = isValidTag(saved) ? saved : randomTag();
  bestValue.textContent = pad(game.best);

  input.addEventListener("input", () => {
    input.value = cleanTag(input.value);
    input.removeAttribute("aria-invalid");
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") game.start();
  });
  playButton.addEventListener("click", () => game.start());

  return {
    el,
    setOpen(open) {
      showPanel(el, open);
      if (open) bestValue.textContent = pad(game.best);
    },
    confirmTag() {
      const tag = cleanTag(input.value);
      input.value = tag;
      if (!isValidTag(tag)) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return false;
      }
      saveTag(tag);
      return true;
    },
    getTag: () => cleanTag(input.value),
  };
}
