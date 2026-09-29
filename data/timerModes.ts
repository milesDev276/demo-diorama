import type { TimerModeConfig } from "@/types";

export const timerModes: TimerModeConfig[] = [
  { id: "focus", label: "Focus", minutes: 25 },
  { id: "shortBreak", label: "Short Break", minutes: 5 },
  { id: "longBreak", label: "Long Break", minutes: 15 },
];
