import { CONFIG } from "@/game/config";

const SAMPLES = ["ACE", "ZAP", "KAI", "REX", "NEO", "VEX", "ZEN", "ORB", "JET", "LUX", "RAY", "ION", "FOX"];

export const cleanTag = (raw: string): string =>
  raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);

export const isValidTag = (tag: string): boolean => CONFIG.tagPattern.test(tag);

export function randomTag(): string {
  return SAMPLES[Math.floor(Math.random() * SAMPLES.length)] ?? "ACE";
}
