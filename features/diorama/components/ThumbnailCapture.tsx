"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useThree, type RootState } from "@react-three/fiber";
import type { Object3D } from "three";
import { saveThumbnail } from "@/features/dioramas/storage/dioramaRepository";
import { useDioramaStore } from "../store/dioramaStore";
import { sceneLook } from "../utils/weather";

/** Thumbnail size: the 16:10 of My Dioramas' cards. */
const WIDTH = 480;
const HEIGHT = 300;
/** How long the scene has to stay saved and untouched before a thumbnail is taken. */
const IDLE_MS = 3000;

/** Grid, selection rings (userData.editorOnly) and the transform gizmo (drei's, from three-stdlib, is an Object3D). */
function isEditorHelper(object: Object3D): boolean {
  return object.userData.editorOnly === true || (object as { isTransformControls?: boolean }).isTransformControls === true;
}

/**
 * Renders the current view once without the editor's helpers and copies
 * it, cover-cropped, onto the sky behind it. Everything up to the copy
 * happens in one task, so the drawing buffer is intact without
 * `preserveDrawingBuffer` (as in PhotoStudio); the next frame draws the
 * helpers again.
 */
function renderThumbnail({ gl, scene, camera }: RootState): HTMLCanvasElement {
  const hidden: Object3D[] = [];
  scene.traverse((object) => {
    if (object.visible && isEditorHelper(object)) {
      object.visible = false;
      hidden.push(object);
    }
  });

  const copy = document.createElement("canvas");
  copy.width = WIDTH;
  copy.height = HEIGHT;
  const context = copy.getContext("2d")!;
  const { timeOfDay, weather } = useDioramaStore.getState().environment;
  const { sky } = sceneLook(timeOfDay, weather);
  const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, sky.top);
  gradient.addColorStop(0.5, sky.middle);
  gradient.addColorStop(1, sky.bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  try {
    gl.render(scene, camera);
    const source = gl.domElement;
    const scale = Math.max(WIDTH / source.width, HEIGHT / source.height);
    const cropWidth = WIDTH / scale;
    const cropHeight = HEIGHT / scale;
    context.drawImage(
      source,
      (source.width - cropWidth) / 2,
      (source.height - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      WIDTH,
      HEIGHT
    );
  } finally {
    for (const object of hidden) object.visible = true;
  }
  return copy;
}

/** Takes and stores a thumbnail of the open diorama, unless the user is placing, brushing or in Preview. */
function captureThumbnail(get: () => RootState): boolean {
  const state = useDioramaStore.getState();
  if (!state.sceneId || state.placement || state.brush || state.groundBrush || state.isPreviewMode) return false;
  try {
    storeThumbnail(state.sceneId, renderThumbnail(get()));
  } catch {
    // A lost context or a canvas that cannot be read: keep the old thumbnail.
  }
  return true;
}

function storeThumbnail(id: string, canvas: HTMLCanvasElement): void {
  canvas.toBlob(
    (blob) => {
      if (blob) saveThumbnail(id, blob).catch(() => {});
    },
    "image/webp",
    0.8
  );
}

/**
 * Keeps the open diorama's thumbnail in My Dioramas current (plan/Stage-17
 * D7): a few seconds after it is opened and after each save, once the
 * user is not placing, brushing or in Preview, and once more when the
 * editor closes with a newer save than the last thumbnail.
 */
export function ThumbnailCapture() {
  const get = useThree((s) => s.get);
  /** A save happened since the last thumbnail (or the diorama was just opened). */
  const pending = useRef(true);

  useEffect(() => {
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!captureThumbnail(get)) schedule();
        else pending.current = false;
      }, IDLE_MS);
    };

    schedule();
    const unsubscribe = useDioramaStore.subscribe((state, previous) => {
      if (state.savedFingerprint !== null && state.savedFingerprint !== previous.savedFingerprint) {
        pending.current = true;
        schedule();
      }
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [get]);

  // A layout cleanup of the canvas's first child runs before the rest of the scene is removed.
  useLayoutEffect(
    () => () => {
      if (pending.current) captureThumbnail(get);
    },
    [get]
  );

  return null;
}
