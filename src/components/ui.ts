import "./ui.css";
import { audio } from "@/game/audio";
import type { Game } from "@/game/game";
import type { GameState } from "@/game/types";
import { addRun, saveBest } from "@/services/storage";
import { createGameOver } from "./game-over";
import { createHud } from "./hud";
import { createPause } from "./pause";
import { createStartScreen } from "./start-screen";
import { createVictory } from "./victory";

export function mountUi(root: HTMLElement, game: Game): void {
  const start = createStartScreen(game);
  const hud = createHud(game);
  const over = createGameOver(game);
  const pause = createPause(game);
  const victory = createVictory(game);
  root.append(hud.el, start.el, over.el, pause.el, victory.el);

  let last: GameState = game.state;

  const show = (state: GameState): void => {
    if (state === "over" || state === "won") {
      if (game.score > 0) addRun({ tag: start.getTag(), score: game.score, time: game.elapsed });
      if (game.newBest) saveBest(game.best);
    }
    if (state === "playing" && last !== "paused") audio.play("start");
    if (state === "over") audio.play("over");
    if (state === "won") audio.play("win");
    last = state;

    start.setOpen(state === "ready");
    hud.setOpen(state === "playing" || state === "paused");
    over.setOpen(state === "over");
    pause.setOpen(state === "paused");
    victory.setOpen(state === "won");
  };

  game.canStart = () => start.confirmTag();
  game.onScore = (score) => hud.setScore(score);
  game.onStateChange = show;
  show(game.state);
}
