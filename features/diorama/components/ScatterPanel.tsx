"use client";

import { Eraser, Paintbrush, Shuffle } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import type { DioramaObject } from "../types/diorama.types";
import { scatterParamsOf } from "../utils/objectParams";
import { MAX_SCATTER_POINTS } from "../utils/scatterParams";

const BUTTON_CLASS =
  "flex items-center justify-center gap-2 rounded-xl border border-[#8b6f52]/15 bg-white/50 px-3 py-2 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white aria-pressed:border-[#F0B27A] aria-pressed:bg-[#F0B27A]/25 disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

/** Inspector section for a scatter layer: how many pieces, paint or erase more, new variation. */
export function ScatterPanel({ object }: { object: DioramaObject }) {
  const brush = useDioramaStore((s) => s.brush);
  const brushErase = useDioramaStore((s) => s.brushErase);
  const startBrush = useDioramaStore((s) => s.startBrush);
  const stopBrush = useDioramaStore((s) => s.stopBrush);
  const setBrushErase = useDioramaStore((s) => s.setBrushErase);
  const shuffleScatter = useDioramaStore((s) => s.shuffleScatter);
  const params = scatterParamsOf(object);
  if (!params) return null;

  const brushing = brush?.layerId === object.id;
  const toggle = (erase: boolean) => {
    if (brushing && brushErase === erase) return stopBrush();
    setBrushErase(erase);
    startBrush(params.kind, object.id);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-[#8b6f52]/10 pt-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">Scatter</p>
        <p className="text-xs tabular-nums text-[#4A3421]/60">
          {params.points.length} {params.points.length === 1 ? "piece" : "pieces"}
          {params.points.length >= MAX_SCATTER_POINTS && " (full)"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" disabled={object.locked} aria-pressed={brushing && !brushErase} onClick={() => toggle(false)} className={BUTTON_CLASS}>
          <Paintbrush size={14} />
          Paint
        </button>
        <button type="button" disabled={object.locked} aria-pressed={brushing && brushErase} onClick={() => toggle(true)} className={BUTTON_CLASS}>
          <Eraser size={14} />
          Erase
        </button>
      </div>
      <button type="button" disabled={object.locked} onClick={() => shuffleScatter(object.id)} className={BUTTON_CLASS}>
        <Shuffle size={14} />
        Shuffle variation
      </button>
    </div>
  );
}
