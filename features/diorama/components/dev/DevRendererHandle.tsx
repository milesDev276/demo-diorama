"use client";

import { useEffect } from "react";
import { useThree, type RootState } from "@react-three/fiber";
import { useDioramaStore } from "../../store/dioramaStore";

declare global {
  interface Window {
    __dioramaThree?: () => RootState;
    __dioramaStore?: typeof useDioramaStore;
  }
}

/**
 * Dev-only: `/diorama?dev=stats` exposes the R3F state getter (renderer,
 * scene, camera, controls) so scripts/measure-scene.mjs can read
 * `renderer.info` and verification scripts can frame close-ups, and the
 * store so those scripts can drive and inspect the scene. Nothing in the
 * app reads either.
 */
export function DevRendererHandle() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    window.__dioramaThree = get;
    window.__dioramaStore = useDioramaStore;
    return () => {
      delete window.__dioramaThree;
      delete window.__dioramaStore;
    };
  }, [get]);
  return null;
}
