"use client";

import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTimer } from "@/hooks/useTimer";
import { timerModes } from "@/data/timerModes";
import { cn } from "@/lib/cn";

const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PomodoroTimer() {
  const { mode, selectMode, isRunning, start, pause, reset, minutes, seconds, progress } =
    useTimer();

  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Card className="flex w-full flex-col items-center gap-6 p-6 sm:p-8" tint="warm">
      <div className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-black/10 p-1">
        {timerModes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => selectMode(m.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              mode === m.id
                ? "bg-[#F0B27A] text-[#4A3421]"
                : "text-[#FDF6EC]/70 hover:text-[#FDF6EC]"
            )}
          >
            {m.label} ({String(m.minutes).padStart(2, "0")}:00)
          </button>
        ))}
      </div>

      <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
        {isRunning && (
          <motion.div
            className="absolute inset-0 rounded-full bg-[#F0B27A]/30 blur-2xl"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.02, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 260 260">
          <circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="10"
          />
          <motion.circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="#F0B27A"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>

        <div className="relative flex flex-col items-center">
          <span className="font-mono text-6xl font-semibold tabular-nums text-[#FDF6EC] sm:text-7xl">
            {label}
          </span>
          <span className="mt-1 text-sm text-[#FDF6EC]/70">
            {timerModes.find((m) => m.id === mode)?.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isRunning ? (
          <Button onClick={pause}>
            <Pause size={16} /> Pause
          </Button>
        ) : (
          <Button onClick={start}>
            <Play size={16} /> Start
          </Button>
        )}
        <Button variant="ghost" onClick={reset}>
          <RotateCcw size={16} /> Reset
        </Button>
      </div>
    </Card>
  );
}
