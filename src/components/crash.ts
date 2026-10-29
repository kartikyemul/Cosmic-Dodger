import { find, html, showPanel, type Panel } from "./dom";

export function createCrash(): Panel {
  const el = html<HTMLElement>(`
    <section class="panel dim" data-open="false" inert>
      <div class="card glass glass-strong">
        <p class="item eyebrow">Something went wrong</p>
        <h2 class="item heading">The game hit a problem</h2>
        <p class="item blurb">Your best score is safe. Reload to keep playing.</p>
        <button class="item btn btn-primary" type="button">Reload</button>
      </div>
    </section>`);

  find<HTMLButtonElement>(el, ".btn-primary").addEventListener("click", () => window.location.reload());
  return { el, setOpen: (open) => showPanel(el, open) };
}
