"use client";

import { useEffect, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import type { EffectComposer } from "postprocessing";
import { Raycaster, Vector2, type Mesh } from "three";
import { useDioramaStore } from "../store/dioramaStore";
import type { PhotoExport } from "../types/diorama.types";
import { photoExportSize, photoFileName } from "../utils/photo";

/** A press that travels further than this (CSS pixels) is an orbit, not a focus click. */
const CLICK_SLOP = 5;
/** Above this export scale the extra pixels already smooth the edges; multisampling would only cost memory. */
const SUPERSAMPLED_FROM = 2;

function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

interface PhotoStudioProps {
  /** The Preview composer, which the export resizes for one frame. */
  composerRef: RefObject<EffectComposer | null>;
}

/**
 * The canvas side of the photo bar, mounted while Preview is on: applies
 * the exposure, turns a click on the scene into the focus point, and
 * renders the PNG export.
 */
export function PhotoStudio({ composerRef }: PhotoStudioProps) {
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const exposure = useDioramaStore((s) => s.photo.exposure);
  const registerPhotoApi = useDioramaStore((s) => s.registerPhotoApi);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- the live renderer, not React state
    gl.toneMappingExposure = 2 ** exposure;
    return () => {
      gl.toneMappingExposure = 1;
    };
  }, [gl, exposure]);

  // Click to focus: the world point under the pointer, or the middle of the frame for a click on the sky.
  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    let pressed: { x: number; y: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      pressed = event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
    };
    const onPointerUp = (event: PointerEvent) => {
      const start = pressed;
      pressed = null;
      if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP) return;
      const { camera, scene } = get();
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(scene.children, true).find(({ object }) => (object as Mesh).isMesh && object.visible);
      useDioramaStore.getState().setPhoto({ focus: hit ? hit.point.toArray() : null });
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl, get]);

  useEffect(() => {
    const exportSize = (scale: number) => photoExportSize(size, scale, gl.capabilities.maxTextureSize);

    /**
     * Renders one frame at the export size and copies it out. Everything up
     * to the copy happens in one task, so the drawing buffer is still intact
     * without `preserveDrawingBuffer`, and the screen never shows the big frame.
     */
    const savePhoto = async (scale: number): Promise<PhotoExport> => {
      const composer = composerRef.current;
      if (!composer) throw new Error("Preview is not ready");
      const target = exportSize(scale);
      const pixelRatio = gl.getPixelRatio();
      const multisampling = composer.multisampling;
      const copy = document.createElement("canvas");

      try {
        if (target.scale >= SUPERSAMPLED_FROM) composer.multisampling = 0;
        gl.setPixelRatio(target.scale);
        composer.setSize(size.width, size.height);
        composer.render(0);
        copy.width = gl.domElement.width;
        copy.height = gl.domElement.height;
        copy.getContext("2d")!.drawImage(gl.domElement, 0, 0);
      } finally {
        composer.multisampling = multisampling;
        gl.setPixelRatio(pixelRatio);
        composer.setSize(size.width, size.height);
        composer.render(0);
      }

      const blob = await new Promise<Blob | null>((resolve) => copy.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("The image could not be encoded");
      const fileName = photoFileName(useDioramaStore.getState().sceneName);
      download(blob, fileName);
      return { width: copy.width, height: copy.height, fileName };
    };

    // Registered again whenever the frame changes size, so the photo bar shows the new export size.
    registerPhotoApi({ exportSize, savePhoto });
    return () => registerPhotoApi(null);
  }, [gl, size, composerRef, registerPhotoApi]);

  return null;
}
