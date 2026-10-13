export const TAG_MIN = 3;
export const TAG_MAX = 12;

const TAG_PATTERN = new RegExp(`^[A-Z0-9_-]{${TAG_MIN},${TAG_MAX}}$`);
const SAMPLES = ["ACE", "ZAP", "KAI", "REX", "NEO", "VEX", "ZEN", "ORB", "JET", "LUX", "RAY", "ION", "FOX"];

export const cleanTag = (raw: string): string =>
  raw.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, TAG_MAX);

export const isValidTag = (tag: string): boolean => TAG_PATTERN.test(tag);

export function randomTag(): string {
  return SAMPLES[Math.floor(Math.random() * SAMPLES.length)] ?? "ACE";
}
