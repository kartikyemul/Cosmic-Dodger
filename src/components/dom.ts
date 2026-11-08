export interface Panel {
  el: HTMLElement;
  setOpen: (open: boolean) => void;
}

export function html<T extends HTMLElement>(markup: string): T {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild as T;
}

export function find<T extends Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found;
}

export function showPanel(el: HTMLElement, open: boolean): void {
  el.dataset.open = String(open);
  el.toggleAttribute("inert", !open);
}

export const pad = (n: number): string => String(n).padStart(6, "0");

export function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function hangarButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "item btn btn-ghost";
  button.textContent = "Hangar";
  button.addEventListener("click", () => window.dispatchEvent(new Event("open-hangar")));
  return button;
}

/** Rolls a score up from zero, the way arcade machines do. */
export function countUp(el: HTMLElement, to: number, ms = 800): void {
  if (to <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = pad(to);
    return;
  }
  const start = performance.now();
  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = pad(t === 1 ? to : Math.round((to * eased) / 10) * 10);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
