import "./ui.css";
import { audio } from "@/game/audio";
import { WIN_SCORE, type Game } from "@/game/game";
import { passedStages, STAGES } from "@/game/journey";
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
  let passed = 0;

  const show = (state: GameState): void => {
    if (state === "over" || state === "won") {
      if (game.score > 0) addRun({ tag: start.getTag(), score: game.score, time: game.elapsed });
      if (game.newBest) saveBest(game.best);
    }
    if (state === "playing" && last !== "paused") {
      audio.play("start");
      passed = 0;
    }
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
  game.onScore = (score) => {
    hud.setScore(score);
    const count = passedStages(score / WIN_SCORE);
    if (count > passed && count < STAGES.length) audio.play("planet");
    passed = count;
  };
  game.onStateChange = show;
  show(game.state);
}
