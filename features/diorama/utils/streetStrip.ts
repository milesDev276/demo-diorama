import type { DioramaObject, SurfaceKind, SurfaceMap } from "../types/diorama.types";
import { SURFACE_KIND_SPECS } from "../assets/surfaceKinds";
import { levelAt, liftObjects } from "./surfaceMap";

/**
 * The retired street-strip base, as the plot an old scene on it is read
 * into: a long lot along a straight road, 50.4 × 27 m, with its road 0.24 m
 * below the sidewalk. Everything here describes old files and is fixed.
 */
const COLS = 102; // 51 m: the strip's 50.4 m on the 0.5 m grid
const ROWS = 54;

/** Rows from the back edge at which each band begins: 3 m of grass, the lot, a 3 m sidewalk, the road. */
const BANDS: Array<[SurfaceKind, number]> = [
  ["grass", 0],
  ["gravel", 6],
  ["sidewalk", 35],
  ["asphalt", 41],
];

const STRIP_ROAD_Y = -0.24;
/** How close (meters) to the strip's road an object has to be to count as standing on it. */
const ON_ROAD = 0.005;

/** The strip's ground as a plot's surface map. */
export function createStripSurface(): SurfaceMap {
  return {
    cols: COLS,
    rows: Array.from({ length: ROWS }, (_, j) => {
      const kind = BANDS.reduce((found, [next, start]) => (j >= start ? next : found), BANDS[0][0]);
      return SURFACE_KIND_SPECS[kind].code.repeat(COLS);
    }),
  };
}

/** True if a scene file's environment names no base this app has: before bases existed, and while the strip was one, that was the strip. */
export function isStreetStrip(base: unknown, known: readonly unknown[]): boolean {
  return !known.includes(base);
}

/** The strip's objects on the plot: whatever stood on the strip's road now stands on the ground that is there. */
export function seatStripObjects(objects: DioramaObject[], surface: SurfaceMap): DioramaObject[] {
  return liftObjects(objects, (x, y, z) => {
    if (Math.abs(y - STRIP_ROAD_Y) > ON_ROAD) return 0;
    const level = levelAt(surface, x, z);
    return level === undefined ? 0 : level - y;
  });
}
