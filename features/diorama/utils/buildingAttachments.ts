import { BUILDING_SIDES } from "../types/diorama.types";
import type { BuildingParams, BuildingSide, DioramaObject, Vector3Tuple } from "../types/diorama.types";
import { BUILDING_GRID, buildingSize } from "./buildingParams";

/**
 * What happens to a building's attachments when its bays or floors change
 * (plan/Stage-14-Implementation.md D1). An attachment's position is in the
 * building's frame — origin at the middle of the footprint, on the ground —
 * so a wall that moves out leaves it behind unless it is moved too.
 */

type Size = ReturnType<typeof buildingSize>;

/** Slack (meters) when deciding whether something stands on the roof or within a side's length. */
const TOLERANCE = 0.05;

const roundMm = (n: number) => Math.round(n * 1000) / 1000;

/** Unit vectors of each side: `out` points away from the wall, `along` runs left to right as seen from outside. */
const SIDE_AXES: Record<BuildingSide, { out: [number, number]; along: [number, number] }> = {
  front: { out: [0, 1], along: [1, 0] },
  right: { out: [1, 0], along: [0, -1] },
  back: { out: [0, -1], along: [-1, 0] },
  left: { out: [-1, 0], along: [0, 1] },
};

/** Half the building across a side's wall, and the side's own length. */
function sideExtent(size: Size, side: BuildingSide): { half: number; length: number } {
  return side === "front" || side === "back"
    ? { half: size.depth / 2, length: size.width }
    : { half: size.width / 2, length: size.depth };
}

/** A point of the building's frame seen from one side: how far out from its wall, and how far from its left end. */
function toSide(size: Size, side: BuildingSide, x: number, z: number): { out: number; fromLeft: number } {
  const { out, along } = SIDE_AXES[side];
  const { half, length } = sideExtent(size, side);
  return { out: x * out[0] + z * out[1] - half, fromLeft: x * along[0] + z * along[1] + length / 2 };
}

function fromSide(size: Size, side: BuildingSide, out: number, fromLeft: number): [number, number] {
  const axes = SIDE_AXES[side];
  const { half, length } = sideExtent(size, side);
  const distance = half + out;
  const along = fromLeft - length / 2;
  return [along * axes.along[0] + distance * axes.out[0], along * axes.along[1] + distance * axes.out[1]];
}

/** The wall a point belongs to: the one whose plane is nearest, counting how far the point is past the wall's ends. */
function nearestSide(size: Size, x: number, z: number): BuildingSide {
  let best: BuildingSide = "front";
  let bestScore = Infinity;
  for (const side of BUILDING_SIDES) {
    const { out, fromLeft } = toSide(size, side, x, z);
    const { length } = sideExtent(size, side);
    const score = Math.abs(out) + Math.max(0, -fromLeft, fromLeft - length);
    if (score < bestScore) {
      best = side;
      bestScore = score;
    }
  }
  return best;
}

/** A roof coordinate after the roof's half-size changed: the same distance from the nearer edge, never past the middle. */
function refitOnRoof(value: number, halfBefore: number, halfAfter: number): number {
  const sign = value < 0 ? -1 : 1;
  return sign * Math.max(0, halfAfter - (halfBefore - Math.abs(value)));
}

function refitPosition([x, y, z]: Vector3Tuple, before: Size, after: Size): Vector3Tuple {
  const onRoof =
    y >= before.wallHeight - TOLERANCE &&
    Math.abs(x) <= before.width / 2 + TOLERANCE &&
    Math.abs(z) <= before.depth / 2 + TOLERANCE;
  if (onRoof) {
    return [
      roundMm(refitOnRoof(x, before.width / 2, after.width / 2)),
      roundMm(y + after.wallHeight - before.wallHeight),
      roundMm(refitOnRoof(z, before.depth / 2, after.depth / 2)),
    ];
  }

  const side = nearestSide(before, x, z);
  const place = toSide(before, side, x, z);
  const lengthBefore = sideExtent(before, side).length;
  const lengthAfter = sideExtent(after, side).length;
  // Bays are added to and taken from the right end of a side; what stood on a bay that is gone moves in by whole bays.
  let fromLeft = place.fromLeft;
  const past = Math.min(fromLeft, lengthBefore) - lengthAfter;
  if (past > 0) fromLeft -= Math.ceil(past / BUILDING_GRID.bay - 1e-6) * BUILDING_GRID.bay;

  // Floors come off the top: what hung on one of them moves down by whole floors.
  let height = y;
  const above = y - after.wallHeight;
  if (after.wallHeight < before.wallHeight && above > 0) {
    height = Math.max(0, y - Math.ceil(above / BUILDING_GRID.upperFloor) * BUILDING_GRID.upperFloor);
  }

  const [nextX, nextZ] = fromSide(after, side, place.out, fromLeft);
  return [roundMm(nextX), roundMm(height), roundMm(nextZ)];
}

/**
 * The scene's objects after building `buildingId` changed from `before` to
 * `after`: its attachments keep their wall, their distance from it and their
 * bay; what stands on the roof keeps its distance from the nearer roof edge
 * and rises or sinks with the walls. Returns the same array if the building
 * kept its size.
 */
export function refitAttachments(
  objects: DioramaObject[],
  buildingId: string,
  before: BuildingParams,
  after: BuildingParams
): DioramaObject[] {
  const from = buildingSize(before);
  const to = buildingSize(after);
  if (from.width === to.width && from.depth === to.depth && from.wallHeight === to.wallHeight) return objects;
  return objects.map((object) =>
    object.parentId === buildingId ? { ...object, position: refitPosition(object.position, from, to) } : object
  );
}
