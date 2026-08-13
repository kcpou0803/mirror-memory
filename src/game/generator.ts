import { GENERATION_ATTEMPTS } from "./config";
import { entranceState } from "./logic";
import { simulatePath } from "./simulation";
import type { Difficulty, Exit, Mirror, MirrorType, Puzzle, Side } from "./types";

const SIDES: readonly Side[] = ["top", "bottom", "left", "right"];
const MIRROR_TYPES: readonly MirrorType[] = ["/", "\\"];

function randomInt(min: number, max: number, random: () => number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function makeMirrors(size: number, count: number, random: () => number): Mirror[] {
  const cells = Array.from({ length: size * size }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [cells[index], cells[target]] = [cells[target], cells[index]];
  }
  return cells.slice(0, count).map((cell) => ({
    row: Math.floor(cell / size),
    col: cell % size,
    type: MIRROR_TYPES[Math.floor(random() * MIRROR_TYPES.length)],
  }));
}

function makeEntrance(size: number, random: () => number): Exit {
  return { side: SIDES[Math.floor(random() * SIDES.length)], index: Math.floor(random() * size) };
}

export function generatePuzzle(difficulty: Difficulty, random: () => number = Math.random): Puzzle {
  const [minMirrors, maxMirrors] = difficulty.mirrorRange;
  const [minCollisions, maxCollisions] = difficulty.collisionRange;

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const mirrors = makeMirrors(difficulty.size, randomInt(minMirrors, maxMirrors, random), random);
    const entrance = makeEntrance(difficulty.size, random);
    const result = simulatePath(difficulty.size, mirrors, entrance);
    if (
      result.exit && !result.loopDetected && !result.exceededMaxLength &&
      result.collisionCount >= minCollisions && result.collisionCount <= maxCollisions
    ) {
      return {
        size: difficulty.size,
        mirrors,
        entrance,
        entranceDirection: entranceState(difficulty.size, entrance).direction,
        correctExit: result.exit,
        path: result.path,
        collisionCount: result.collisionCount,
      };
    }
  }
  throw new Error(`Could not generate a valid Level ${difficulty.level} puzzle.`);
}
