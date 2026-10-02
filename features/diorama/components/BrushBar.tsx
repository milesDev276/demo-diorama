"use client";

import { Eraser, Paintbrush } from "lucide-react";
import { cn } from "@/lib/cn";
import { BRUSH_DENSITY_RANGE, BRUSH_RADIUS_RANGE, useDioramaStore } from "../store/dioramaStore";
import { SCATTER_KIND_SPECS } from "../assets/scatterKinds";
import { SEASON_LOOKS } from "../utils/seasons";

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Eraser; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
        active ? "bg-[#F0B27A] text-[#4A3421]" : "text-[#4A3421]/60 hover:bg-white"
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-[#4A3421]/70">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-20 accent-[#F0B27A] cursor-pointer"
      />
    </label>
  );
}

/**
 * Floating controls over the canvas while the scatter brush is active:
 * what it paints, Paint / Erase, size, density and Done.
 */
export function BrushBar() {
  const brush = useDioramaStore((s) => s.brush);
  const brushRadius = useDioramaStore((s) => s.brushRadius);
  const brushDensity = useDioramaStore((s) => s.brushDensity);
  const brushErase = useDioramaStore((s) => s.brushErase);
  const setBrushRadius = useDioramaStore((s) => s.setBrushRadius);
  const setBrushDensity = useDioramaStore((s) => s.setBrushDensity);
  const setBrushErase = useDioramaStore((s) => s.setBrushErase);
  const stopBrush = useDioramaStore((s) => s.stopBrush);
  const season = useDioramaStore((s) => s.environment.season);
  if (!brush) return null;
  const spec = SCATTER_KIND_SPECS[brush.kind];
  const Icon = spec.icon;

  return (
    <div className="pointer-events-none absolute inset-x-3 top-4 z-10 flex flex-col items-center gap-1.5">
      <div
        role="toolbar"
        aria-label="Scatter brush"
        className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl bg-white/85 px-3 py-2 shadow-[0_8px_24px_rgba(139,111,82,0.18)] backdrop-blur"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#4A3421]">
          <Icon size={14} />
          {spec.label}
        </span>
        <div className="flex items-center gap-0.5 rounded-full bg-[#4A3421]/5 p-0.5">
          <ModeButton active={!brushErase} onClick={() => setBrushErase(false)} icon={Paintbrush} label="Paint" />
          <ModeButton active={brushErase} onClick={() => setBrushErase(true)} icon={Eraser} label="Erase" />
        </div>
        <Slider label="Size" value={brushRadius} min={BRUSH_RADIUS_RANGE.min} max={BRUSH_RADIUS_RANGE.max} step={0.05} onChange={setBrushRadius} />
        <Slider label="Density" value={brushDensity} min={BRUSH_DENSITY_RANGE.min} max={BRUSH_DENSITY_RANGE.max} step={0.05} onChange={setBrushDensity} />
        <button
          type="button"
          onClick={stopBrush}
          className="rounded-full bg-[#4A3421] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#4A3421]/85 cursor-pointer"
        >
          Done
        </button>
      </div>
      <p className="pointer-events-none rounded-full bg-white/70 px-3 py-1 text-[11px] text-[#4A3421]/70 backdrop-blur">
        {SEASON_LOOKS[season].scatter[brush.kind]
          ? "Drag on the ground to paint · Alt+drag erases · [ ] size · Esc to finish"
          : `${spec.label} do not show in ${SEASON_LOOKS[season].label.toLowerCase()} — change the season to see what you paint`}
      </p>
    </div>
  );
}
