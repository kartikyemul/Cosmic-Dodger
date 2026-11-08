import { describe, expect, it } from "vitest";
import { cleanTag, isValidTag } from "../services/tag";
import { nextStage, passedStages, pointsToNext, STAGES } from "./journey";
import { smoothstep } from "./math";
import { currentStreak, dayKey, EMPTY_DAILY, mulberry32, recordDaily, seedFromKey, yesterdayKey } from "./daily";
import { difficulty, spawnHazard } from "./spawner";
import { COLORS, SHIPS, shipById, unlockedNames, unlockHint } from "./ships";
import { drawShareCard, shareText, type ShareData } from "../services/share";
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

describe("daily run", () => {
  it("gives the same numbers for the same seed", () => {
    const a = mulberry32(seedFromKey("2026-11-08"));
    const b = mulberry32(seedFromKey("2026-11-08"));
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(seedFromKey("2026-11-08") === seedFromKey("2026-11-09")).toBe(false);
  });

  it("spawns identical rocks from the same seed", () => {
    const one = spawnHazard(400, 800, 1, 0.5, 200, mulberry32(5));
    const two = spawnHazard(400, 800, 1, 0.5, 200, mulberry32(5));
    expect(JSON.stringify(one)).toBe(JSON.stringify(two));
  });

  it("builds day keys across month and year ends", () => {
    expect(dayKey(new Date(2026, 10, 8))).toBe("2026-11-08");
    expect(yesterdayKey(new Date(2026, 2, 1))).toBe("2026-02-28");
    expect(yesterdayKey(new Date(2027, 0, 1))).toBe("2026-12-31");
  });

  it("tracks best, tries and streak", () => {
    const first = recordDaily(EMPTY_DAILY, "2026-11-08", "2026-11-07", 1000, 50);
    expect(first.best).toBe(1000);
    expect(first.streak).toBe(1);
    const again = recordDaily(first, "2026-11-08", "2026-11-07", 800, 40);
    expect(again.best).toBe(1000);
    expect(again.tries).toBe(2);
    expect(again.streak).toBe(1);
    const next = recordDaily(again, "2026-11-09", "2026-11-08", 500, 30);
    expect(next.streak).toBe(2);
    expect(next.best).toBe(500);
    expect(next.tries).toBe(1);
    const skipped = recordDaily(next, "2026-11-12", "2026-11-11", 700, 35);
    expect(skipped.streak).toBe(1);
  });

  it("drops the shown streak after a missed day", () => {
    const state = recordDaily(EMPTY_DAILY, "2026-11-08", "2026-11-07", 100, 10);
    expect(currentStreak(state, "2026-11-09", "2026-11-08")).toBe(1);
    expect(currentStreak(state, "2026-11-10", "2026-11-09")).toBe(0);
  });
});

describe("share card", () => {
  const data: ShareData = {
    tag: "KARTIK", score: 21340, reached: 4, planet: "Jupiter", won: false, daily: "8 Nov 2026",
    time: 168, accent: "#1ee6ff", shipColor: "#1ee6ff", shipPoints: [[0, -1], [1, 1], [-1, 1]], site: "example.com",
  };

  it("draws the whole card without errors", () => {
    let calls = 0;
    const gradient = { addColorStop: () => undefined };
    const ctx = new Proxy(
      {},
      {
        get: (_t, prop) => (prop === "createLinearGradient" || prop === "createRadialGradient" ? () => gradient : () => void calls++),
        set: () => true,
      },
    ) as unknown as CanvasRenderingContext2D;
    drawShareCard(ctx, data);
    expect(calls).toBeGreaterThan(100);
  });

  it("writes a short message to go with it", () => {
    const text = shareText(data);
    expect(text.includes("Jupiter")).toBe(true);
    expect(text.includes("21,340")).toBe(true);
    expect(text.includes("Daily Run")).toBe(true);
    expect(shareText({ ...data, won: true, daily: "" }).includes("made it home")).toBe(true);
  });
});

describe("next planet nudge", () => {
  it("counts the points left to the next planet", () => {
    expect(pointsToNext(0, 40000).name).toBe("Neptune");
    expect(pointsToNext(0, 40000).points).toBe(5000);
    expect(pointsToNext(0.5, 40000).name).toBe("Mars");
    expect(pointsToNext(0.5, 40000).points).toBe(5000);
    expect(pointsToNext(0.99, 40000).name).toBe("Earth");
    expect(pointsToNext(0.99, 40000).points).toBe(400);
  });
});
