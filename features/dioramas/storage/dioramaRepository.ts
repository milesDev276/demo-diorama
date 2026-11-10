import type { DioramaScene } from "@/features/diorama/types/diorama.types";
import { createId } from "@/features/diorama/utils/id";
import { serializeScene, type DioramaSceneFile } from "@/features/diorama/utils/sceneSerializer";
import { validateAndNormalizeScene } from "@/features/diorama/utils/sceneValidator";
import type { DioramaEntry } from "../types";
import { count, ENTRIES, readAll, readOne, SCENES, transact, write } from "./idb";
import { legacySceneMigrated, markLegacySceneMigrated, readLegacyScene } from "./legacyScene";

/**
 * The local collection of dioramas (plan/Stage-17-Implementation.md D2).
 * Everything that reads or writes it goes through here; components use
 * the hooks in ../hooks, never this module directly.
 */

const NAME_LIMIT = 80;

/** A thumbnail with its capture time (D3 of plan/Stage-23-Implementation.md); old entries have no time. */
type Thumbnail = Pick<DioramaEntry, "thumbnail" | "thumbnailAt">;

function entryOf(scene: DioramaScene, createdAt: number, updatedAt: number, thumbnail: Thumbnail = {}): DioramaEntry {
  const entry: DioramaEntry = {
    id: scene.id,
    name: scene.name,
    createdAt,
    updatedAt,
    objectCount: scene.objects.length,
    base: scene.environment.base,
  };
  if (thumbnail.thumbnail) entry.thumbnail = thumbnail.thumbnail;
  if (thumbnail.thumbnail && thumbnail.thumbnailAt !== undefined) entry.thumbnailAt = thumbnail.thumbnailAt;
  return entry;
}

let ready: Promise<void> | null = null;

/** The pre-Stage 17 scene becomes the first diorama, once (D8). Every read and write waits for it. */
function whenReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      if (legacySceneMigrated()) return;
      const legacy = readLegacyScene();
      if (legacy && (await count(ENTRIES)) === 0) {
        const { scene, savedAt } = legacy;
        await write([
          { store: ENTRIES, key: scene.id, put: entryOf(scene, savedAt, savedAt) },
          { store: SCENES, key: scene.id, put: serializeScene(scene) },
        ]);
      }
      markLegacySceneMigrated();
    })();
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

/** Asks the browser not to evict the collection under storage pressure. Best effort. */
function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => {});
}

/** Every diorama, the most recently edited first. */
export async function listDioramas(): Promise<DioramaEntry[]> {
  await whenReady();
  const entries = await readAll<DioramaEntry>(ENTRIES);
  return entries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function hasDioramas(): Promise<boolean> {
  await whenReady();
  return (await count(ENTRIES)) > 0;
}

/** The most recently edited diorama's id, or null if there is none. */
export async function latestDioramaId(): Promise<string | null> {
  return (await listDioramas())[0]?.id ?? null;
}

/**
 * A diorama's scene, upgraded and validated as an imported file is; null
 * if there is no such diorama. Throws if the stored file is unreadable.
 */
export async function getDiorama(id: string): Promise<DioramaScene | null> {
  await whenReady();
  const file = await readOne<DioramaSceneFile>(SCENES, id);
  if (!file) return null;
  const result = validateAndNormalizeScene(file);
  if ("error" in result) throw new Error(result.error);
  return { ...result.scene, id };
}

/**
 * Adds a new diorama. The scene must have an id no other diorama has. A
 * thumbnail given here counts as a picture of it as it is now, unless
 * `current` is false (a duplicate of a diorama whose picture was stale).
 */
export async function createDiorama(scene: DioramaScene, thumbnail?: Blob, current = true): Promise<DioramaEntry> {
  await whenReady();
  const now = Date.now();
  const entry = entryOf(scene, now, now, { thumbnail, thumbnailAt: current ? now : undefined });
  await write([
    { store: ENTRIES, key: scene.id, put: entry },
    { store: SCENES, key: scene.id, put: serializeScene(scene) },
  ]);
  requestPersistence();
  return entry;
}

/** Writes the scene of an existing diorama (or adds it again if it was deleted meanwhile). Keeps its thumbnail. */
export async function saveDiorama(scene: DioramaScene): Promise<void> {
  await whenReady();
  const now = Date.now();
  await transact([ENTRIES, SCENES], (transaction) => {
    const entries = transaction.objectStore(ENTRIES);
    const previous = entries.get(scene.id);
    previous.onsuccess = () => {
      const entry = previous.result as DioramaEntry | undefined;
      entries.put(entryOf(scene, entry?.createdAt ?? now, now, entry ?? {}), scene.id);
      transaction.objectStore(SCENES).put(serializeScene(scene), scene.id);
    };
  });
}

/** Replaces a diorama's thumbnail. Does not count as an edit. */
export async function saveThumbnail(id: string, thumbnail: Blob, takenAt: number): Promise<void> {
  await whenReady();
  await transact([ENTRIES], (transaction) => {
    const entries = transaction.objectStore(ENTRIES);
    const previous = entries.get(id);
    previous.onsuccess = () => {
      const entry = previous.result as DioramaEntry | undefined;
      if (entry) entries.put({ ...entry, thumbnail, thumbnailAt: takenAt }, id);
    };
  });
}

/**
 * Whether a diorama's thumbnail no longer shows it (D3): there is none, it
 * was taken before the last save, or it has no time (taken before Stage 23,
 * when a thumbnail could show models that had not loaded yet).
 */
export async function thumbnailIsStale(id: string): Promise<boolean> {
  await whenReady();
  const entry = await readOne<DioramaEntry>(ENTRIES, id);
  return entry ? isStale(entry) : false;
}

function isStale(entry: DioramaEntry): boolean {
  return !entry.thumbnail || entry.thumbnailAt === undefined || entry.thumbnailAt < entry.updatedAt;
}

/** Renames a diorama: its entry and its scene file. */
export async function renameDiorama(id: string, name: string): Promise<void> {
  const trimmed = name.trim().slice(0, NAME_LIMIT);
  if (!trimmed) return;
  await whenReady();
  await transact([ENTRIES, SCENES], (transaction) => {
    const entries = transaction.objectStore(ENTRIES);
    const scenes = transaction.objectStore(SCENES);
    const entryRequest = entries.get(id);
    const fileRequest = scenes.get(id);
    fileRequest.onsuccess = () => {
      const entry = entryRequest.result as DioramaEntry | undefined;
      const file = fileRequest.result as DioramaSceneFile | undefined;
      if (!entry || !file) return;
      const now = Date.now();
      // A name is not in the picture: a thumbnail that was current stays current.
      const current = entry.thumbnailAt !== undefined && entry.thumbnailAt >= entry.updatedAt;
      entries.put({ ...entry, name: trimmed, updatedAt: now, ...(current ? { thumbnailAt: now } : {}) }, id);
      scenes.put({ ...file, scene: { ...file.scene, name: trimmed } }, id);
    };
  });
}

/** A copy of a diorama, named "<name> copy", with its thumbnail. */
export async function duplicateDiorama(id: string): Promise<DioramaEntry | null> {
  const scene = await getDiorama(id);
  if (!scene) return null;
  const entry = await readOne<DioramaEntry>(ENTRIES, id);
  const copy: DioramaScene = { ...scene, id: createId("scene"), name: `${scene.name} copy`.slice(0, NAME_LIMIT) };
  // The copy's picture is exactly as current as the original's.
  return createDiorama(copy, entry?.thumbnail, entry ? !isStale(entry) : true);
}

/** Deletes a diorama for good. */
export async function deleteDiorama(id: string): Promise<void> {
  await whenReady();
  await write([
    { store: ENTRIES, delete: id },
    { store: SCENES, delete: id },
  ]);
}
