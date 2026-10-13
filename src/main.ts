import "./style.css";
import { initAmbientLight } from "@/components/ambient-light";
import { Game } from "@/game/game";
import { loadPalette } from "@/game/palette";

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
if (!canvas) throw new Error("Could not find <canvas id=\"stage\"> in index.html");

initAmbientLight();

const game = new Game(canvas, loadPalette(), {
  // Step 3 will use this to show and hide the glass overlays.
  onStateChange: (state, score) => console.info(`[game] ${state}`, score),
});

const fit = (): void => game.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
window.addEventListener("resize", fit);
fit();
game.run();
