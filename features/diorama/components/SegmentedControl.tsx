"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  /** Names the group for assistive technology. */
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Icons only; the labels become tooltips. */
  compact?: boolean;
  className?: string;
}

/**
 * A row of mutually exclusive choices, one of them on. The segments share
 * the width; a label that does not fit wraps instead of pushing the row
 * wider than its container.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, compact = false, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-px rounded-xl bg-[#4A3421]/5 p-1", className)}>
      {options.map(({ value: option, label: text, icon: Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          aria-label={compact ? text : undefined}
          title={compact ? text : undefined}
          onClick={() => onChange(option)}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer",
            // An icon over its label: no side padding, so five fit across the inspector.
            !compact && Icon ? "flex-col text-[10px] leading-tight" : "px-2 text-xs",
            value === option ? "bg-white text-[#4A3421] shadow-sm" : "text-[#4A3421]/55 hover:text-[#4A3421]"
          )}
        >
          {Icon && <Icon size={compact ? 15 : 14} aria-hidden />}
          {!compact && <span className="max-w-full text-center [overflow-wrap:anywhere]">{text}</span>}
        </button>
      ))}
    </div>
  );
}
