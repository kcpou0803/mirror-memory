import { entranceState, move, outsideToExit, reflect } from "./logic";
import type { BallState, Exit, Mirror, SimulationResult } from "./types";

export function simulateFromState(
  size: number,
  mirrors: readonly Mirror[],
  initialState: BallState,
  maxSteps = size * size * 4 + 1,
): SimulationResult {
  const mirrorMap = new Map(mirrors.map((mirror) => [`${mirror.row},${mirror.col}`, mirror.type]));
  const seen = new Set<string>();
  let state = initialState;
  const path = [state];
  let collisionCount = 0;

  for (let steps = 0; steps < maxSteps; steps += 1) {
    state = move(state);
    const exit = outsideToExit(state, size);
    if (exit) {
      path.push(state);
      return { path, exit, collisionCount, loopDetected: false, exceededMaxLength: false };
    }

    const stateKey = `${state.row},${state.col},${state.direction}`;
    if (seen.has(stateKey)) {
      return { path, exit: null, collisionCount, loopDetected: true, exceededMaxLength: false };
    }
    seen.add(stateKey);

    const mirror = mirrorMap.get(`${state.row},${state.col}`);
    if (mirror) {
      state = { ...state, direction: reflect(state.direction, mirror) };
      collisionCount += 1;
    }
    path.push(state);
  }

  return { path, exit: null, collisionCount, loopDetected: false, exceededMaxLength: true };
}

export function simulatePath(
  size: number,
  mirrors: readonly Mirror[],
  entrance: Exit,
  maxSteps = size * size * 4 + 1,
): SimulationResult {
  return simulateFromState(size, mirrors, entranceState(size, entrance), maxSteps);
}
