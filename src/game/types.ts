export type Direction = "up" | "down" | "left" | "right";
export type MirrorType = "/" | "\\";
export type Side = "top" | "bottom" | "left" | "right";

export interface Mirror {
  row: number;
  col: number;
  type: MirrorType;
}

export interface BallState {
  row: number;
  col: number;
  direction: Direction;
}

export interface Exit {
  side: Side;
  index: number;
}

export interface SimulationResult {
  path: BallState[];
  exit: Exit | null;
  collisionCount: number;
  loopDetected: boolean;
  exceededMaxLength: boolean;
}

export interface Puzzle {
  size: number;
  mirrors: Mirror[];
  entrance: Exit;
  entranceDirection: Direction;
  correctExit: Exit;
  path: BallState[];
  collisionCount: number;
}

export interface Difficulty {
  level: number;
  label: string;
  size: number;
  mirrorRange: readonly [number, number];
  collisionRange: readonly [number, number];
  memorizeMs: number;
  animationMs: number;
}
