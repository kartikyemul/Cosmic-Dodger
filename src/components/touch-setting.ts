import type { Game } from "@/game/game";
import { saveLift } from "@/services/storage";
import { html } from "./dom";

const OPTIONS = [
  { label: "Near", lift: 70 },
  { label: "Medium", lift: 110 },
  { label: "Far", lift: 150 },
];

export function createTouchSetting(game: Game): { el: HTMLElement; sync: () => void } {
  const el = html<HTMLElement>(`
    <div class="item touch-setting" role="group" aria-label="Finger distance">
      <span class="field-label">Finger distance</span>
      <div class="seg">${OPTIONS.map((o) => `<button type="button" data-lift="${o.lift}">${o.label}</button>`).join("")}</div>
    </div>`);
  const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("button"));

  const sync = (): void => {
    const closest = OPTIONS.reduce((a, b) =>
      Math.abs(b.lift - game.touchLift) < Math.abs(a.lift - game.touchLift) ? b : a,
    );
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.lift) === closest.lift)));
  };

  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      game.touchLift = Number(b.dataset.lift);
      saveLift(game.touchLift);
      sync();
    }),
  );
  sync();
  return { el, sync };
}
