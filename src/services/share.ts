import { mulberry32 } from "../game/daily";
import { withAlpha } from "../game/palette";

export interface ShareData {
  tag: string;
  score: number;
  /** planets passed, 0 to 8 */
  reached: number;
  planet: string;
  won: boolean;
  /** a date like "8 Nov 2026" for the Daily Run, empty for the Journey */
  daily: string;
  time: number;
  accent: string;
  shipColor: string;
  shipPoints: [number, number][];
  site: string;
}

const W = 1080;
const H = 1350;
const SANS = "'Geist Variable', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "'Geist Mono Variable', ui-monospace, Menlo, Consolas, monospace";

const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function shareText(d: ShareData): string {
  const what = d.won ? "I made it home to Earth" : `I reached ${d.planet}`;
  const mode = d.daily ? ` on the Daily Run (${d.daily})` : "";
  return `${what} in Cosmic Dodger with ${d.score.toLocaleString("en-US")} points${mode}. Can you beat it? ${d.site}`;
}

export function drawShareCard(ctx: CanvasRenderingContext2D, d: ShareData): void {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#02030a");
  bg.addColorStop(1, "#0a1030");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const rnd = mulberry32(d.score + 7);
  ctx.fillStyle = "#f4f6ff";
  for (let i = 0; i < 110; i++) {
    ctx.globalAlpha = 0.15 + rnd() * 0.6;
    const size = 1 + rnd() * 2.4;
    ctx.fillRect(rnd() * W, rnd() * H, size, size);
  }
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(W / 2, H * 1.08, 0, W / 2, H * 1.08, H * 0.75);
  glow.addColorStop(0, withAlpha(d.accent, 0.35));
  glow.addColorStop(1, withAlpha(d.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // the player's own ship
  ctx.save();
  ctx.translate(W / 2, 250);
  ctx.scale(80, 80);
  ctx.beginPath();
  d.shipPoints.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "#0a0c15";
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineWidth = 0.1;
  ctx.strokeStyle = d.shipColor;
  ctx.shadowColor = d.shipColor;
  ctx.shadowBlur = 40;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#6b7190";
  ctx.font = `500 28px ${SANS}`;
  ctx.fillText("NEON GRAVITY", W / 2, 420);

  ctx.fillStyle = "#f4f6ff";
  ctx.font = `650 72px ${SANS}`;
  ctx.fillText("Cosmic Dodger", W / 2, 500);

  ctx.font = `600 210px ${MONO}`;
  ctx.fillText(d.score.toLocaleString("en-US"), W / 2, 740);

  ctx.fillStyle = "#a7adc9";
  ctx.font = `500 48px ${SANS}`;
  ctx.fillText(d.won ? "Made it home to Earth" : `Reached ${d.planet}`, W / 2, 830);

  // one dot per planet, filled up to the furthest one you reached
  const gap = 96;
  const left = W / 2 - 3.5 * gap;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(left + i * gap, 930, 16, 0, Math.PI * 2);
    if (i < d.reached) {
      ctx.fillStyle = d.accent;
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#a7adc9";
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText(d.daily ? `Daily Run · ${d.daily}` : "The Journey", W / 2, 1020);
  ctx.fillText(`${d.tag} · ${mmss(d.time)}`, W / 2, 1070);

  ctx.fillStyle = "#f4f6ff";
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText("Can you beat it?", W / 2, 1245);
  ctx.fillStyle = d.accent;
  ctx.font = `500 32px ${SANS}`;
  ctx.fillText(d.site, W / 2, 1295);
}

export async function renderShareBlob(d: ShareData): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    await Promise.all([document.fonts.load(`600 100px ${MONO}`), document.fonts.load(`650 100px ${SANS}`)]);
  } catch {
    // the fonts are a nice extra, the card works without them
  }
  drawShareCard(ctx, d);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

/** Opens the phone's share sheet with the card, or saves the image on a computer. */
export async function shareRun(d: ShareData): Promise<string> {
  const text = shareText(d);
  try {
    const blob = await renderShareBlob(d);
    if (blob) {
      const file = new File([blob], "cosmic-dodger.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return "Shared";
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cosmic-dodger.png";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      await navigator.clipboard?.writeText(text).catch(() => undefined);
      return "Image saved";
    }
    if (navigator.share) {
      await navigator.share({ text });
      return "Shared";
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "";
  }
  return "Could not share";
}
