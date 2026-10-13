import "./ui.css";
import type { Game } from "@/game/game";
import type { GameState } from "@/game/types";
import { saveBest } from "@/services/storage";
import { createGameOver } from "./game-over";
import { createHud } from "./hud";
import { createPause } from "./pause";
import { createStartScreen } from "./start-screen";

export function mountUi(root: HTMLElement, game: Game): void {
  const start = createStartScreen(game);
  const hud = createHud(game);
  const over = createGameOver(game);
  const pause = createPause(game);
  root.append(hud.el, start.el, over.el, pause.el);

  const show = (state: GameState): void => {
    start.setOpen(state === "ready");
    hud.setOpen(state === "playing" || state === "paused");
    over.setOpen(state === "over");
    pause.setOpen(state === "paused");
    if (state === "over" && game.newBest) saveBest(game.best);
  };

  game.canStart = () => start.confirmTag();
  game.onScore = (score) => hud.setScore(score);
  game.onStateChange = show;
  show(game.state);
}
