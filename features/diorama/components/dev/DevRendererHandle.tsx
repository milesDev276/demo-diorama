"use client";

import { useEffect } from "react";
import { useThree, type RootState } from "@react-three/fiber";

declare global {
  interface Window {
    __dioramaThree?: () => RootState;
  }
}

/**
 * Dev-only: `/diorama?dev=stats` exposes the R3F state getter (renderer,
 * scene, camera, controls) so scripts/measure-scene.mjs can read
 * `renderer.info` and verification scripts can frame close-ups. Nothing in
 * the app reads it.
 */
export function DevRendererHandle() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    window.__dioramaThree = get;
    return () => {
      delete window.__dioramaThree;
    };
  }, [get]);
  return null;
}
