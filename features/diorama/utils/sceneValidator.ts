import { DIORAMA_BASES, DIORAMA_OBJECT_TYPES } from "../types/diorama.types";
import type {
  DioramaBase,
  DioramaEnvironment,
  DioramaObject,
  DioramaObjectType,
  DioramaScene,
  Vector3Tuple,
} from "../types/diorama.types";
import { DEFAULT_BUILDING_PARAMS } from "../assets/buildingPresets";
import { normalizeBuildingParams } from "./buildingParams";
import { normalizeScatterParams } from "./scatterParams";
import { createId } from "./id";
import { DEFAULT_SCENE_NAME } from "./objectDefaults";
import { repairParentLinks } from "./sceneGraph";
import { DEFAULT_CAMERA_STATE, DEFAULT_ENVIRONMENT } from "./sceneDefaults";
import { migrateRawObjects, SCENE_FILE_VERSION } from "./sceneSerializer";

const VALID_TYPES: ReadonlySet<DioramaObjectType> = new Set(DIORAMA_OBJECT_TYPES);

const POSITION_LIMIT = 180; // meters — generous but bounded, well beyond the plot
const SCALE_MIN = 0.1;
const SCALE_MAX = 6;

function isFiniteVector3(value: unknown): value is Vector3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

function clampVector3(value: Vector3Tuple, min: number, max: number): Vector3Tuple {
  return value.map((n) => Math.min(max, Math.max(min, n))) as Vector3Tuple;
}

/** Normalizes one raw object into a valid DioramaObject, or returns null if it's unsalvageable. */
function normalizeObject(raw: unknown, seenIds: Set<string>): DioramaObject | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.type !== "string" || !VALID_TYPES.has(r.type as DioramaObjectType)) {
    // Unsupported / future object type — skip gracefully rather than crash.
    return null;
  }

  let id = typeof r.id === "string" && r.id.trim() ? r.id : createId();
  if (seenIds.has(id)) id = createId(); // de-duplicate colliding IDs
  seenIds.add(id);

  const position: Vector3Tuple = isFiniteVector3(r.position)
    ? clampVector3(r.position, -POSITION_LIMIT, POSITION_LIMIT)
    : [0, 0, 0];
  const rotation: Vector3Tuple = isFiniteVector3(r.rotation) ? r.rotation : [0, 0, 0];
  const scale: Vector3Tuple = isFiniteVector3(r.scale) ? clampVector3(r.scale, SCALE_MIN, SCALE_MAX) : [1, 1, 1];
  const visible = typeof r.visible === "boolean" ? r.visible : true;
  const locked = typeof r.locked === "boolean" ? r.locked : false;

  const object: DioramaObject = { id, type: r.type as DioramaObjectType, position, rotation, scale, visible, locked };
  // Optional fields are only written when present, so files without them round-trip unchanged.
  if (typeof r.parentId === "string" && r.parentId) object.parentId = r.parentId;
  if (object.type === "building") object.params = normalizeBuildingParams(r.params) ?? DEFAULT_BUILDING_PARAMS;
  if (object.type === "scatter") {
    // A layer of an unknown kind cannot be drawn; drop it like an unknown type.
    const params = normalizeScatterParams(r.params);
    if (!params) return null;
    object.params = params;
  }
  return object;
}

/**
 * Normalizes a raw object list: unknown or broken objects dropped, ids made
 * unique, values clamped, parent links repaired. Used for scenes and kits.
 */
export function normalizeObjects(rawObjects: unknown[]): DioramaObject[] {
  const seenIds = new Set<string>();
  return repairParentLinks(
    rawObjects.map((o) => normalizeObject(o, seenIds)).filter((o): o is DioramaObject => o !== null)
  );
}

/** Keeps the file's base if it is one this app knows; everything else is the default. */
function normalizeEnvironment(raw: unknown): DioramaEnvironment {
  const base = raw && typeof raw === "object" ? (raw as Record<string, unknown>).base : undefined;
  const known = (DIORAMA_BASES as readonly unknown[]).includes(base);
  return { ...DEFAULT_ENVIRONMENT, base: known ? (base as DioramaBase) : DEFAULT_ENVIRONMENT.base };
}

/**
 * Validates and normalizes arbitrary JSON into a safe DioramaScene. Never
 * throws — always returns either the scene or a human-readable error.
 * Tolerant of both `{ version, scene: {...} }` (save/export format) and a bare
 * scene object; a missing version means v1, the only format that predates it.
 * Older versions are migrated to the current one before validation.
 */
export function validateAndNormalizeScene(data: unknown): { scene: DioramaScene } | { error: string } {
  try {
    if (!data || typeof data !== "object") {
      return { error: "The file is invalid or corrupted." };
    }

    const container = data as Record<string, unknown>;
    const version = typeof container.version === "number" ? container.version : 1;
    if (version > SCENE_FILE_VERSION) {
      return { error: "This file was made with a newer version of the app." };
    }

    const root = (
      container.scene && typeof container.scene === "object" ? container.scene : container
    ) as Record<string, unknown>;

    if (!root || typeof root !== "object") {
      return { error: "The file is invalid or corrupted." };
    }

    const name = typeof root.name === "string" && root.name.trim() ? root.name.trim().slice(0, 80) : DEFAULT_SCENE_NAME;
    const objects = normalizeObjects(migrateRawObjects(Array.isArray(root.objects) ? root.objects : [], version));

    const scene: DioramaScene = {
      id: typeof root.id === "string" && root.id.trim() ? root.id : createId("scene"),
      name,
      objects,
      environment: normalizeEnvironment(root.environment),
      camera: DEFAULT_CAMERA_STATE,
    };

    return { scene };
  } catch {
    return { error: "The file is invalid or corrupted." };
  }
}

export function isValidDioramaScene(data: unknown): data is DioramaScene {
  return !("error" in validateAndNormalizeScene(data));
}
