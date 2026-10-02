"use client";

import { useEffect, useRef } from "react";
import { useDioramaStore } from "../store/dioramaStore";

const AUTOSAVE_DEBOUNCE_MS = 700;
const SAVING_FLASH_MS = 120;

/**
 * Watches the serializable parts of the scene and writes to localStorage a
 * short debounce after the last change, flipping the toolbar's save status
 * indicator through unsaved -> saving -> saved along the way.
 */
export function useAutoSave() {
  // A primitive string fingerprint is a safe Zustand selector: two calls with
  // equal content are `===`, so this doesn't cause extra renders on its own.
  const fingerprint = useDioramaStore((s) =>
    JSON.stringify({ name: s.sceneName, environment: s.environment, objects: s.objects })
  );
  const setSaveStatus = useDioramaStore((s) => s.setSaveStatus);
  const saveScene = useDioramaStore((s) => s.saveScene);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    setSaveStatus("unsaved");

    const debounce = window.setTimeout(() => {
      setSaveStatus("saving");
      const flash = window.setTimeout(() => saveScene(), SAVING_FLASH_MS);
      return () => window.clearTimeout(flash);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);
}
