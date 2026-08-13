import { exitLabel, sameExit } from "../game/logic";
import type { BallState, Exit, Mirror, Side } from "../game/types";

interface GameBoardProps {
  size: number;
  mirrors: readonly Mirror[];
  showMirrors: boolean;
  entrance: Exit | null;
  selectedExit: Exit | null;
  correctExit: Exit | null;
  showAnswer: boolean;
  interactive: boolean;
  ball: BallState | null;
  path: readonly BallState[];
  collision: BallState | null;
  collisionPulseKey: number;
  movementMs: number;
  onSelectExit: (exit: Exit) => void;
}

const DIRECTIONS = { up: "↑", down: "↓", left: "←", right: "→" } as const;

function EdgeButtons({ side, size, ...props }: {
  side: Side; size: number; entrance: Exit | null; selectedExit: Exit | null;
  correctExit: Exit | null; showAnswer: boolean; interactive: boolean;
  onSelectExit: (exit: Exit) => void;
}) {
  return (
    <div className={`edge edge-${side}`}>
      {Array.from({ length: size }, (_, index) => {
        const exit: Exit = { side, index };
        const classes = [
          "exit-button",
          sameExit(exit, props.entrance) ? "entrance" : "",
          sameExit(exit, props.selectedExit) ? "selected" : "",
          props.showAnswer && sameExit(exit, props.correctExit) ? "correct-exit" : "",
        ].filter(Boolean).join(" ");
        return (
          <button
            className={classes}
            key={index}
            disabled={!props.interactive}
            onClick={() => props.onSelectExit(exit)}
            aria-label={`Choose ${exitLabel(exit)}`}
          >
            <span>{index + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

export function GameBoard(props: GameBoardProps) {
  const mirrorMap = new Map(props.mirrors.map((mirror) => [`${mirror.row},${mirror.col}`, mirror.type]));
  const points = props.path.map((state) => `${state.col + 0.5},${state.row + 0.5}`).join(" ");
  const ballStyle = props.ball ? {
    left: `${((props.ball.col + 0.5) / props.size) * 100}%`,
    top: `${((props.ball.row + 0.5) / props.size) * 100}%`,
  } : undefined;
  const shared = {
    size: props.size, entrance: props.entrance, selectedExit: props.selectedExit,
    correctExit: props.correctExit, showAnswer: props.showAnswer,
    interactive: props.interactive, onSelectExit: props.onSelectExit,
  };

  return (
    <div className="board-frame" style={{ "--size": props.size, "--move-ms": `${Math.max(45, props.movementMs - 15)}ms` } as React.CSSProperties}>
      <EdgeButtons side="top" {...shared} />
      <EdgeButtons side="left" {...shared} />
      <div className="board">
        {Array.from({ length: props.size * props.size }, (_, index) => {
          const row = Math.floor(index / props.size);
          const col = index % props.size;
          const mirrorType = mirrorMap.get(`${row},${col}`);
          const isCollision = props.collision?.row === row && props.collision.col === col;
          return (
            <div className={`cell ${isCollision ? "cell-collision" : ""}`} key={index}>
              {props.showMirrors && mirrorType && (
                <span
                  className={`mirror mirror-${mirrorType === "/" ? "slash" : "backslash"} ${isCollision ? "mirror-hit" : ""}`}
                  role="img"
                  aria-label={`${mirrorType} mirror`}
                >
                  <i className="mirror-glass" aria-hidden="true" />
                </span>
              )}
              {isCollision && (
                <span className="collision-effect" key={props.collisionPulseKey} aria-hidden="true">
                  <i className="collision-ring" /><i className="collision-flare" />
                </span>
              )}
            </div>
          );
        })}
        {props.path.length > 1 && (
          <svg className="path-line" viewBox={`0 0 ${props.size} ${props.size}`} preserveAspectRatio="none" aria-hidden="true">
            <polyline points={points} />
          </svg>
        )}
        {props.ball && (
          <div className={`ball ${props.collision ? "ball-collision" : ""}`} style={ballStyle} aria-label={`Ball moving ${props.ball.direction}`}>
            <span>{DIRECTIONS[props.ball.direction]}</span>
            {props.collision && <i className={`turn-indicator turn-${props.ball.direction}`} key={props.collisionPulseKey} aria-hidden="true" />}
          </div>
        )}
      </div>
      <EdgeButtons side="right" {...shared} />
      <EdgeButtons side="bottom" {...shared} />
    </div>
  );
}
