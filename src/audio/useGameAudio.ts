import { useCallback, useEffect, useRef, useState } from "react";

export type GameSound = "start" | "hide" | "select" | "step" | "collision" | "correct" | "wrong";

interface Tone {
  frequency: number;
  duration: number;
  delay?: number;
  gain?: number;
  type?: OscillatorType;
  endFrequency?: number;
}

const SOUND_PATTERNS: Record<GameSound, readonly Tone[]> = {
  start: [
    { frequency: 330, duration: 0.07, gain: 0.045 },
    { frequency: 494, duration: 0.12, delay: 0.08, gain: 0.05 },
  ],
  hide: [{ frequency: 520, endFrequency: 240, duration: 0.16, gain: 0.035, type: "sine" }],
  select: [{ frequency: 310, endFrequency: 390, duration: 0.09, gain: 0.04, type: "triangle" }],
  step: [{ frequency: 190, duration: 0.025, gain: 0.012, type: "sine" }],
  collision: [
    { frequency: 760, endFrequency: 1040, duration: 0.1, gain: 0.07, type: "triangle" },
    { frequency: 1520, duration: 0.045, delay: 0.025, gain: 0.025, type: "sine" },
  ],
  correct: [
    { frequency: 392, duration: 0.11, gain: 0.05 },
    { frequency: 523, duration: 0.11, delay: 0.11, gain: 0.055 },
    { frequency: 659, duration: 0.2, delay: 0.22, gain: 0.06 },
  ],
  wrong: [
    { frequency: 260, endFrequency: 210, duration: 0.15, gain: 0.045, type: "sawtooth" },
    { frequency: 185, duration: 0.2, delay: 0.12, gain: 0.04, type: "triangle" },
  ],
};

export function useGameAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(true);

  const getContext = useCallback(() => {
    if (!contextRef.current) contextRef.current = new AudioContext();
    if (contextRef.current.state === "suspended") void contextRef.current.resume();
    return contextRef.current;
  }, []);

  const play = useCallback((sound: GameSound) => {
    if (!enabled) return;
    const context = getContext();
    const now = context.currentTime;

    for (const tone of SOUND_PATTERNS[sound]) {
      const start = now + (tone.delay ?? 0);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = tone.type ?? "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      if (tone.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, start + tone.duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.gain ?? 0.04, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + tone.duration + 0.02);
    }
  }, [enabled, getContext]);

  const toggle = useCallback(() => {
    setEnabled((value) => !value);
  }, []);

  useEffect(() => () => {
    if (contextRef.current) void contextRef.current.close();
  }, []);

  return { enabled, play, toggle };
}
