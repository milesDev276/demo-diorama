"use client";

import { cn } from "@/lib/cn";
import { GROUND_BRUSH_RANGE, useDioramaStore } from "../store/dioramaStore";
import { SURFACE_KIND_SPECS } from "../assets/surfaceKinds";
import { SURFACE_KINDS } from "../types/diorama.types";
import { DIORAMA_COLORS } from "../utils/palette";
import { SURFACE_CELL } from "../utils/surfaceMap";

/**
 * Floating controls over the canvas while the ground brush is active:
 * what it paints, how wide, and Done.
 */
export function GroundBar() {
  const groundBrush = useDioramaStore((s) => s.groundBrush);
  const size = useDioramaStore((s) => s.groundBrushSize);
  const startGroundBrush = useDioramaStore((s) => s.startGroundBrush);
  const setGroundBrushSize = useDioramaStore((s) => s.setGroundBrushSize);
  const stopGroundBrush = useDioramaStore((s) => s.stopGroundBrush);
  if (!groundBrush) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 top-4 z-10 flex flex-col items-center gap-1.5">
      <div
        role="toolbar"
        aria-label="Ground brush"
        className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl bg-white/85 px-3 py-2 shadow-[0_8px_24px_rgba(139,111,82,0.18)] backdrop-blur"
      >
        <div role="radiogroup" aria-label="Ground material" className="flex items-center gap-1">
          {SURFACE_KINDS.map((kind) => {
            const spec = SURFACE_KIND_SPECS[kind];
            const active = groundBrush.kind === kind;
            return (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={spec.label}
                title={spec.label}
                onClick={() => startGroundBrush(kind)}
                className={cn(
                  "h-7 w-7 rounded-lg border-2 transition-transform focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer",
                  active ? "scale-110 border-[#F0B27A]" : "border-white/80 hover:scale-105"
                )}
                style={{ background: DIORAMA_COLORS[spec.color] }}
              />
            );
          })}
        </div>
        <span className="w-16 text-xs font-semibold text-[#4A3421]">{SURFACE_KIND_SPECS[groundBrush.kind].label}</span>
        <label className="flex items-center gap-2 text-xs font-medium text-[#4A3421]/70">
          Size
          <input
            type="range"
            min={GROUND_BRUSH_RANGE.min}
            max={GROUND_BRUSH_RANGE.max}
            step={1}
            value={size}
            onChange={(event) => setGroundBrushSize(Number(event.target.value))}
            className="w-20 accent-[#F0B27A] cursor-pointer"
          />
          <span className="w-10 tabular-nums">{(size * SURFACE_CELL).toFixed(1)} m</span>
        </label>
        <button
          type="button"
          onClick={stopGroundBrush}
          className="rounded-full bg-[#4A3421] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#4A3421]/85 cursor-pointer"
        >
          Done
        </button>
      </div>
      <p className="pointer-events-none rounded-full bg-white/70 px-3 py-1 text-[11px] text-[#4A3421]/70 backdrop-blur">
        Drag on the ground to paint · Shift keeps a straight line · [ ] size · Esc to finish
      </p>
    </div>
  );
}
