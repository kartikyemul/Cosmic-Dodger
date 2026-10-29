import { describe, expect, it } from "vitest";
import { cleanTag, isValidTag } from "../services/tag";
import { nextStage, passedStages, STAGES } from "./journey";
import { smoothstep } from "./math";
import { difficulty } from "./spawner";

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
