import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDioramaStore } from "../store/dioramaStore";
import { CAMERA_ZOOM_RANGE } from "../utils/cameraPresets";

/** After the editor opens or Preview closes, the canvas must keep one size this long before resizes count (the panels slide in). */
const SETTLE_MS = 300;

interface ZoomGlide {
  fromZoom: number;
  toZoom: number;
}

interface CanvasResizeRefs {
  orthoRef: RefObject<THREE.OrthographicCamera | null>;
  /** A glide in progress has its zoom scaled along with the camera's. */
  transitionRef: RefObject<ZoomGlide | null>;
  /** Whether the view is a fit of the diorama (a preset, Fit, the opening fit) the user has not changed since. */
  fittedRef: RefObject<boolean>;
}

/**
 * Keeps the editing shot when the canvas changes size — the window, a side
 * panel folding or being dragged wider, the error banner
 * (plan/Stage-21-Implementation.md D2):
 *
 * * a fitted view is fitted again at once (`refit`), so the diorama grows
 *   into new room and stays whole in less;
 * * any other view zooms out when the canvas gets smaller, by the smaller of
 *   the width and height ratios, so nothing in view leaves it, and does not
 *   zoom in when it grows. The ratios are taken against the canvas and zoom
 *   at the last gesture (the base), so a round trip ends where it started.
 *
 * Off in Preview, and until the canvas has settled after the editor opens
 * (the side columns slide in, a stored layout is applied) or Preview closes;
 * then a fitted view is fitted once more. `onZoomed` is told after a
 * non-fitted view's zoom changed. Returns `resetBase`: call it whenever the
 * user frames the view again.
 */
export function useCanvasResizeZoom(
  camera: THREE.Camera,
  size: { width: number; height: number },
  { orthoRef, transitionRef, fittedRef }: CanvasResizeRefs,
  refit: () => void,
  onZoomed: () => void
): () => void {
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const baseRef = useRef<{ zoom: number; width: number; height: number } | null>(null);
  /** Set while the canvas settles (the editor opening, Preview closing): when it last changed size. */
  const settlingSinceRef = useRef<number | null>(null);
  const wasPreviewRef = useRef(isPreviewMode);

  useLayoutEffect(() => {
    settlingSinceRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (wasPreviewRef.current && !isPreviewMode) settlingSinceRef.current = performance.now();
    wasPreviewRef.current = isPreviewMode;
  }, [isPreviewMode]);

  useLayoutEffect(() => {
    const last = lastSizeRef.current;
    lastSizeRef.current = { width: size.width, height: size.height };
    if (!last || (last.width === size.width && last.height === size.height)) return;
    if (isPreviewMode || settlingSinceRef.current !== null) {
      if (settlingSinceRef.current !== null) settlingSinceRef.current = performance.now();
      baseRef.current = null;
      return;
    }
    const ortho = orthoRef.current;
    if (!ortho || camera !== ortho || !last.width || !last.height) return;
    if (fittedRef.current) {
      refit();
      return;
    }
    // During a glide the zoom it is heading for is the view's zoom, not the one it passes through.
    const glide = transitionRef.current;
    const base = (baseRef.current ??= { zoom: glide ? glide.toZoom : ortho.zoom, width: last.width, height: last.height });
    const zoom = THREE.MathUtils.clamp(
      base.zoom * Math.min(1, size.width / base.width, size.height / base.height),
      CAMERA_ZOOM_RANGE.min,
      CAMERA_ZOOM_RANGE.max
    );
    if (glide) {
      glide.toZoom = zoom;
      return;
    }
    if (!Number.isFinite(zoom) || zoom === ortho.zoom) return;
    ortho.zoom = zoom;
    ortho.updateProjectionMatrix();
    onZoomed();
  }, [camera, size, isPreviewMode, orthoRef, transitionRef, fittedRef, refit, onZoomed]);

  useFrame(() => {
    const since = settlingSinceRef.current;
    if (since === null || performance.now() - since < SETTLE_MS) return;
    settlingSinceRef.current = null;
    baseRef.current = null;
    if (fittedRef.current && camera === orthoRef.current) refit();
  });

  return useCallback(() => {
    baseRef.current = null;
  }, []);
}
