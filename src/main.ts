import "./style.css";
import { initAmbientLight } from "@/components/ambient-light";
import { mountUi } from "@/components/ui";
import { Game, WIN_SCORE } from "@/game/game";
import { loadPalette } from "@/game/palette";
import { colorById, isUnlocked, shipById } from "@/game/ships";
import { loadBest, loadFar, loadLift, loadLook } from "@/services/storage";

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
const uiRoot = document.querySelector<HTMLElement>("#ui");
if (!canvas || !uiRoot) throw new Error("index.html needs #stage and #ui");

initAmbientLight();

const game = new Game(canvas, loadPalette());
game.best = Math.min(loadBest(), WIN_SCORE);
game.touchLift = loadLift();

const look = loadLook();
const far = loadFar();
game.setShip(isUnlocked(shipById(look.ship).at, far) ? look.ship : "dart");
game.setShipColor(isUnlocked(colorById(look.color).at, far) ? look.color : "theme");
mountUi(uiRoot, game);

const fit = (): void => game.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
window.addEventListener("resize", fit);
fit();
game.run();
