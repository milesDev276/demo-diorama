import type { CameraPreset, DioramaBase, DioramaEnvironment } from "../types/diorama.types";
import { DEFAULT_PLOT_SIZE, SURFACE_CELL, surfaceSize } from "./surfaceMap";
import { STREET_PLOT } from "./worldScale";

/**
 * Everything the editor sizes to the diorama's base. One record per base,
 * so the ground, spawn area, grid, camera framing and shadow coverage
 * always agree with each other. All values are meters.
 */
export interface BaseTemplate {
  id: DioramaBase;
  label: string;
  description: string;
  width: number;
  depth: number;
  /** Where newly added objects may land, inset from the edges. */
  spawnBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Golden-angle spiral that fans new objects out from the middle of the spawn area. */
  spawnSpread: { start: number; step: number; max: number; jitter: number };
  /** Height of the editing grid, just above the walkable surface. */
  gridY: number;
  /** Orthographic zoom (screen pixels per meter) of each camera preset. */
  presetZoom: Record<CameraPreset, number>;
  /** "Focus selected" frames at least this radius around the selection. */
  focusRadius: number;
  /** Half-size of the sun's shadow frustum; smaller = sharper shadows. */
  shadowExtent: number;
}

const CORNER_TEMPLATE: BaseTemplate = {
  id: "corner",
  label: "Street corner",
  description: "A 16 × 16 m corner plot with roads on two sides.",
  width: 16,
  depth: 16,
  // The lot and both sidewalks (plan/Hero-Layout.md §1); the roads stay clear.
  spawnBounds: { minX: -7, maxX: 3, minZ: -7, maxZ: 3 },
  spawnSpread: { start: 1.2, step: 0.7, max: 4.5, jitter: 0.6 },
  gridY: 0.01,
  presetZoom: { isometric: 34, front: 44, side: 44, top: 44 },
  focusRadius: 3,
  shadowExtent: 14,
};

/** How far new objects stay from the edge of a plot. */
const PLOT_SPAWN_INSET = 1;

/**
 * The template of a plot `width` × `depth` meters. Its framing and shadow
 * coverage are the corner base's, scaled to the plot's size.
 */
function createPlotTemplate(width: number, depth: number): BaseTemplate {
  const largest = Math.max(width, depth);
  const scale = CORNER_TEMPLATE.width / largest;
  const { presetZoom } = CORNER_TEMPLATE;
  return {
    id: "plot",
    label: "Free plot",
    description: "A plot whose ground you paint: roads, sidewalks, paving, grass.",
    width,
    depth,
    spawnBounds: {
      minX: -width / 2 + PLOT_SPAWN_INSET,
      maxX: width / 2 - PLOT_SPAWN_INSET,
      minZ: -depth / 2 + PLOT_SPAWN_INSET,
      maxZ: depth / 2 - PLOT_SPAWN_INSET,
    },
    spawnSpread: CORNER_TEMPLATE.spawnSpread,
    gridY: CORNER_TEMPLATE.gridY,
    presetZoom: {
      isometric: presetZoom.isometric * scale,
      front: (presetZoom.front * CORNER_TEMPLATE.width) / width,
      side: (presetZoom.side * CORNER_TEMPLATE.depth) / depth,
      top: presetZoom.top * scale,
    },
    focusRadius: CORNER_TEMPLATE.focusRadius,
    shadowExtent: CORNER_TEMPLATE.shadowExtent / scale,
  };
}

/** One template per base. The `plot` entry is the default plot size; a scene's own plot comes from getBaseTemplate. */
export const BASE_TEMPLATES: Record<DioramaBase, BaseTemplate> = {
  street: {
    id: "street",
    label: "Street strip",
    description: "A long lot along a straight road, about 50 × 27 m.",
    width: STREET_PLOT.width,
    depth: STREET_PLOT.depth,
    spawnBounds: {
      minX: -STREET_PLOT.width / 2 + 2.1,
      maxX: STREET_PLOT.width / 2 - 2.1,
      minZ: STREET_PLOT.z.lot + 1.5,
      maxZ: STREET_PLOT.z.road - 0.6,
    },
    spawnSpread: { start: 3.6, step: 2.1, max: 18, jitter: 1.8 },
    gridY: 0.072,
    presetZoom: { isometric: 12, front: 88 / 6, side: 88 / 6, top: 100 / 6 },
    focusRadius: 9,
    shadowExtent: 32,
  },
  corner: CORNER_TEMPLATE,
  plot: createPlotTemplate(DEFAULT_PLOT_SIZE.cols * SURFACE_CELL, DEFAULT_PLOT_SIZE.rows * SURFACE_CELL),
};

export const BASE_ORDER: DioramaBase[] = ["plot", "corner", "street"];

const plotTemplates = new Map<string, BaseTemplate>();

/**
 * The template of a scene's base. A plot is as large as its surface map;
 * the same size always gives the same object, so it is safe as an effect
 * dependency.
 */
export function getBaseTemplate(environment: Pick<DioramaEnvironment, "base" | "surface">): BaseTemplate {
  if (environment.base !== "plot" || !environment.surface) return BASE_TEMPLATES[environment.base];
  const { width, depth } = surfaceSize(environment.surface);
  const key = `${width}x${depth}`;
  let template = plotTemplates.get(key);
  if (!template) {
    template = createPlotTemplate(width, depth);
    plotTemplates.set(key, template);
  }
  return template;
}
