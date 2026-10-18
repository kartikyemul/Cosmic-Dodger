import { loadMuted, saveMuted } from "@/services/storage";

type Sound = "start" | "over" | "win";

let ctx: AudioContext | null = null;
let muted = loadMuted();

function unlock(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // no audio support, the game just stays quiet
  }
}

function tone(freq: number, at: number, length: number, type: OscillatorType, volume: number, endFreq = freq): void {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

// browsers only allow sound after the player has touched the page once
window.addEventListener("pointerdown", unlock, { once: true });
window.addEventListener("keydown", unlock, { once: true });
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM" && !(e.target instanceof HTMLInputElement)) audio.toggleMute();
});

export const audio = {
  onChange: null as (() => void) | null,

  get muted(): boolean {
    return muted;
  },

  toggleMute(): void {
    muted = !muted;
    saveMuted(muted);
    audio.onChange?.();
  },

  play(sound: Sound): void {
    if (muted) return;
    try {
      unlock();
      if (sound === "start") {
        tone(440, 0, 0.09, "sine", 0.12, 660);
        tone(660, 0.08, 0.12, "sine", 0.12, 880);
      } else if (sound === "over") {
        tone(300, 0, 0.45, "sawtooth", 0.1, 70);
        tone(150, 0, 0.5, "square", 0.05, 50);
      } else {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.16, 0.5, "sine", 0.12));
      }
    } catch {
      // sound is a bonus, never let it break the game
    }
  },
};
