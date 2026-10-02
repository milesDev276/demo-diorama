import type { Vector3Tuple } from "../../types/diorama.types";
import type { ScatterKindSpec } from "../../assets/scatterKinds";

/** How much each piece's brightness may differ from the modeled color (± fraction). */
const BRIGHTNESS_JITTER = 0.08;

/** 32-bit integer hash (lowbias32), good enough to decorrelate neighbouring inputs. */
function mix(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Three independent values in [0, 1) for one piece, from the layer seed and the piece's position (mm). */
function pieceRandoms(seed: number, point: Vector3Tuple): [number, number, number] {
  const x = Math.round(point[0] * 1000);
  const z = Math.round(point[2] * 1000);
  const h = mix(mix(mix(seed) ^ x) ^ z);
  return [h / 4294967296, mix(h ^ 0x9e3779b9) / 4294967296, mix(h ^ 0x85ebca6b) / 4294967296];
}

export interface PieceVariation {
  yaw: number;
  scale: number;
  brightness: number;
}

/**
 * Heading, size and brightness of one scatter piece. Derived, never stored:
 * the same seed and position always give the same piece, so a scene looks
 * the same everywhere and erasing a piece leaves its neighbours untouched.
 */
export function pieceVariation(seed: number, point: Vector3Tuple, spec: Pick<ScatterKindSpec, "scale">): PieceVariation {
  const [a, b, c] = pieceRandoms(seed, point);
  const [min, max] = spec.scale;
  return {
    yaw: a * Math.PI * 2,
    scale: min + (max - min) * b,
    brightness: 1 + (c * 2 - 1) * BRIGHTNESS_JITTER,
  };
}
