import "./style.css";
import { initAmbientLight } from "@/components/ambient-light";
import { loadPalette } from "@/game/palette";
import { CONFIG } from "@/game/config";

const canvas = document.querySelector<HTMLCanvasElement>("#stage")!;
const ui = document.querySelector<HTMLDivElement>("#ui")!;
const ctx = canvas.getContext("2d", { alpha: false })!;
const palette = loadPalette();

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

initAmbientLight();

// Step 1 smoke test: proves tokens, glass, fonts, and canvas are all wired.
ui.innerHTML = `
  <div class="grid h-full place-items-center p-6">
    <div class="glass glass-strong animate-rise w-full max-w-sm p-8 text-center">
      <p class="text-sm text-text-secondary">Setup complete</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">Cosmic Dodger</h1>
      <p class="numeric mt-6 text-5xl text-neon-cyan">000 000</p>
      <div class="mx-auto mt-6 h-1.5 w-24 animate-breathe rounded-full bg-neon-violet shadow-glow-violet"></div>
    </div>
  </div>`;

function frame(t: number) {
  ctx.fillStyle = palette.void;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const r = 90 + Math.sin(t / 900) * 8;
  const g = ctx.createRadialGradient(
    window.innerWidth / 2, window.innerHeight / 2, 0,
    window.innerWidth / 2, window.innerHeight / 2, r * 4,
  );
  g.addColorStop(0, `${palette.violet}55`);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
