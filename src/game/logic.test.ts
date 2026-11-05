import { describe, expect, it } from "vitest";
import { cleanTag, isValidTag } from "../services/tag";
import { nextStage, passedStages, STAGES } from "./journey";
import { smoothstep } from "./math";
import { difficulty } from "./spawner";
import { COLORS, SHIPS, shipById, unlockedNames, unlockHint } from "./ships";
import { autoThemeId, pickTheme, THEMES } from "./themes";

describe("journey", () => {
  it("has eight evenly spaced stages and Earth is last", () => {
    expect(STAGES).toHaveLength(8);
    expect(STAGES[0]?.name).toBe("Neptune");
    expect(STAGES[7]?.name).toBe("Earth");
    expect(STAGES[7]?.at).toBe(1);
    expect(STAGES[0]?.at).toBeCloseTo(0.125);
  });

  it("finds the next planet", () => {
    expect(nextStage(0).name).toBe("Neptune");
    expect(nextStage(0.13).name).toBe("Uranus");
    expect(nextStage(1).name).toBe("Earth");
  });

  it("counts planets passed", () => {
    expect(passedStages(0)).toBe(0);
    expect(passedStages(0.125)).toBe(1);
    expect(passedStages(0.99)).toBe(7);
    expect(passedStages(1)).toBe(8);
  });
});

describe("difficulty", () => {
  it("starts easy and always stays between 0 and 1", () => {
    expect(difficulty(0)).toBe(0);
    for (let p = 0; p <= 1; p += 0.01) {
      expect(difficulty(p)).toBeGreaterThanOrEqual(0);
      expect(difficulty(p)).toBeLessThanOrEqual(1);
    }
  });

  it("eases off near the end", () => {
    expect(difficulty(1)).toBeLessThan(difficulty(0.8));
  });
});

describe("tags", () => {
  it("cleans typed text", () => {
    expect(cleanTag("kartik y!")).toBe("KARTIKY");
    expect(cleanTag("a_b-c")).toBe("A_B-C");
    expect(cleanTag("abcdefghijklmnop")).toHaveLength(12);
  });

  it("accepts 3 to 12 characters only", () => {
    expect(isValidTag("AB")).toBe(false);
    expect(isValidTag("ABC")).toBe(true);
    expect(isValidTag("ABCDEFGHIJKL")).toBe(true);
    expect(isValidTag("ABCDEFGHIJKLM")).toBe(false);
    expect(isValidTag("ab c")).toBe(false);
  });
});

describe("smoothstep", () => {
  it("clamps outside the range", () => {
    expect(smoothstep(0, 1, -5)).toBe(0);
    expect(smoothstep(0, 1, 5)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
  });
});

describe("ships", () => {
  it("has unique ids and real shapes", () => {
    expect(new Set(SHIPS.map((s) => s.id)).size).toBe(SHIPS.length);
    expect(new Set(COLORS.map((c) => c.id)).size).toBe(COLORS.length);
    for (const ship of SHIPS) expect(ship.points.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back to the dart for unknown ids", () => {
    expect(shipById("nope").id).toBe("dart");
  });

  it("lists what a new planet unlocks", () => {
    const names = unlockedNames(0, 2);
    expect(names.includes("Needle ship")).toBe(true);
    expect(names.includes("Lime colour")).toBe(true);
    expect(names.includes("Chevron ship")).toBe(false);
    expect(unlockedNames(2, 2)).toHaveLength(0);
    expect(unlockHint(4)).toBe("Reach Jupiter");
  });
});

describe("themes", () => {
  it("picks festive themes by date", () => {
    expect(autoThemeId(new Date(2026, 10, 8))).toBe("diwali");
    expect(autoThemeId(new Date(2026, 11, 25))).toBe("winter");
    expect(autoThemeId(new Date(2026, 0, 2))).toBe("winter");
    expect(autoThemeId(new Date(2026, 9, 30))).toBe("halloween");
    expect(autoThemeId(new Date(2026, 5, 15))).toBe("pride");
    expect(autoThemeId(new Date(2027, 1, 6))).toBe("lunar");
    expect(autoThemeId(new Date(2026, 2, 10))).toBe("default");
  });

  it("respects the player's choice", () => {
    const day = new Date(2026, 10, 8);
    expect(pickTheme("off", day).id).toBe("default");
    expect(pickTheme("auto", day).id).toBe("diwali");
    expect(pickTheme("holi", day).id).toBe("holi");
    expect(pickTheme("nope", day).id).toBe("default");
  });

  it("has unique ids", () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  });
});
