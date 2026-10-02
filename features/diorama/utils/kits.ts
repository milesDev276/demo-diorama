import { Matrix4 } from "three";
import type { DioramaObject, Kit, Vector3Tuple } from "../types/diorama.types";
import { createId } from "./id";
import { normalizeObjects } from "./sceneValidator";
import {
  canBeChild,
  fromMatrix,
  getTopLevelIds,
  getWorldTransform,
  indexObjects,
  toMatrix,
  toParentFrame,
  type Transform,
} from "./sceneGraph";

/**
 * Kits (plan/Stage-6-Implementation.md D5): a group of objects saved with
 * their relative transforms and placed again in one go. A kit's objects are
 * ordinary scene objects in the kit's frame — the anchor is the origin — so
 * the scene validator checks them and attachments keep their `parentId`
 * inside the kit.
 */

export const KIT_NAME_MAX = 40;

const roundMm = (n: number) => Math.round(n * 1000) / 1000;

/**
 * A kit from the selected objects. The selection's top-level objects come
 * with their attachments. The anchor is the middle of the top-level objects'
 * world positions on X/Z at the lowest of their heights, so the kit lands
 * on whatever flat surface it is placed on. A selected attachment whose
 * building is not selected is saved on its own, in world terms.
 */
export function createKit(objects: DioramaObject[], ids: string[], name: string): Kit | null {
  const byId = indexObjects(objects);
  const roots = getTopLevelIds(objects, ids)
    .map((id) => byId.get(id))
    .filter((o): o is DioramaObject => o !== undefined);
  if (!roots.length) return null;

  const worlds = roots.map((object) => ({ object, world: getWorldTransform(object, byId) }));
  const xs = worlds.map(({ world }) => world.position[0]);
  const zs = worlds.map(({ world }) => world.position[2]);
  const anchor: Vector3Tuple = [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    Math.min(...worlds.map(({ world }) => world.position[1])),
    (Math.min(...zs) + Math.max(...zs)) / 2,
  ];

  const kitObjects: DioramaObject[] = [];
  for (const { object, world } of worlds) {
    const root: DioramaObject = {
      ...object,
      ...world,
      position: [
        roundMm(world.position[0] - anchor[0]),
        roundMm(world.position[1] - anchor[1]),
        roundMm(world.position[2] - anchor[2]),
      ],
      locked: false,
    };
    delete root.parentId;
    kitObjects.push(root);
    for (const child of objects) {
      if (child.parentId === object.id) kitObjects.push({ ...child, locked: false });
    }
  }

  const trimmed = name.trim().slice(0, KIT_NAME_MAX);
  return { id: createId("kit"), name: trimmed || "My kit", objects: kitObjects };
}

/** True if the kit can only go on the base: it holds a building or a scatter layer, which are never attached. */
export function kitNeedsBase(kit: Kit): boolean {
  return kit.objects.some((object) => !object.parentId && !canBeChild(object));
}

/**
 * The scene objects of a kit placed with its anchor at `anchor` (world).
 * With a `parent`, the kit's top-level objects attach to that building.
 * Every object gets a new id; attachments inside the kit are re-linked to
 * the copies. Returns the new objects and the ids of the top-level ones.
 */
export function instantiateKit(
  kit: Kit,
  anchor: Transform,
  parent?: DioramaObject
): { objects: DioramaObject[]; rootIds: string[] } {
  const anchorMatrix = toMatrix(anchor);
  const newIdOf = new Map<string, string>();
  const objects: DioramaObject[] = [];
  const rootIds: string[] = [];

  for (const source of kit.objects) {
    if (source.parentId) continue;
    const world = fromMatrix(new Matrix4().multiplyMatrices(anchorMatrix, toMatrix(source)));
    const attach = parent && canBeChild(source);
    const id = createId();
    newIdOf.set(source.id, id);
    rootIds.push(id);
    const object: DioramaObject = { ...source, ...(attach ? toParentFrame(world, parent) : world), id };
    if (attach) object.parentId = parent.id;
    objects.push(object);
  }
  for (const source of kit.objects) {
    const parentCopy = source.parentId && newIdOf.get(source.parentId);
    if (parentCopy) objects.push({ ...source, id: createId(), parentId: parentCopy });
  }
  return { objects, rootIds };
}

/** How far the kit reaches from its anchor on the ground plane, for the placement ghost's ring. */
export function kitRadius(kit: Kit): number {
  let max = 0;
  for (const object of kit.objects) {
    if (!object.parentId) max = Math.max(max, Math.hypot(object.position[0], object.position[2]));
  }
  return max + 0.6;
}

/** Validates stored kits; a damaged kit is dropped, the rest load. */
export function normalizeKits(raw: unknown): Kit[] {
  if (!Array.isArray(raw)) return [];
  const kits: Kit[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const r = entry as Record<string, unknown>;
    if (typeof r.id !== "string" || !r.id || seen.has(r.id) || !Array.isArray(r.objects)) continue;
    const objects = normalizeObjects(r.objects);
    if (!objects.length) continue;
    seen.add(r.id);
    const name = typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, KIT_NAME_MAX) : "My kit";
    kits.push({ id: r.id, name, objects });
  }
  return kits;
}
