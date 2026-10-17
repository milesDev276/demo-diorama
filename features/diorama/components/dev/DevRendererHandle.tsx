"use client";

import { useEffect } from "react";
import { useThree, type RootState } from "@react-three/fiber";
import { sceneOf, useDioramaStore } from "../../store/dioramaStore";
import { serializeScene, type DioramaSceneFile } from "../../utils/sceneSerializer";

declare global {
  interface Window {
    __dioramaThree?: () => RootState;
    __dioramaStore?: typeof useDioramaStore;
    __dioramaSceneFile?: () => DioramaSceneFile;
  }
}

/**
 * Dev-only: `/diorama?dev=stats` exposes the R3F state getter (renderer,
 * scene, camera, controls) so scripts/measure-scene.mjs can read
 * `renderer.info` and verification scripts can frame close-ups, and the
 * store so those scripts can drive and inspect the scene, and the open
 * scene as a file (capture-presets.mjs --save-scene). Nothing in the app
 * reads them.
 */
export function DevRendererHandle() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    window.__dioramaThree = get;
    window.__dioramaStore = useDioramaStore;
    window.__dioramaSceneFile = () => serializeScene(sceneOf(useDioramaStore.getState()));
    return () => {
      delete window.__dioramaThree;
      delete window.__dioramaStore;
      delete window.__dioramaSceneFile;
    };
  }, [get]);
  return null;
}
