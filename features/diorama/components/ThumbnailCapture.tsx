"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useThree, type RootState } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { saveThumbnail, thumbnailIsStale } from "@/features/dioramas/storage/dioramaRepository";
import { sceneFingerprint, sceneOf, useDioramaStore } from "../store/dioramaStore";
import type { DioramaScene } from "../types/diorama.types";
import { sceneLook } from "../utils/weather";
import { isEditorHelper, isLoadingGhost } from "../utils/editorHelpers";
import { getBaseTemplate } from "../utils/baseTemplates";
import { CAMERA_PRESETS } from "../utils/cameraPresets";
import { orthoFitView, sceneFit } from "../utils/cameraFit";

/** Thumbnail size: the 16:10 of My Dioramas' and the home page's cards, sharp on a 2× screen (Stage 23 D2). */
const WIDTH = 960;
const HEIGHT = 600;
/** How long the scene has to stay saved and untouched before a thumbnail is taken, and how long to wait again after the user was busy (placing, brushing, Preview). */
const IDLE_MS = 3000;
/** How soon to look again while models are loading. */
const LOADING_RETRY_MS = 1000;

/** The thumbnail's viewing direction: the Isometric preset's (D2). */
const DIRECTION = new THREE.Vector3(...CAMERA_PRESETS.isometric.position).normalize();
const PRESET_DISTANCE = new THREE.Vector3(...CAMERA_PRESETS.isometric.position).length();
const UP = new THREE.Vector3(0, 1, 0);

/** Every model has arrived: nothing is being fetched and no loading stand-in is in the scene (D1). */
function modelsLoaded(scene: THREE.Object3D): boolean {
  if (useProgress.getState().active) return false;
  let ghost = false;
  scene.traverseVisible((object) => {
    if (isLoadingGhost(object)) ghost = true;
  });
  return !ghost;
}

/**
 * An orthographic camera that frames the whole diorama from the Isometric
 * direction in a WIDTH × HEIGHT frame (D2), whatever the editor camera is
 * looking at. It stands as far from what it looks at as the editor camera
 * does from its orbit target, so the scene's haze (SceneFog) falls the same.
 */
function thumbnailCamera({ scene, camera, controls }: RootState): THREE.OrthographicCamera {
  const template = getBaseTemplate(useDioramaStore.getState().environment);
  const { target, zoom } = orthoFitView(sceneFit(scene, template), DIRECTION, UP, WIDTH, HEIGHT);
  const orbitTarget = (controls as { target?: THREE.Vector3 } | null)?.target;
  const distance = orbitTarget ? camera.position.distanceTo(orbitTarget) : PRESET_DISTANCE;
  const editing = camera as THREE.OrthographicCamera;
  const shot = new THREE.OrthographicCamera(-WIDTH / 2, WIDTH / 2, HEIGHT / 2, -HEIGHT / 2, editing.near ?? 0.6, editing.far ?? 600);
  shot.position.copy(target).addScaledVector(DIRECTION, distance);
  shot.up.copy(UP);
  shot.lookAt(target);
  shot.zoom = zoom;
  shot.updateProjectionMatrix();
  shot.updateMatrixWorld();
  return shot;
}

/**
 * Renders the diorama once, without the editor's helpers, through the
 * thumbnail camera at exactly WIDTH × HEIGHT pixels (the drawing buffer is
 * resized for that one render — one resize there, one back) and copies it
 * onto the sky behind it.
 * Everything up to the copy happens in one task, so the drawing buffer is
 * intact without `preserveDrawingBuffer` (as in PhotoStudio). The editor's
 * size is restored and its view drawn again before the task ends, so the
 * canvas never shows a cleared or resized frame.
 */
function renderThumbnail(state: RootState): HTMLCanvasElement {
  const { gl, scene, camera } = state;
  const hidden: THREE.Object3D[] = [];
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

  const pixelRatio = gl.getPixelRatio();
  const size = gl.getSize(new THREE.Vector2());
  try {
    const shot = thumbnailCamera(state);
    gl.setDrawingBufferSize(WIDTH, HEIGHT, 1);
    gl.render(scene, shot);
    context.drawImage(gl.domElement, 0, 0, WIDTH, HEIGHT);
  } finally {
    for (const object of hidden) object.visible = true;
    // Back to the editor's size (the canvas's CSS size is never touched) and its view.
    gl.setDrawingBufferSize(size.x, size.y, pixelRatio);
    gl.render(scene, camera);
  }
  return copy;
}

/**
 * Takes and stores a thumbnail of the open diorama: "taken", or why not
 * yet — the user is placing, brushing or in Preview ("busy"), or models
 * are loading ("loading"). A picture of changes that are not stored yet
 * (a save pending or failing) is stored without a time, so it counts as
 * stale and is retaken on the next opening.
 */
function captureThumbnail(get: () => RootState): "taken" | "busy" | "loading" {
  const state = useDioramaStore.getState();
  if (!state.sceneId) return "taken";
  if (state.placement || state.brush || state.groundBrush || state.isPreviewMode) return "busy";
  const three = get();
  if (!modelsLoaded(three.scene)) return "loading";
  try {
    const takenAt = Date.now();
    const stored = state.savedFingerprint !== null && sceneFingerprint(state) === state.savedFingerprint;
    storeThumbnail(state.sceneId, renderThumbnail(three), stored ? takenAt : undefined);
  } catch {
    // A lost context or a canvas that cannot be read: keep the old thumbnail.
  }
  return "taken";
}

/**
 * Changes to what a thumbnail shows (objects, environment) that the
 * autosave has not written yet — its debounce is running, or it failed. A
 * moved view alone does not count.
 */
function hasUnsavedPictureChanges(): boolean {
  const state = useDioramaStore.getState();
  if (!state.sceneId || state.savedFingerprint === null || sceneFingerprint(state) === state.savedFingerprint) return false;
  // Both sides as the fingerprint writes them (sceneOf), so only a real difference counts.
  const saved = JSON.parse(state.savedFingerprint) as DioramaScene;
  const now = sceneOf(state);
  return JSON.stringify([saved.objects, saved.environment]) !== JSON.stringify([now.objects, now.environment]);
}

function storeThumbnail(id: string, canvas: HTMLCanvasElement, takenAt: number | undefined): void {
  canvas.toBlob(
    (blob) => {
      if (blob) saveThumbnail(id, blob, takenAt).catch(() => {});
    },
    "image/webp",
    0.8
  );
}

/**
 * Keeps the open diorama's thumbnail in My Dioramas and on the home page
 * current (plan/Stage-17 D7, plan/Stage-23-Implementation.md D1–D3): when
 * the diorama opens and after each save, if the stored thumbnail is stale
 * (missing, older than the last save of something it shows, or from before
 * Stage 23), a few seconds later; and once more when the editor closes
 * with a stale thumbnail or with changes not saved yet. So a starter's
 * preview image stays until the first edit, and saving only the view
 * retakes nothing. No picture is taken while models are still loading.
 */
export function ThumbnailCapture() {
  const get = useThree((s) => s.get);
  /** The stored thumbnail no longer shows the diorama (found stale on opening or after a save). */
  const pending = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const schedule = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const result = captureThumbnail(get);
        if (result === "taken") pending.current = false;
        else schedule(result === "busy" ? IDLE_MS : LOADING_RETRY_MS);
      }, delay);
    };
    /** Asks the collection whether the stored picture still shows the diorama (it judges a save of the view alone as no change). */
    const check = (id: string) => {
      thumbnailIsStale(id)
        .then((stale) => {
          if (!alive || !stale || useDioramaStore.getState().sceneId !== id) return;
          pending.current = true;
          schedule(IDLE_MS);
        })
        .catch(() => {});
    };

    const current = useDioramaStore.getState();
    if (current.sceneId && current.savedFingerprint !== null) check(current.sceneId);
    // A new saved fingerprint: the diorama was opened (loadScene) or saved; either way the entry is written by now.
    const unsubscribe = useDioramaStore.subscribe((state, previous) => {
      if (state.savedFingerprint !== null && state.savedFingerprint !== previous.savedFingerprint) check(state.sceneId);
    });
    return () => {
      alive = false;
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [get]);

  // A layout cleanup of the canvas's first child runs before the rest of the scene is removed.
  useLayoutEffect(
    () => () => {
      if (pending.current || hasUnsavedPictureChanges()) captureThumbnail(get);
    },
    [get]
  );

  return null;
}
