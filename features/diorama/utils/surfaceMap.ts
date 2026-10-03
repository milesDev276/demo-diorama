import { Vector3 } from "three";
import type { DioramaObject, SurfaceKind, SurfaceMap, Vector3Tuple } from "../types/diorama.types";
import { SURFACE_KIND_SPECS, surfaceKindOfCode } from "../assets/surfaceKinds";
import { scatterParamsOf } from "./objectParams";
import { roundPoint } from "./scatterParams";
import { getWorldMatrix, indexObjects } from "./sceneGraph";

/**
 * The ground of a `plot` base as data: a grid of square cells centered on
 * the origin, one surface kind per cell. Everything here is pure — the
 * geometry is built from the map in objects/ground/surfaceGeometry.ts.
 */

/** Edge length of a cell in meters: the editor's default grid. */
export const SURFACE_CELL = 0.5;

/** Smallest and largest plot edge, in cells (8 … 32 m). */
const MIN_CELLS = 16;
const MAX_CELLS = 64;

export interface PlotSize {
  id: string;
  label: string;
  cols: number;
  rows: number;
}

/** The plot sizes the Scene panel offers. */
export const PLOT_SIZES: PlotSize[] = [
  { id: "12", label: "12 m", cols: 24, rows: 24 },
  { id: "16", label: "16 m", cols: 32, rows: 32 },
  { id: "20", label: "20 m", cols: 40, rows: 40 },
  { id: "24x16", label: "24 × 16", cols: 48, rows: 32 },
];

export const DEFAULT_PLOT_SIZE = PLOT_SIZES[1];

/** Width of a two-way neighborhood road and of its sidewalk, in cells (4.5 m and 1.5 m, as on the corner base). */
const ROAD_CELLS = 9;
const SIDEWALK_CELLS = 3;
/** A back alley (路地): a 3 m lane with a concrete gutter strip on each side. */
const ALLEY_CELLS = 6;

export type SurfaceLayout = "lot" | "street" | "corner" | "alley";

/** Starting layouts: which kind the cell in column `i`, row `j` is. */
const LAYOUTS: Record<SurfaceLayout, { label: string; kindAt: (i: number, j: number, cols: number, rows: number) => SurfaceKind }> = {
  lot: { label: "Empty lot", kindAt: () => "gravel" },
  street: {
    label: "Street",
    kindAt: (_i, j, _cols, rows) => {
      const fromFront = rows - 1 - j;
      if (fromFront < ROAD_CELLS) return "asphalt";
      return fromFront < ROAD_CELLS + SIDEWALK_CELLS ? "sidewalk" : "gravel";
    },
  },
  corner: {
    label: "Corner",
    kindAt: (i, j, cols, rows) => {
      const fromEdge = Math.min(rows - 1 - j, cols - 1 - i);
      if (fromEdge < ROAD_CELLS) return "asphalt";
      return fromEdge < ROAD_CELLS + SIDEWALK_CELLS ? "sidewalk" : "gravel";
    },
  },
  alley: {
    label: "Alley",
    kindAt: (i, _j, cols) => {
      const fromLane = Math.abs(i + 0.5 - cols / 2);
      if (fromLane < ALLEY_CELLS / 2) return "asphalt";
      return fromLane < ALLEY_CELLS / 2 + 1 ? "concrete" : "gravel";
    },
  },
};

export const SURFACE_LAYOUT_ORDER: SurfaceLayout[] = ["lot", "street", "corner", "alley"];

/** What a new plot starts with. */
export const DEFAULT_PLOT_LAYOUT: SurfaceLayout = "street";

export function surfaceLayoutLabel(layout: SurfaceLayout): string {
  return LAYOUTS[layout].label;
}

/** A new map of `cols` × `rows` cells in one of the starting layouts. */
export function createSurface(layout: SurfaceLayout, cols: number = DEFAULT_PLOT_SIZE.cols, rows: number = DEFAULT_PLOT_SIZE.rows): SurfaceMap {
  const { kindAt } = LAYOUTS[layout];
  return {
    cols,
    rows: Array.from({ length: rows }, (_, j) =>
      Array.from({ length: cols }, (_, i) => SURFACE_KIND_SPECS[kindAt(i, j, cols, rows)].code).join("")
    ),
  };
}

/** The plot's size in meters. */
export function surfaceSize(surface: SurfaceMap): { width: number; depth: number } {
  return { width: surface.cols * SURFACE_CELL, depth: surface.rows.length * SURFACE_CELL };
}

const FALLBACK_CODE = SURFACE_KIND_SPECS.gravel.code;

/**
 * A valid map from untrusted data, or undefined if it is not a map at all.
 * Letters this app does not know become gravel; short rows are padded.
 */
export function normalizeSurface(raw: unknown): SurfaceMap | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { cols, rows } = raw as Record<string, unknown>;
  if (typeof cols !== "number" || !Number.isInteger(cols) || cols < MIN_CELLS || cols > MAX_CELLS) return undefined;
  if (!Array.isArray(rows) || rows.length < MIN_CELLS || rows.length > MAX_CELLS) return undefined;
  if (!rows.every((row) => typeof row === "string")) return undefined;
  return {
    cols,
    rows: (rows as string[]).map((row) =>
      Array.from({ length: cols }, (_, i) => (surfaceKindOfCode(row[i] ?? "") ? row[i] : FALLBACK_CODE)).join("")
    ),
  };
}

/** The kind of the cell in column `i`, row `j`, or undefined outside the map. */
export function kindAt(surface: SurfaceMap, i: number, j: number): SurfaceKind | undefined {
  if (i < 0 || j < 0 || i >= surface.cols || j >= surface.rows.length) return undefined;
  return surfaceKindOfCode(surface.rows[j][i]);
}

/** The cell [column, row] under a world position, or null outside the plot. */
export function cellAt(surface: SurfaceMap, x: number, z: number): [number, number] | null {
  const { width, depth } = surfaceSize(surface);
  const i = Math.floor((x + width / 2) / SURFACE_CELL);
  const j = Math.floor((z + depth / 2) / SURFACE_CELL);
  return i < 0 || j < 0 || i >= surface.cols || j >= surface.rows.length ? null : [i, j];
}

/** Height of the ground under a world position, or undefined outside the plot. */
export function levelAt(surface: SurfaceMap, x: number, z: number): number | undefined {
  const cell = cellAt(surface, x, z);
  const kind = cell && kindAt(surface, cell[0], cell[1]);
  return kind ? SURFACE_KIND_SPECS[kind].level : undefined;
}

/** The first column or row of a brush `size` cells wide that is centered on cell `center`. */
export function brushStart(center: number, size: number): number {
  return center - Math.floor((size - 1) / 2);
}

/**
 * The map with a square of `size` × `size` cells around cell (`i`, `j`)
 * set to `kind`. Returns the same map if nothing changed.
 */
export function paintCells(surface: SurfaceMap, i: number, j: number, size: number, kind: SurfaceKind): SurfaceMap {
  const code = SURFACE_KIND_SPECS[kind].code;
  const i0 = Math.max(0, brushStart(i, size));
  const i1 = Math.min(surface.cols, brushStart(i, size) + size);
  const j0 = Math.max(0, brushStart(j, size));
  const j1 = Math.min(surface.rows.length, brushStart(j, size) + size);
  if (i0 >= i1 || j0 >= j1) return surface;
  let changed = false;
  const rows = surface.rows.map((row, rowIndex) => {
    if (rowIndex < j0 || rowIndex >= j1) return row;
    const painted = row.slice(0, i0) + code.repeat(i1 - i0) + row.slice(i1);
    if (painted !== row) changed = true;
    return painted;
  });
  return changed ? { cols: surface.cols, rows } : surface;
}

/**
 * The map at a new size, keeping its middle where it is. Cells that fall
 * off are dropped; new cells repeat the nearest edge cell, so a road that
 * ran off the plot still does.
 */
export function resizeSurface(surface: SurfaceMap, cols: number, rows: number): SurfaceMap {
  if (cols === surface.cols && rows === surface.rows.length) return surface;
  const offsetI = Math.round((surface.cols - cols) / 2);
  const offsetJ = Math.round((surface.rows.length - rows) / 2);
  const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));
  return {
    cols,
    rows: Array.from({ length: rows }, (_, j) => {
      const source = surface.rows[clamp(j + offsetJ, surface.rows.length - 1)];
      return Array.from({ length: cols }, (_, i) => source[clamp(i + offsetI, surface.cols - 1)]).join("");
    }),
  };
}

/** How close (meters) to the ground an object has to be to count as standing on it. */
const ON_GROUND = 0.005;

/**
 * Objects after the ground changed from `before` to `after`: whatever stood
 * on a cell whose level changed moves with it — top-level objects by their
 * origin, scatter layers piece by piece. Objects that floated or were sunk
 * on purpose, and attachments of buildings, are left alone. Returns the
 * same array if nothing moved.
 */
export function reseatObjects(objects: DioramaObject[], before: SurfaceMap, after: SurfaceMap): DioramaObject[] {
  if (before === after) return objects;
  const lift = (x: number, y: number, z: number): number => {
    const from = levelAt(before, x, z);
    const to = levelAt(after, x, z);
    return from === undefined || to === undefined || from === to || Math.abs(y - from) > ON_GROUND ? 0 : to - from;
  };

  const byId = indexObjects(objects);
  const point = new Vector3();
  let moved = false;
  const next = objects.map((object) => {
    if (object.parentId) return object;
    const scatter = scatterParamsOf(object);
    if (scatter) {
      const toWorld = getWorldMatrix(object, byId);
      const toLocal = toWorld.clone().invert();
      let layerMoved = false;
      const points = scatter.points.map((local): Vector3Tuple => {
        point.set(...local).applyMatrix4(toWorld);
        const dy = lift(point.x, point.y, point.z);
        if (!dy) return local;
        layerMoved = true;
        point.y += dy;
        return roundPoint(point.applyMatrix4(toLocal).toArray());
      });
      if (!layerMoved) return object;
      moved = true;
      return { ...object, params: { ...scatter, points } };
    }
    const [x, y, z] = object.position;
    const dy = lift(x, y, z);
    if (!dy) return object;
    moved = true;
    return { ...object, position: [x, y + dy, z] as Vector3Tuple };
  });
  return moved ? next : objects;
}
