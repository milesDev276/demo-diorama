import { Euler, Vector3 } from "three";
import { RUN_TYPES } from "../types/diorama.types";
import type { DioramaObject, DioramaObjectType, RunParams, RunType, Vector3Tuple } from "../types/diorama.types";

/** Most pieces one run may have; also the longest row a drag lays. */
export const MAX_RUN_PIECES = 40;

const roundMm = (n: number) => Math.round(n * 1000) / 1000;

export function isRunType(type: DioramaObjectType): type is RunType {
  return (RUN_TYPES as readonly DioramaObjectType[]).includes(type);
}

/** Valid run params, or undefined for anything else (the object is then one piece). */
export function normalizeRunParams(raw: unknown): RunParams | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const pieces = (raw as Record<string, unknown>).pieces;
  if (typeof pieces !== "number" || !Number.isFinite(pieces)) return undefined;
  return { pieces: Math.min(MAX_RUN_PIECES, Math.max(1, Math.round(pieces))) };
}

/** Where each piece's middle lies on the run's X axis, for `pieces` pieces of length `tile`. */
export function runPieceOffsets(pieces: number, tile: number): number[] {
  return Array.from({ length: pieces }, (_, i) => (i - (pieces - 1) / 2) * tile);
}

/**
 * The position of a run that changes from `before` to `after` pieces with
 * its left end (−X) kept in place: the middle moves half the change along
 * the run's own X axis, in the frame its position is in.
 */
export function resizedRunPosition(object: Pick<DioramaObject, "position" | "rotation" | "scale">, before: number, after: number, tile: number): Vector3Tuple {
  const shift = new Vector3(((after - before) * tile * object.scale[0]) / 2, 0, 0).applyEuler(new Euler(...object.rotation));
  return [roundMm(object.position[0] + shift.x), roundMm(object.position[1] + shift.y), roundMm(object.position[2] + shift.z)];
}
