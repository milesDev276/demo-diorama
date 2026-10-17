import type { DioramaScene } from "@/features/diorama/types/diorama.types";
import { STORAGE_KEY } from "@/features/diorama/utils/sceneSerializer";
import { validateAndNormalizeScene } from "@/features/diorama/utils/sceneValidator";

/**
 * Before Stage 17 the editor kept one scene in localStorage under
 * `diorama-scene`. It becomes the first diorama of the collection, once;
 * the key itself is left in place as a backup.
 */
const MIGRATED_FLAG = "diorama-migrated";

export function legacySceneMigrated(): boolean {
  try {
    return window.localStorage.getItem(MIGRATED_FLAG) !== null;
  } catch {
    return true; // no storage, nothing to migrate
  }
}

export function markLegacySceneMigrated(): void {
  try {
    window.localStorage.setItem(MIGRATED_FLAG, String(Date.now()));
  } catch {
    // Without localStorage there was never a legacy scene.
  }
}

/** The legacy scene, upgraded and validated, with when it was saved; null if there is none or it is unreadable. */
export function readLegacyScene(): { scene: DioramaScene; savedAt: number } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: unknown };
    const result = validateAndNormalizeScene(parsed);
    if ("error" in result) return null;
    const savedAt = typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt) ? parsed.savedAt : Date.now();
    return { scene: result.scene, savedAt };
  } catch {
    return null;
  }
}
