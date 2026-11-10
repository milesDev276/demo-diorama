import type { Object3D } from "three";

/**
 * `userData` for the editor's own drawings — the grid, selection rings, the
 * placement ghost, brush outlines — so photos, thumbnails and camera fits
 * can leave them out.
 */
export const EDITOR_ONLY = { editorOnly: true } as const;

/** An editor helper: marked with EDITOR_ONLY, or the transform gizmo (three-stdlib's TransformControls is an Object3D). */
export function isEditorHelper(object: Object3D): boolean {
  return object.userData.editorOnly === true || (object as { isTransformControls?: boolean }).isTransformControls === true;
}

/**
 * `userData` for the stand-in drawn while a model loads (GltfAsset's
 * ghost), so a thumbnail is not taken of it (plan/Stage-23-Implementation.md D1).
 */
export const LOADING_GHOST = { loadingGhost: true } as const;

export function isLoadingGhost(object: Object3D): boolean {
  return object.userData.loadingGhost === true;
}
