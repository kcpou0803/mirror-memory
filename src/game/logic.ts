import type { BallState, Direction, Exit, MirrorType } from "./types";

const REFLECTIONS: Record<MirrorType, Record<Direction, Direction>> = {
  "/": { right: "up", left: "down", up: "right", down: "left" },
  "\\": { right: "down", left: "up", up: "left", down: "right" },
};

export function reflect(direction: Direction, mirrorType: MirrorType): Direction {
  return REFLECTIONS[mirrorType][direction];
}

export function move(state: BallState): BallState {
  const offsets: Record<Direction, readonly [number, number]> = {
    up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1],
  };
  const [rowDelta, colDelta] = offsets[state.direction];
  return { row: state.row + rowDelta, col: state.col + colDelta, direction: state.direction };
}

export function entranceState(size: number, entrance: Exit): BallState {
  switch (entrance.side) {
    case "top": return { row: -1, col: entrance.index, direction: "down" };
    case "bottom": return { row: size, col: entrance.index, direction: "up" };
    case "left": return { row: entrance.index, col: -1, direction: "right" };
    case "right": return { row: entrance.index, col: size, direction: "left" };
  }
}

export function outsideToExit(state: BallState, size: number): Exit | null {
  if (state.row < 0) return { side: "top", index: state.col };
  if (state.row >= size) return { side: "bottom", index: state.col };
  if (state.col < 0) return { side: "left", index: state.row };
  if (state.col >= size) return { side: "right", index: state.row };
  return null;
}

export function sameExit(a: Exit | null, b: Exit | null): boolean {
  return a !== null && b !== null && a.side === b.side && a.index === b.index;
}

export function exitLabel(exit: Exit): string {
  const names = { top: "Top", bottom: "Bottom", left: "Left", right: "Right" };
  return `${names[exit.side]} ${exit.index + 1}`;
}
