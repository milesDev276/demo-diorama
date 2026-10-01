import { Matrix3, Vector3 } from "three";
import type { DioramaObject, Vector3Tuple } from "../types/diorama.types";
import { getWorldMatrix, getWorldTransform, type Transform } from "./sceneGraph";

/** `userData` of everything the base offers as a surface to place objects on.
 *  Buildings tag their meshes the same way, plus their `objectId`. */
export const BASE_SURFACE = { placementSurface: true };

/** Where the pointer met a surface, in world space. `owner` is the building that was hit, if any. */
export interface SurfaceHit {
  point: Vector3Tuple;
  normal: Vector3Tuple;
  owner?: DioramaObject;
}

export interface SnapOptions {
  /** Grid size in meters, or null when snapping is off. */
  grid: number | null;
  /** How an asset mounts on walls (asset registry). Without it, walls are refused. */
  wallMount?: { offset: number; only?: boolean };
  /** Heading on a flat surface. */
  yaw: number;
  /** True if `yaw` is measured from the owner's heading (new objects line up with the building). */
  yawFollowsOwner: boolean;
  scale: Vector3Tuple;
}

/** Surfaces steeper than this (normal.y below it) count as walls. */
const FLAT_NORMAL_Y = 0.7;

/**
 * Turns a surface hit into the world transform of the object placed there,
 * or null if the object cannot go on that surface.
 *
 * - On a surface facing up the object stands on the hit point.
 * - On a wall a wall-mountable object turns its front to the wall's normal
 *   and moves out by its mount offset. Objects stay upright.
 * - Grid snap works in the frame of the surface's owner and only along the
 *   surface, never along its normal — so things snap along a rotated
 *   building's walls and stay on the surface.
 */
export function resolvePlacement(
  hit: SurfaceHit,
  byId: Map<string, DioramaObject>,
  options: SnapOptions
): Transform | null {
  const normal = new Vector3(...hit.normal).normalize();
  const isFlat = normal.y > FLAT_NORMAL_Y;
  const isWall = Math.abs(normal.y) <= FLAT_NORMAL_Y;
  if (!isFlat && !isWall) return null; // undersides
  if (isWall && !options.wallMount) return null;
  if (isFlat && options.wallMount?.only) return null;

  const point = new Vector3(...hit.point);
  if (options.grid) {
    const grid = options.grid;
    if (hit.owner) {
      const world = getWorldMatrix(hit.owner, byId);
      const inverse = world.clone().invert();
      const local = point.clone().applyMatrix4(inverse);
      const localNormal = normal.clone().applyMatrix3(new Matrix3().setFromMatrix4(inverse)).normalize();
      snapAlongSurface(local, localNormal, grid);
      point.copy(local.applyMatrix4(world));
    } else {
      snapAlongSurface(point, normal, grid);
    }
  }

  const ownerYaw = hit.owner ? getWorldTransform(hit.owner, byId).rotation[1] : 0;
  let yaw: number;
  if (isWall) {
    yaw = Math.atan2(normal.x, normal.z);
    point.addScaledVector(new Vector3(normal.x, 0, normal.z).normalize(), options.wallMount!.offset);
  } else {
    yaw = options.yawFollowsOwner ? ownerYaw + options.yaw : options.yaw;
  }

  return { position: point.toArray(), rotation: [0, yaw, 0], scale: options.scale };
}

function snapAlongSurface(point: Vector3, normal: Vector3, grid: number): void {
  const snap = (value: number) => Math.round(value / grid) * grid;
  if (Math.abs(normal.x) < 0.5) point.x = snap(point.x);
  if (Math.abs(normal.y) < 0.5) point.y = snap(point.y);
  if (Math.abs(normal.z) < 0.5) point.z = snap(point.z);
}
