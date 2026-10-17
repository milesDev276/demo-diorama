import type { DioramaBase } from "@/features/diorama/types/diorama.types";

/**
 * What My Dioramas shows about one diorama, kept apart from its scene file
 * so the list never has to read scenes. The id is the scene's own id.
 */
export interface DioramaEntry {
  id: string;
  name: string;
  /** Milliseconds since the epoch. */
  createdAt: number;
  updatedAt: number;
  objectCount: number;
  /** For the placeholder of a card that has no thumbnail yet. */
  base: DioramaBase;
  /** A small WebP (or PNG) of the scene, captured by the editor. */
  thumbnail?: Blob;
}
