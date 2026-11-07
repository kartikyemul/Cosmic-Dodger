import type { Game } from "@/game/game";

/** Switches between the Journey and the Daily Run from a result card. */
export function createModeButton(game: Game): { el: HTMLButtonElement; sync: () => void } {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "item btn btn-ghost";
  const sync = (): void => {
    el.textContent = game.mode === "daily" ? "Play the Journey" : "Daily Run";
  };
  el.addEventListener("click", () => game.start(game.mode === "daily" ? "classic" : "daily"));
  sync();
  return { el, sync };
}
