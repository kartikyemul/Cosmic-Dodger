import type { Game } from "@/game/game";
import { COLORS, SHIPS, colorById, isUnlocked, shipById, unlockHint } from "@/game/ships";
import { loadFar, loadLook, saveLook } from "@/services/storage";
import { find, html, showPanel, type Panel } from "./dom";

export interface Hangar extends Panel {
  isOpen: () => boolean;
}

const shipSvg = (points: [number, number][]): string =>
  `<svg viewBox="-1.8 -1.8 3.6 3.6" aria-hidden="true"><polygon points="${points
    .map(([x, y]) => `${x},${y}`)
    .join(" ")}" fill="#0a0c15" stroke="currentColor" stroke-width="0.14" stroke-linejoin="round" /></svg>`;

const LOCK =
  '<svg class="lock" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="5.5" width="8" height="5.5" rx="1.4" fill="currentColor" /><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" stroke-width="1.3" /></svg>';

export function createHangar(game: Game): Hangar {
  const el = html<HTMLElement>(`
    <section class="panel dim" data-open="false" inert>
      <div class="card glass glass-strong hangar">
        <p class="item eyebrow">Hangar</p>
        <div class="item preview" aria-hidden="true"></div>
        <div class="item group">
          <span class="field-label">Ship</span>
          <div class="choices" data-row="ship"></div>
        </div>
        <div class="item group">
          <span class="field-label">Colour</span>
          <div class="choices" data-row="color"></div>
        </div>
        <p class="item hint hangar-hint" aria-live="polite"></p>
        <button class="item btn btn-primary" type="button">Done</button>
      </div>
    </section>`);

  const preview = find<HTMLElement>(el, ".preview");
  const shipRow = find<HTMLElement>(el, '[data-row="ship"]');
  const colorRow = find<HTMLElement>(el, '[data-row="color"]');
  const hint = find<HTMLElement>(el, ".hangar-hint");
  const done = find<HTMLButtonElement>(el, ".btn-primary");

  let look = loadLook();
  let open = false;

  const render = (): void => {
    const far = loadFar();
    preview.style.color = colorById(look.color).hex || game.palette.cyan;
    preview.innerHTML = shipSvg(shipById(look.ship).points);

    shipRow.innerHTML = SHIPS.map((s) => {
      const locked = !isUnlocked(s.at, far);
      return `<button class="choice" type="button" data-ship="${s.id}" aria-pressed="${s.id === look.ship}" data-locked="${locked}" aria-label="${s.name}${locked ? ", locked" : ""}" title="${s.name}">${shipSvg(s.points)}${locked ? LOCK : ""}</button>`;
    }).join("");

    colorRow.innerHTML = COLORS.map((c) => {
      const locked = !isUnlocked(c.at, far);
      return `<button class="choice swatch" type="button" data-color="${c.id}" aria-pressed="${c.id === look.color}" data-locked="${locked}" aria-label="${c.name}${locked ? ", locked" : ""}" title="${c.name}" style="--swatch:${c.hex || game.palette.cyan}"><span></span>${locked ? LOCK : ""}</button>`;
    }).join("");
  };

  el.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const shipButton = target?.closest<HTMLElement>("[data-ship]");
    const colorButton = target?.closest<HTMLElement>("[data-color]");
    const far = loadFar();

    if (shipButton) {
      const ship = shipById(shipButton.dataset.ship ?? "");
      if (!isUnlocked(ship.at, far)) {
        hint.textContent = `${unlockHint(ship.at)} to unlock the ${ship.name}.`;
        return;
      }
      look = { ...look, ship: ship.id };
      game.setShip(ship.id);
    } else if (colorButton) {
      const color = colorById(colorButton.dataset.color ?? "");
      if (!isUnlocked(color.at, far)) {
        hint.textContent = `${unlockHint(color.at)} to unlock ${color.name}.`;
        return;
      }
      look = { ...look, color: color.id };
      game.setShipColor(color.id);
    } else {
      return;
    }
    saveLook(look);
    hint.textContent = "";
    render();
  });

  const setOpen = (value: boolean): void => {
    open = value;
    showPanel(el, value);
    if (!value) return;
    look = loadLook();
    hint.textContent = "";
    render();
    done.focus({ preventScroll: true });
  };

  done.addEventListener("click", () => setOpen(false));
  window.addEventListener("open-hangar", () => setOpen(true));

  // while the hangar is open, Esc closes it and Space/Enter must not start the game underneath
  window.addEventListener(
    "keydown",
    (e) => {
      if (!open) return;
      if (e.code === "Escape") {
        e.stopImmediatePropagation();
        setOpen(false);
      } else if (e.code === "Space" || e.code === "Enter") {
        e.stopImmediatePropagation();
      }
    },
    true,
  );

  return { el, setOpen, isOpen: () => open };
}
