import { describe, expect, it } from "vitest";
import { DIFFICULTIES, difficultyForProgress, maxMirrorsForSize } from "./config";
import { generatePuzzle } from "./generator";
import { reflect } from "./logic";
import { simulateFromState, simulatePath } from "./simulation";
import type { Mirror } from "./types";

describe("reflect", () => {
  it("reflects all four directions on /", () => {
    expect(reflect("right", "/")).toBe("up");
    expect(reflect("left", "/")).toBe("down");
    expect(reflect("up", "/")).toBe("right");
    expect(reflect("down", "/")).toBe("left");
  });

  it("reflects all four directions on backslash", () => {
    expect(reflect("right", "\\")).toBe("down");
    expect(reflect("left", "\\")).toBe("up");
    expect(reflect("up", "\\")).toBe("left");
    expect(reflect("down", "\\")).toBe("right");
  });
});

describe("generatePuzzle", () => {
  it("generates a valid puzzle for every configured level", () => {
    let seed = 20260813;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (const difficulty of DIFFICULTIES) {
      const puzzle = generatePuzzle(difficulty, random);
      expect(puzzle.size).toBe(difficulty.size);
      expect(puzzle.mirrors.length).toBeGreaterThanOrEqual(difficulty.mirrorRange[0]);
      expect(puzzle.mirrors.length).toBeLessThanOrEqual(difficulty.mirrorRange[1]);
      expect(puzzle.collisionCount).toBeGreaterThanOrEqual(difficulty.collisionRange[0]);
      expect(puzzle.collisionCount).toBeGreaterThanOrEqual(3);
      expect(puzzle.collisionCount).toBeLessThanOrEqual(difficulty.collisionRange[1]);
      expect(puzzle.correctExit).toBeTruthy();
    }
  });
});

describe("streak progression", () => {
  it("raises the displayed level and adds one mirror every three wins", () => {
    const base = DIFFICULTIES[0];
    expect(difficultyForProgress(base, 0).mirrorRange).toEqual([5, 5]);
    expect(difficultyForProgress(base, 1).mirrorRange).toEqual([6, 6]);
    expect(difficultyForProgress(base, 2).mirrorRange).toEqual([7, 7]);
    expect(difficultyForProgress(base, 2).level).toBe(3);
    expect(difficultyForProgress(base, 2).collisionRange).toEqual([3, 6]);
  });

  it("stops adding mirrors at half the board then raises the collision maximum", () => {
    expect(maxMirrorsForSize(5)).toBe(12);
    expect(maxMirrorsForSize(7)).toBe(24);
    const atCap = difficultyForProgress(DIFFICULTIES[0], 7);
    const afterCap = difficultyForProgress(DIFFICULTIES[0], 8);
    expect(atCap.mirrorRange).toEqual([12, 12]);
    expect(atCap.collisionRange).toEqual([3, 11]);
    expect(afterCap.mirrorRange).toEqual([12, 12]);
    expect(afterCap.collisionRange).toEqual([3, 12]);
  });
});

describe("simulatePath", () => {
  it("travels straight through a board without mirrors", () => {
    const result = simulatePath(3, [], { side: "top", index: 1 });
    expect(result.exit).toEqual({ side: "bottom", index: 1 });
    expect(result.collisionCount).toBe(0);
    expect(result.path).toHaveLength(5);
  });

  it("turns at one mirror and finds the correct exit", () => {
    const result = simulatePath(3, [{ row: 1, col: 1, type: "/" }], { side: "left", index: 1 });
    expect(result.exit).toEqual({ side: "top", index: 1 });
    expect(result.collisionCount).toBe(1);
  });

  it("handles a path with multiple mirrors", () => {
    const mirrors: Mirror[] = [
      { row: 2, col: 1, type: "/" },
      { row: 1, col: 1, type: "\\" },
    ];
    const result = simulatePath(4, mirrors, { side: "left", index: 2 });
    expect(result.exit).toEqual({ side: "left", index: 1 });
    expect(result.collisionCount).toBe(2);
  });

  it("detects a repeated row, column and direction state", () => {
    const loop: Mirror[] = [
      { row: 0, col: 0, type: "/" }, { row: 0, col: 1, type: "\\" },
      { row: 1, col: 1, type: "/" }, { row: 1, col: 0, type: "\\" },
    ];
    const result = simulateFromState(2, loop, { row: 1, col: 0, direction: "up" });
    expect(result.loopDetected).toBe(true);
    expect(result.exit).toBeNull();
  });
});
