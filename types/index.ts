export interface Todo {
  id: string;
  label: string;
  completed: boolean;
}

export interface Background {
  id: string;
  title: string;
  thumbnail: string;
  full: string;
}

export interface MusicPreset {
  id: string;
  title: string;
  youtubeId: string;
}

export type TimerMode = "focus" | "shortBreak" | "longBreak";

export interface TimerModeConfig {
  id: TimerMode;
  label: string;
  minutes: number;
}
