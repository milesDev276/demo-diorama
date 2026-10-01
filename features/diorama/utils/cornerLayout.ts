/**
 * The street-corner base in meters, from plan/Hero-Layout.md §1–2 (the
 * source of truth — change the sheet first). X right, Z toward the front;
 * the lot and sidewalks are at y = 0, the roads one curb lower.
 */
export const CORNER = {
  /** Half the base size: the base spans −8 … 8 on X and Z. */
  half: 8,
  roadY: -0.15,
  /** Underside of the surface slabs, where the dark plinth begins. */
  slabBottom: -0.25,
  plinthBottom: -1.35,
  /** The lot ends and the sidewalks begin at this x (right) / z (front). */
  lotEdge: 2,
  /** The sidewalks end and the roads begin at this x (right) / z (front). */
  roadEdge: 3.5,
  curbWidth: 0.15,
  /** Crosswalk over the right road; its stripes run along Z. */
  crosswalk: { z0: 0.5, z1: 3.0, firstX: 3.725, stripe: 0.45, pitch: 0.9, count: 5 },
  /** Curb ramp where the crosswalk meets the sidewalk corner. */
  ramp: { x0: 2.9, lip: 0.02 },
  stopLine: { x0: 5.75, x1: 7.45, z0: -0.5, z1: -0.05 },
  /** 止まれ, read by a driver heading +Z toward the stop line. */
  tomare: { x0: 5.9, x1: 7.4, z0: -3.5, z1: -1.0 },
  /** Far-side edge lines (路側帯), 0.15 m wide. */
  edgeLine: { near: 7.45, far: 7.6, rightRoadEndZ: -0.5 },
  manhole: { x: -2, z: 5.8 },
  /** 側溝 grates against the curbs: along the front road (by x) and the right road (by z). */
  grates: { offset: 3.65, frontXs: [-6, -2, 1], rightZs: [-6, -3] },
} as const;
