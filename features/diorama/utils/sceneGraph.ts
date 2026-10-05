import { Euler, Matrix3, Matrix4, Quaternion, Vector3 } from "three";
import type { DioramaObject, Vector3Tuple } from "../types/diorama.types";

/**
 * Parent/child rules of the scene (plan/Stage-5-Implementation.md D4). The
 * scene stays a flat array: an attached object carries `parentId`, and its
 * position, rotation and scale are in the parent's frame. Only a building
 * can be a parent and a child cannot have children, so the tree is one
 * level deep. Everything that needs world/local math or subtree logic goes
 * through this file.
 */

export type Transform = Pick<DioramaObject, "position" | "rotation" | "scale">;

export function indexObjects(objects: DioramaObject[]): Map<string, DioramaObject> {
  return new Map(objects.map((object) => [object.id, object]));
}

/** Whether props can be attached to this object. */
export function canBeParent(object: DioramaObject): boolean {
  return object.type === "building" && !object.parentId;
}

/** Whether this object may be attached to a building. Buildings and scatter layers stand on the base only. */
export function canBeChild(object: Pick<DioramaObject, "type">): boolean {
  return object.type !== "building" && object.type !== "scatter";
}

export function getParent(object: DioramaObject, byId: Map<string, DioramaObject>): DioramaObject | undefined {
  return object.parentId ? byId.get(object.parentId) : undefined;
}

export function toMatrix(transform: Transform): Matrix4 {
  return new Matrix4().compose(
    new Vector3(...transform.position),
    new Quaternion().setFromEuler(new Euler(...transform.rotation)),
    new Vector3(...transform.scale)
  );
}

export function fromMatrix(matrix: Matrix4): Transform {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  matrix.decompose(position, quaternion, scale);
  // Upright objects (the normal case) keep a plain yaw, so the inspector's
  // "Y°" stays meaningful past ±90°, where a general Euler conversion flips axes.
  const up = new Vector3(0, 1, 0).applyQuaternion(quaternion);
  const forward = new Vector3(0, 0, 1).applyQuaternion(quaternion);
  const euler = new Euler().setFromQuaternion(quaternion);
  const rotation: Vector3Tuple = up.y > 0.9999 ? [0, Math.atan2(forward.x, forward.z), 0] : [euler.x, euler.y, euler.z];
  return { position: position.toArray(), rotation, scale: scale.toArray() };
}

export function getWorldMatrix(object: DioramaObject, byId: Map<string, DioramaObject>): Matrix4 {
  const parent = getParent(object, byId);
  return parent ? toMatrix(parent).multiply(toMatrix(object)) : toMatrix(object);
}

export function getWorldTransform(object: DioramaObject, byId: Map<string, DioramaObject>): Transform {
  return getParent(object, byId) ? fromMatrix(getWorldMatrix(object, byId)) : object;
}

export function getWorldPosition(object: DioramaObject, byId: Map<string, DioramaObject>): Vector3Tuple {
  return getWorldTransform(object, byId).position;
}

/** A world transform expressed in `parent`'s frame (unchanged without a parent). */
export function toParentFrame(world: Transform, parent: DioramaObject | undefined): Transform {
  if (!parent) return world;
  return fromMatrix(toMatrix(parent).invert().multiply(toMatrix(world)));
}

/** A world-space offset expressed in `parent`'s frame (unchanged without a parent). */
export function deltaToParentFrame(delta: Vector3Tuple, parent: DioramaObject | undefined): Vector3Tuple {
  if (!parent) return delta;
  const inverse = new Matrix3().setFromMatrix4(toMatrix(parent).invert());
  return new Vector3(...delta).applyMatrix3(inverse).toArray();
}

/** `ids` plus the children of every one of them. */
export function getSubtreeIds(objects: DioramaObject[], ids: Iterable<string>): Set<string> {
  const subtree = new Set(ids);
  for (const object of objects) {
    if (object.parentId && subtree.has(object.parentId)) subtree.add(object.id);
  }
  return subtree;
}

/** `ids` without the objects whose parent is also in `ids` — those follow their parent anyway. */
export function getTopLevelIds(objects: DioramaObject[], ids: string[]): string[] {
  const idSet = new Set(ids);
  const byId = indexObjects(objects);
  return ids.filter((id) => {
    const parentId = byId.get(id)?.parentId;
    return !parentId || !idSet.has(parentId);
  });
}

/**
 * The point a multi-selection moves and turns about: the mean of its
 * top-level objects' world positions on X/Z — which a turn about it leaves
 * where it is — at the lowest of their heights. Null if `ids` names nothing.
 */
export function getSelectionCenter(objects: DioramaObject[], ids: string[]): Vector3Tuple | null {
  const byId = indexObjects(objects);
  const positions = getTopLevelIds(objects, ids).flatMap((id) => {
    const object = byId.get(id);
    return object ? [getWorldPosition(object, byId)] : [];
  });
  if (!positions.length) return null;
  const mean = (axis: 0 | 2) => positions.reduce((sum, p) => sum + p[axis], 0) / positions.length;
  return [mean(0), Math.min(...positions.map((p) => p[1])), mean(2)];
}

/** The ids among `ids` that a group turn moves: top-level, standing on the base, not locked. An object on a
 *  building whose building is not selected stays on its wall. */
export function getTurnableIds(objects: DioramaObject[], ids: string[]): Set<string> {
  const byId = indexObjects(objects);
  return new Set(
    getTopLevelIds(objects, ids).filter((id) => {
      const object = byId.get(id);
      return object && !object.parentId && !object.locked;
    })
  );
}

/** A world transform turned by `radians` about the vertical axis through `pivot`. */
export function turnAbout(transform: Transform, pivot: Vector3Tuple, radians: number): Transform {
  const turn = new Matrix4()
    .makeTranslation(pivot[0], 0, pivot[2])
    .multiply(new Matrix4().makeRotationY(radians))
    .multiply(new Matrix4().makeTranslation(-pivot[0], 0, -pivot[2]));
  return fromMatrix(turn.multiply(toMatrix(transform)));
}

/** Children grouped under their parent's id. Objects with a missing parent are left out. */
export function groupChildren(objects: DioramaObject[]): Map<string, DioramaObject[]> {
  const groups = new Map<string, DioramaObject[]>();
  for (const object of objects) {
    if (!object.parentId) continue;
    const siblings = groups.get(object.parentId);
    if (siblings) siblings.push(object);
    else groups.set(object.parentId, [object]);
  }
  return groups;
}

/**
 * Drops every `parentId` that breaks the rules: the parent is missing, is
 * not a building, or is itself attached to something; or the object is a
 * building or a scatter layer, which are never attached. Used on import, so a
 * hand-edited or damaged file can never produce a cycle or a deep tree.
 */
export function repairParentLinks(objects: DioramaObject[]): DioramaObject[] {
  const byId = indexObjects(objects);
  return objects.map((object) => {
    if (!object.parentId) return object;
    const parent = byId.get(object.parentId);
    if (parent && parent.id !== object.id && canBeParent(parent) && canBeChild(object)) return object;
    const detached = { ...object };
    delete detached.parentId;
    return detached;
  });
}
