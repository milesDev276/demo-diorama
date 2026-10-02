import { SCATTER_KINDS } from "../types/diorama.types";
import type { ScatterKind, ScatterParams, Vector3Tuple } from "../types/diorama.types";

/** Most pieces one layer may hold. Keeps a single layer's file size and instance buffer bounded. */
export const MAX_SCATTER_POINTS = 1500;

/** How far (meters) a piece may sit from its layer's origin. Matches the validator's position limit. */
const POINT_LIMIT = 60;

const roundMm = (n: number) => Math.round(n * 1000) / 1000;

/** Points are stored to the millimeter; the per-piece variation hashes the same rounded values. */
export function roundPoint(point: Vector3Tuple): Vector3Tuple {
  return [roundMm(point[0]), roundMm(point[1]), roundMm(point[2])];
}

function isPoint(value: unknown): value is Vector3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= POINT_LIMIT)
  );
}

/** A fresh random seed for a new layer. */
export function newScatterSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

/**
 * Turns anything into valid scatter params, or null if the kind is unknown
 * (the layer is then dropped). Bad points are skipped, the list is capped
 * at MAX_SCATTER_POINTS, a bad seed becomes 1.
 */
export function normalizeScatterParams(raw: unknown): ScatterParams | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!(SCATTER_KINDS as readonly unknown[]).includes(r.kind)) return null;
  const seed = typeof r.seed === "number" && Number.isFinite(r.seed) ? Math.abs(Math.round(r.seed)) % 0x7fffffff : 1;
  const points = (Array.isArray(r.points) ? r.points : []).filter(isPoint).slice(0, MAX_SCATTER_POINTS).map(roundPoint);
  return { kind: r.kind as ScatterKind, seed, points };
}

/** Small deterministic generator (mulberry32), so patches built from a seed are the same everywhere. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A flat, roughly round patch of pieces around the origin: random points no
 * closer than `spacing`, denser toward the middle. Used for the keyboard
 * path of the brush, built-in kits and starter scenes.
 */
export function scatterPatch(seed: number, radius: number, spacing: number, maxPoints = 200): Vector3Tuple[] {
  const random = seededRandom(seed);
  const points: Vector3Tuple[] = [];
  const attempts = maxPoints * 12;
  for (let i = 0; i < attempts && points.length < maxPoints; i++) {
    // r = radius · u (not √u) puts more pieces near the middle, so the patch fades out at its rim.
    const angle = random() * Math.PI * 2;
    const r = radius * random();
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (points.every(([px, , pz]) => (px - x) ** 2 + (pz - z) ** 2 >= spacing * spacing)) {
      points.push(roundPoint([x, 0, z]));
    }
  }
  return points;
}

/**
 * Pieces along a line from `from` to `to` on the ground, wandering up to
 * `spread` to either side — weeds along a wall foot or a curb.
 */
export function scatterLine(
  seed: number,
  from: [number, number],
  to: [number, number],
  spacing: number,
  spread: number
): Vector3Tuple[] {
  const random = seededRandom(seed);
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const [dx, dz] = [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
  const points: Vector3Tuple[] = [];
  for (let t = random() * spacing; t < length; t += spacing * (0.7 + random() * 0.9)) {
    const side = (random() * 2 - 1) * spread;
    points.push(roundPoint([from[0] + dx * t - dz * side, 0, from[1] + dz * t + dx * side]));
  }
  return points;
}

/** How far the farthest piece lies from the layer's origin on the ground plane. */
export function scatterRadius(points: Vector3Tuple[]): number {
  let max = 0;
  for (const [x, , z] of points) max = Math.max(max, Math.hypot(x, z));
  return max;
}
