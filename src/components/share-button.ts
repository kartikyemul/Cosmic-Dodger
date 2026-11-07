import { WIN_SCORE, type Game } from "@/game/game";
import { passedStages, STAGES } from "@/game/journey";
import { shareRun, type ShareData } from "@/services/share";
import { loadTag } from "@/services/storage";

export function createShareButton(game: Game): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "item btn btn-ghost";
  el.textContent = "Share";

  el.addEventListener("click", async () => {
    el.disabled = true;
    el.textContent = "Preparing…";
    const reached = passedStages(game.score / WIN_SCORE);
    const data: ShareData = {
      tag: loadTag() || "PLAYER",
      score: game.score,
      reached,
      planet: reached === 0 ? "deep space" : (STAGES[reached - 1]?.name ?? "Earth"),
      won: game.state === "won",
      daily:
        game.mode === "daily"
          ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : "",
      time: game.elapsed,
      accent: game.palette.cyan,
      shipColor: game.shipColor || game.palette.cyan,
      shipPoints: game.ship.points,
      site: window.location.host,
    };
    const result = await shareRun(data);
    el.disabled = false;
    el.textContent = result || "Share";
    if (result) window.setTimeout(() => (el.textContent = "Share"), 2200);
  });
  return el;
}
