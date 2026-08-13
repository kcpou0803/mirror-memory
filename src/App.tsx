import { useEffect, useMemo, useState } from "react";
import { useGameAudio } from "./audio/useGameAudio";
import { GameBoard } from "./components/GameBoard";
import { Hud } from "./components/Hud";
import { DIFFICULTIES, difficultyForProgress, maxMirrorsForSize, WINS_PER_LEVEL } from "./game/config";
import { generatePuzzle } from "./game/generator";
import { exitLabel, sameExit } from "./game/logic";
import type { Exit, Puzzle } from "./game/types";

type Phase = "idle" | "memorize" | "answer" | "reveal" | "result";
const PROGRESS_STORAGE_KEY = "mirror-memory-progress-v1";
const SCORE_STORAGE_KEY = "mirror-memory-score-v1";

function loadNumber(key: string): number {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function loadProgress(): number[] {
  try {
    const stored = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "[]");
    return DIFFICULTIES.map((_, index) => Math.max(0, Math.floor(Number(stored[index]) || 0)));
  } catch {
    return DIFFICULTIES.map(() => 0);
  }
}

export function App() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [selectedExit, setSelectedExit] = useState<Exit | null>(null);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [score, setScore] = useState(() => loadNumber(SCORE_STORAGE_KEY));
  const [streak, setStreak] = useState(0);
  const [levelProgress, setLevelProgress] = useState(loadProgress);
  const { enabled: soundEnabled, play: playSound, toggle: toggleSound } = useGameAudio();
  const baseDifficulty = DIFFICULTIES[levelIndex];
  const difficulty = useMemo(() => difficultyForProgress(baseDifficulty, levelProgress[levelIndex]), [baseDifficulty, levelProgress, levelIndex]);
  const isCorrect = puzzle ? sameExit(selectedExit, puzzle.correctExit) : false;

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(levelProgress)); } catch { /* Storage may be blocked. */ }
  }, [levelProgress]);

  useEffect(() => {
    try { localStorage.setItem(SCORE_STORAGE_KEY, String(score)); } catch { /* Storage may be blocked. */ }
  }, [score]);

  const beginRound = () => {
    playSound("start");
    const nextPuzzle = generatePuzzle(difficulty);
    setPuzzle(nextPuzzle);
    setSelectedExit(null);
    setAnimationIndex(0);
    setPhase("memorize");
  };

  useEffect(() => {
    if (phase !== "memorize") return;
    const timer = window.setTimeout(() => {
      playSound("hide");
      setPhase("answer");
    }, difficulty.memorizeMs);
    return () => window.clearTimeout(timer);
  }, [phase, difficulty.memorizeMs, playSound]);

  useEffect(() => {
    if (phase !== "reveal" || !puzzle) return;
    const atEnd = animationIndex >= puzzle.path.length - 1;
    const timer = window.setTimeout(() => {
      if (atEnd) {
        const correct = sameExit(selectedExit, puzzle.correctExit);
        playSound(correct ? "correct" : "wrong");
        if (correct) {
          setScore((value) => value + 1);
          setStreak((value) => {
            const next = value + 1;
            if (next < WINS_PER_LEVEL) return next;
            setLevelProgress((progress) => progress.map((level, index) => index === levelIndex ? level + 1 : level));
            return 0;
          });
        } else {
          setStreak(0);
        }
        setPhase("result");
      } else {
        const nextState = puzzle.path[animationIndex + 1];
        const hitMirror = puzzle.mirrors.some((mirror) => mirror.row === nextState.row && mirror.col === nextState.col);
        playSound(hitMirror ? "collision" : "step");
        setAnimationIndex((value) => value + 1);
      }
    }, difficulty.animationMs);
    return () => window.clearTimeout(timer);
  }, [phase, puzzle, animationIndex, selectedExit, difficulty.animationMs, playSound, levelIndex]);

  const handleExit = (exit: Exit) => {
    if (phase !== "answer") return;
    playSound("select");
    setSelectedExit(exit);
    setAnimationIndex(0);
    setPhase("reveal");
  };

  const resetCurrentProgress = () => {
    if (!window.confirm(`Reset progress for ${baseDifficulty.label}? Your total score will be kept.`)) return;
    setLevelProgress((progress) => progress.map((level, index) => index === levelIndex ? 0 : level));
    setStreak(0);
    setPuzzle(null);
    setSelectedExit(null);
    setPhase("idle");
  };

  const visiblePath = useMemo(() => {
    if (!puzzle) return [];
    if (phase === "result") return puzzle.path;
    if (phase !== "reveal") return [];
    return puzzle.path.slice(0, animationIndex + 1);
  }, [puzzle, phase, animationIndex]);

  const phaseCopy = {
    idle: ["Ready", "Study the mirrors, then predict where the ball will leave."],
    memorize: ["Memorize", "You have 1.5 seconds."],
    answer: ["Choose the exit", "Trace the hidden reflections, then select an edge position."],
    reveal: ["Reveal", "Watch the actual route."],
    result: [isCorrect ? "Correct" : "Wrong", isCorrect ? "The route matched your prediction." : "Compare your choice with the correct exit."],
  } as const;

  const size = puzzle?.size ?? difficulty.size;
  const mirrorCount = puzzle?.mirrors.length ?? difficulty.mirrorRange[0];
  const reachedMirrorCap = difficulty.mirrorRange[0] >= maxMirrorsForSize(difficulty.size);
  const nextLevel = difficulty.level + 1;
  const nextLevelRaisesCollision = nextLevel >= 3 && nextLevel % 2 === 1;
  const nextUpgradeLabel = nextLevelRaisesCollision
    ? `Next collision range · now ${difficulty.collisionRange[0]}–${difficulty.collisionRange[1]}`
    : reachedMirrorCap
      ? "Mirror limit · level only"
      : "Next mirror";
  const showMirrors = phase === "memorize" || phase === "reveal" || phase === "result";
  const ball = puzzle && (phase === "answer" ? puzzle.path[0] : phase === "reveal" ? puzzle.path[animationIndex] : phase === "result" ? puzzle.path.at(-1)! : null);
  const collision = phase === "reveal" && ball && puzzle?.mirrors.some((mirror) => mirror.row === ball.row && mirror.col === ball.col)
    ? ball
    : null;

  return (
    <main className="app-shell">
      <header className="title-row">
        <div><p className="eyebrow">SPATIAL MEMORY</p><h1>Mirror Memory</h1></div>
        <div className="header-controls">
        <button className="sound-toggle" onClick={toggleSound} aria-pressed={!soundEnabled} aria-label={soundEnabled ? "Mute sound" : "Enable sound"}>
          <span aria-hidden="true">{soundEnabled ? "♪" : "×"}</span> Sound {soundEnabled ? "on" : "off"}
        </button>
        <nav className="levels" aria-label="Difficulty">
          {DIFFICULTIES.map((item, index) => (
            <button
              className={index === levelIndex ? "active" : ""}
              disabled={phase !== "idle" && phase !== "result"}
              key={item.label}
              onClick={() => { setLevelIndex(index); setPhase("idle"); setPuzzle(null); setSelectedExit(null); setStreak(0); }}
            >{item.label}</button>
          ))}
        </nav>
        </div>
      </header>

      <Hud level={difficulty.level} size={size} mirrors={mirrorCount} streak={streak} score={score} />
      <div className="streak-track" aria-label={`${streak} of ${WINS_PER_LEVEL} wins toward ${nextUpgradeLabel}`}>
        <span>{nextUpgradeLabel}</span>
        <div className="streak-dots" aria-hidden="true">
          {Array.from({ length: WINS_PER_LEVEL }, (_, index) => <i className={index < streak ? "filled" : ""} key={index} />)}
        </div>
        <strong>{WINS_PER_LEVEL - streak} wins</strong>
        <button className="reset-progress" onClick={resetCurrentProgress} disabled={phase !== "idle" && phase !== "result"}>Reset progress</button>
      </div>

      <section className="game-panel">
        <div className={`phase-heading phase-${phase} ${phase === "result" ? (isCorrect ? "result-correct" : "result-wrong") : ""}`} aria-live="polite">
          <span>{phase === "memorize" ? "01" : phase === "answer" ? "02" : phase === "reveal" ? "03" : phase === "result" ? "04" : "00"}</span>
          <div><h2>{phaseCopy[phase][0]}</h2><p>{phaseCopy[phase][1]}</p></div>
        </div>

        <GameBoard
          size={size}
          mirrors={puzzle?.mirrors ?? []}
          showMirrors={showMirrors}
          entrance={phase === "memorize" ? null : puzzle?.entrance ?? null}
          selectedExit={selectedExit}
          correctExit={puzzle?.correctExit ?? null}
          showAnswer={phase === "result"}
          interactive={phase === "answer"}
          ball={ball}
          path={visiblePath}
          collision={collision}
          collisionPulseKey={animationIndex}
          movementMs={difficulty.animationMs}
          onSelectExit={handleExit}
        />

        <div className="action-area">
          {phase === "idle" && <button className="primary-button" onClick={beginRound}>Start</button>}
          {phase === "result" && puzzle && (
            <div className="result-actions">
              <div className="answer-summary">
                <span>Your choice <strong>{selectedExit ? exitLabel(selectedExit) : "—"}</strong></span>
                <span>Correct exit <strong>{exitLabel(puzzle.correctExit)}</strong></span>
              </div>
              <button className="primary-button" onClick={beginRound}>Next</button>
            </div>
          )}
          {(phase === "memorize" || phase === "answer" || phase === "reveal") && (
            <p className="progress-note">
              {phase === "memorize" ? "Mirrors will disappear automatically" : phase === "answer" ? `${size * 4} possible exits` : `${Math.min(animationIndex + 1, puzzle?.path.length ?? 0)} / ${puzzle?.path.length ?? 0} steps`}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
