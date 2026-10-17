import type { DioramaBase } from "@/features/diorama/types/diorama.types";
import { FIRST_VISIT_TEMPLATE } from "@/features/diorama/assets/sceneTemplates";
import { createId } from "@/features/diorama/utils/id";
import { emptyScene, findStarter, starterScene } from "@/features/diorama/utils/newScenes";
import { validateAndNormalizeScene } from "@/features/diorama/utils/sceneValidator";
import { createDiorama } from "./dioramaRepository";

/** The ways a new diorama starts. Each resolves to the new diorama's id. */

export async function createEmptyDiorama(base: DioramaBase): Promise<string> {
  const scene = emptyScene(base);
  await createDiorama(scene);
  return scene.id;
}

/** The starter's preview image, so the new card is never blank (D7). Missing is fine. */
async function starterThumbnail(url: string): Promise<Blob | undefined> {
  try {
    const response = await fetch(url);
    return response.ok ? await response.blob() : undefined;
  } catch {
    return undefined;
  }
}

/** A diorama from a built-in starter; the hero scene if the id is unknown. */
export async function createStarterDiorama(templateId?: string): Promise<string> {
  const template = (templateId && findStarter(templateId)) || FIRST_VISIT_TEMPLATE;
  const scene = starterScene(template);
  await createDiorama(scene, await starterThumbnail(template.thumbnail));
  return scene.id;
}

/**
 * A diorama from the text of a `.diorama.json` file. It always gets a new
 * id, so importing a file twice, or a file exported from this collection,
 * never overwrites a diorama.
 */
export async function importDiorama(text: string): Promise<{ id: string } | { error: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Unable to import Diorama. The file is invalid or corrupted." };
  }
  const result = validateAndNormalizeScene(parsed);
  if ("error" in result) return { error: `Unable to import Diorama. ${result.error}` };
  const scene = { ...result.scene, id: createId("scene") };
  await createDiorama(scene);
  return { id: scene.id };
}
