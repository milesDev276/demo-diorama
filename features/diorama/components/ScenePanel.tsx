"use client";

import { cn } from "@/lib/cn";
import { useDioramaStore } from "../store/dioramaStore";
import { BASE_ORDER, BASE_TEMPLATES } from "../utils/baseTemplates";

/**
 * Scene-level settings, shown in the inspector while nothing is selected.
 * Today: the base the Diorama stands on.
 */
export function ScenePanel() {
  const base = useDioramaStore((s) => s.environment.base);
  const setBase = useDioramaStore((s) => s.setBase);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">Scene base</p>
      <div role="radiogroup" aria-label="Scene base" className="flex gap-1 rounded-xl bg-[#4A3421]/5 p-1">
        {BASE_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={base === option}
            onClick={() => setBase(option)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              base === option ? "bg-white text-[#4A3421] shadow-sm" : "text-[#4A3421]/55 hover:text-[#4A3421]"
            )}
          >
            {BASE_TEMPLATES[option].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-[#4A3421]/50">
        {BASE_TEMPLATES[base].description} Switching keeps every object where it is.
      </p>
    </div>
  );
}
