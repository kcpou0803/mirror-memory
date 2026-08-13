import type { Difficulty } from "./types";

export const DIFFICULTIES: readonly Difficulty[] = [
  { level: 1, label: "5×5 L1", size: 5, mirrorRange: [5, 5], collisionRange: [3, 4], memorizeMs: 1500, animationMs: 95 },
  { level: 3, label: "5×5 L3", size: 5, mirrorRange: [7, 7], collisionRange: [3, 6], memorizeMs: 1500, animationMs: 95 },
  { level: 1, label: "7×7 L1", size: 7, mirrorRange: [7, 7], collisionRange: [3, 6], memorizeMs: 1500, animationMs: 95 },
  { level: 3, label: "7×7 L3", size: 7, mirrorRange: [9, 9], collisionRange: [3, 8], memorizeMs: 1500, animationMs: 95 },
] as const;

export const GENERATION_ATTEMPTS = 10_000;
export const WINS_PER_LEVEL = 3;

export function maxMirrorsForSize(size: number): number {
  return Math.floor((size * size) / 2);
}

export function difficultyForProgress(base: Difficulty, levelsGained: number): Difficulty {
  levelsGained = Math.max(0, Math.floor(levelsGained));
  const mirrorCap = maxMirrorsForSize(base.size);
  const availableMirrorLevels = Math.max(0, mirrorCap - base.mirrorRange[0]);
  const mirrorLevels = Math.min(levelsGained, availableMirrorLevels);
  const collisionLevels = Math.max(0, levelsGained - availableMirrorLevels);
  const mirrorCount = base.mirrorRange[0] + mirrorLevels;
  const maxCollisionCount = Math.min(base.size * base.size * 4, mirrorCount - 1 + collisionLevels);

  return {
    ...base,
    level: base.level + levelsGained,
    mirrorRange: [mirrorCount, mirrorCount],
    collisionRange: [3, maxCollisionCount],
  };
}
