import { loadRuns } from "@/services/storage";
import { pad } from "./dom";

export function renderRuns(list: HTMLElement): void {
  const runs = loadRuns();
  list.dataset.empty = String(runs.length === 0);
  list.replaceChildren(
    ...runs.map((run, i) => {
      const li = document.createElement("li");
      for (const text of [String(i + 1), run.tag, pad(run.score)]) {
        const span = document.createElement("span");
        span.textContent = text;
        li.append(span);
      }
      return li;
    }),
  );
}
