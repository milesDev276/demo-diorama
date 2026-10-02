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

/** A row of mutually exclusive choices, one of them on. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, compact = false, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-1 rounded-xl bg-[#4A3421]/5 p-1", className)}>
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
            "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer",
            !compact && Icon && "flex-col px-1 text-[10px] leading-tight",
            value === option ? "bg-white text-[#4A3421] shadow-sm" : "text-[#4A3421]/55 hover:text-[#4A3421]"
          )}
        >
          {Icon && <Icon size={compact ? 15 : 14} aria-hidden />}
          {!compact && text}
        </button>
      ))}
    </div>
  );
}
