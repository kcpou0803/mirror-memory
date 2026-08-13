import type { Difficulty } from "./types";

export const DIFFICULTIES: readonly Difficulty[] = [
  { level: 1, label: "5×5 L1", size: 5, mirrorRange: [5, 5], collisionRange: [0, 4], memorizeMs: 1500, animationMs: 95 },
  { level: 5, label: "5×5 L5", size: 5, mirrorRange: [7, 7], collisionRange: [2, 6], memorizeMs: 1500, animationMs: 95 },
  { level: 1, label: "6×6 L1", size: 6, mirrorRange: [6, 6], collisionRange: [0, 4], memorizeMs: 1500, animationMs: 95 },
  { level: 5, label: "6×6 L5", size: 6, mirrorRange: [8, 8], collisionRange: [2, 6], memorizeMs: 1500, animationMs: 95 },
] as const;

export const GENERATION_ATTEMPTS = 10_000;
export const WINS_PER_LEVEL = 3;

export function maxMirrorsForSize(size: number): number {
  return Math.floor((size * size) / 2);
}

export function difficultyForProgress(base: Difficulty, levelsGained: number): Difficulty {
  levelsGained = Math.max(0, Math.floor(levelsGained));
  const mirrorCap = maxMirrorsForSize(base.size);
  let level = base.level;
  let mirrorCount = base.mirrorRange[0];
  let collisionCenter = Math.floor((base.collisionRange[0] + base.collisionRange[1]) / 2);

  for (let gained = 0; gained < levelsGained; gained += 1) {
    level += 1;
    const raisesCollision = level >= 3 && level % 2 === 1;

    if (raisesCollision) {
      collisionCenter += 1;
    } else if (mirrorCount < mirrorCap) {
      mirrorCount += 1;
    }
  }

  collisionCenter = Math.min(base.size * base.size * 4 - 2, collisionCenter);

  return {
    ...base,
    level,
    mirrorRange: [mirrorCount, mirrorCount],
    collisionRange: [Math.max(0, collisionCenter - 2), collisionCenter + 2],
  };
}
