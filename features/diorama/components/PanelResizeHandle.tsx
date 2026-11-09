"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useDioramaStore } from "../store/dioramaStore";
import type { PanelSide } from "../types/diorama.types";
import { clampPanelWidth, DEFAULT_PANEL_WIDTH, MIN_CANVAS_WIDTH, PANEL_WIDTH_RANGE, PANEL_WIDTH_STEP } from "../utils/editorLayout";

interface PanelResizeHandleProps {
  side: PanelSide;
  /** What the column is called, for assistive technology: "Library", "Inspector". */
  label: string;
  /** The column's width as shown, which a narrow window can make less than its stored width. */
  width: number;
  /** The canvas column's current width, so a drag stops before the canvas gets too narrow. */
  getCanvasWidth: () => number;
  /** Told when a drag starts and ends, so the column follows the pointer without its width animation. */
  onDraggingChange: (dragging: boolean) => void;
}

/**
 * The inner edge of a side column (plan/Stage-21-Implementation.md D5):
 * drag it to change the column's width, double-click it for the default
 * width. It is a focusable separator: ← and → move the edge, Home and End
 * jump to the narrowest and the widest. It sits in the gap between the
 * column and the canvas.
 */
export function PanelResizeHandle({ side, label, width, getCanvasWidth, onDraggingChange }: PanelResizeHandleProps) {
  const setPanelLayout = useDioramaStore((s) => s.setPanelLayout);
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number; max: number } | null>(null);
  const { min, max } = PANEL_WIDTH_RANGE[side];
  // Moving the edge right widens the left column and narrows the right one.
  const direction = side === "left" ? 1 : -1;

  /** The widest the column may get now: its limit, or where the canvas would fall under its minimum. */
  const widest = () => Math.min(max, width + getCanvasWidth() - MIN_CANVAS_WIDTH);
  const resize = (next: number, limit = widest()) => setPanelLayout(side, { width: clampPanelWidth(side, next, limit) });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: width, max: widest() };
    onDraggingChange(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    resize(drag.startWidth + direction * (event.clientX - drag.startX), drag.max);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    onDraggingChange(false);
  };

  // Folding the column (\) mid-drag unmounts the edge before the pointer is released.
  const onDraggingChangeRef = useRef(onDraggingChange);
  useEffect(() => {
    onDraggingChangeRef.current = onDraggingChange;
  }, [onDraggingChange]);
  useEffect(
    () => () => {
      if (dragRef.current) onDraggingChangeRef.current(false);
    },
    []
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") resize(width - direction * PANEL_WIDTH_STEP);
    else if (event.key === "ArrowRight") resize(width + direction * PANEL_WIDTH_STEP);
    else if (event.key === "Home") resize(min);
    else if (event.key === "End") resize(max);
    else return;
    event.preventDefault();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`${label} width`}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title="Drag to resize · double-click for the default width"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={() => resize(DEFAULT_PANEL_WIDTH[side])}
      onKeyDown={handleKeyDown}
      className={cn(
        // In the gap between the column and the canvas: the negative margins cancel the extra flex gap it adds.
        "group relative -mx-4 hidden w-4 shrink-0 cursor-col-resize touch-none rounded-full outline-none",
        side === "left" ? "md:block" : "lg:block"
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-6 left-1/2 w-1 -translate-x-1/2 rounded-full bg-[#8b6f52]/0 transition-colors group-hover:bg-[#8b6f52]/25 group-focus-visible:bg-[#F0B27A] group-active:bg-[#F0B27A]"
      />
    </div>
  );
}
