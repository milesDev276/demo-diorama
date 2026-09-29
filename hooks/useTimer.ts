"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { timerModes } from "@/data/timerModes";
import type { TimerMode } from "@/types";

export function useTimer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(() => timerModes[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = (timerModes.find((m) => m.id === mode)?.minutes ?? 25) * 60;

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const selectMode = useCallback((next: TimerMode) => {
    setIsRunning(false);
    setMode(next);
    const config = timerModes.find((m) => m.id === next);
    setSecondsLeft((config?.minutes ?? 25) * 60);
  }, []);

  const start = useCallback(() => {
    if (secondsLeft > 0) setIsRunning(true);
  }, [secondsLeft]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    const config = timerModes.find((m) => m.id === mode);
    setSecondsLeft((config?.minutes ?? 25) * 60);
  }, [mode]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds === 0 ? 0 : 1 - secondsLeft / totalSeconds;

  return {
    mode,
    selectMode,
    isRunning,
    start,
    pause,
    reset,
    minutes,
    seconds,
    progress,
    isFinished: secondsLeft === 0,
  };
}
