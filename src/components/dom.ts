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
