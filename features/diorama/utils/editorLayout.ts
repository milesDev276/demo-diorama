import type { PanelLayout, PanelSide } from "../types/diorama.types";

/** The side columns' default widths (CSS pixels). */
export const DEFAULT_PANEL_WIDTH: Record<PanelSide, number> = { left: 256, right: 288 };

/** How narrow and how wide each side column may be dragged (plan/Stage-21-Implementation.md D5). */
export const PANEL_WIDTH_RANGE: Record<PanelSide, { min: number; max: number }> = {
  left: { min: 240, max: 420 },
  right: { min: 272, max: 420 },
};

/** A folded column's rail of tab icons. */
export const RAIL_WIDTH = 48;

/** Dragging a column wider stops where the canvas would get narrower than this. */
export const MIN_CANVAS_WIDTH = 480;

/** One keyboard step of a column's edge. */
export const PANEL_WIDTH_STEP = 16;

const STORAGE_KEY = "diorama-editor-layout";

export const clampPanelWidth = (side: PanelSide, width: number, max = PANEL_WIDTH_RANGE[side].max) =>
  Math.round(Math.min(Math.max(width, PANEL_WIDTH_RANGE[side].min), Math.max(max, PANEL_WIDTH_RANGE[side].min)));

function parseLayout(value: unknown, side: PanelSide): PanelLayout | null {
  if (!value || typeof value !== "object") return null;
  const { width, folded } = value as Record<string, unknown>;
  if (typeof width !== "number" || !Number.isFinite(width) || typeof folded !== "boolean") return null;
  return { width: clampPanelWidth(side, width), folded };
}

/** The layout this browser remembers, side by side; a side that is missing or malformed is left out. */
export function readStoredLayout(): Partial<Record<PanelSide, PanelLayout>> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const stored = JSON.parse(raw) as Record<string, unknown>;
    const layout: Partial<Record<PanelSide, PanelLayout>> = {};
    for (const side of ["left", "right"] as const) {
      const parsed = parseLayout(stored?.[side], side);
      if (parsed) layout[side] = parsed;
    }
    return layout;
  } catch {
    return {}; // storage blocked or unreadable: the defaults
  }
}

export function writeStoredLayout(panels: Record<PanelSide, PanelLayout>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  } catch {
    // storage blocked or full: the layout is simply not remembered
  }
}
