import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type * as THREE from "three";
import { useDioramaStore } from "../store/dioramaStore";

/** A change of camera distance smaller than this share is not worth a move (canvas-size rounding). */
const TOLERANCE = 0.01;

interface Glide {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
}

interface FrameDollyRefs {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  perspectiveRef: RefObject<THREE.PerspectiveCamera | null>;
  /** A glide in progress is moved along with the camera. */
  transitionRef: RefObject<Glide | null>;
  /** Scaled with the camera, so leaving Preview keeps the editing zoom. */
  previewEntryRef: RefObject<{ height: number } | null>;
}

/**
 * Keeps the Preview shot when the photo frame changes
 * (plan/Stage-20-Implementation.md D3): the camera stands at the distance
 * the user framed the shot at (the base), moved back by the ratio of the
 * aspects whenever the frame is narrower than the one it was framed in. So
 * everything that was visible across the frame stays visible, and going
 * back to the first frame goes back to the first distance. Only a frame
 * choice does this, not the window or the panels resizing the canvas.
 *
 * Returns `resetBase`: call it when the user frames the shot again (a
 * gesture, Fit), so the next frame change starts from the new view.
 */
export function useFrameDolly(
  camera: THREE.Camera,
  size: { width: number; height: number },
  { controlsRef, perspectiveRef, transitionRef, previewEntryRef }: FrameDollyRefs,
  maxDistance: number
): () => void {
  const lastRef = useRef<{ camera: THREE.Camera; aspect: number; frame: string } | null>(null);
  const baseRef = useRef<{ distance: number; aspect: number } | null>(null);

  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    const frame = useDioramaStore.getState().photo.aspect;
    const last = lastRef.current;
    // The frame is chosen a render before the canvas takes its shape: wait for the shape.
    if (last && last.camera === camera && Math.abs(aspect - last.aspect) < 1e-4) return;
    lastRef.current = { camera, aspect, frame };

    const controls = controlsRef.current;
    const perspective = perspectiveRef.current;
    if (!controls || !perspective || camera !== perspective || last?.camera !== perspective) {
      baseRef.current = null; // entering or leaving Preview: the next frame change starts from the view then
      return;
    }
    if (last.frame === frame) return;

    const target = controls.target;
    const distance = perspective.position.distanceTo(target);
    const base = (baseRef.current ??= { distance, aspect: last.aspect });
    const wanted = Math.min(base.distance * Math.max(1, base.aspect / aspect), maxDistance);
    const factor = wanted / distance;
    if (!Number.isFinite(factor) || Math.abs(factor - 1) < TOLERANCE) return;

    const scale = (point: THREE.Vector3, about: THREE.Vector3) => point.sub(about).multiplyScalar(factor).add(about);
    scale(perspective.position, target);
    const glide = transitionRef.current;
    if (glide) {
      scale(glide.fromPos, glide.fromTarget);
      scale(glide.toPos, glide.toTarget);
    }
    // Not the user dollying: the editing zoom that leaving Preview gives (and the recorded view) stays.
    if (previewEntryRef.current) previewEntryRef.current.height *= factor;
    controls.update();
  }, [camera, size, controlsRef, perspectiveRef, transitionRef, previewEntryRef, maxDistance]);

  return useCallback(() => {
    baseRef.current = null;
  }, []);
}
