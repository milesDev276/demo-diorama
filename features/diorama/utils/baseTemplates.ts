import type { CameraPreset, DioramaBase } from "../types/diorama.types";
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
  corner: {
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
  },
};

export const BASE_ORDER: DioramaBase[] = ["street", "corner"];
