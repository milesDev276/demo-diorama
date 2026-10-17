"use client";

import { useEffect } from "react";
import { sceneFingerprint, useDioramaStore } from "../store/dioramaStore";

const AUTOSAVE_DEBOUNCE_MS = 700;

/**
 * Saves the open diorama a short debounce after the last change, and at
 * once when the page is hidden or the editor closes, flipping the
 * toolbar's indicator through unsaved -> saving -> saved. Nothing is saved
 * before a diorama is open: the empty store has no id and no saved state.
 */
export function useAutoSave() {
  // A primitive string is a safe Zustand selector: equal content is `===`.
  const fingerprint = useDioramaStore((s) => (s.sceneId ? sceneFingerprint(s) : null));
  const savedFingerprint = useDioramaStore((s) => s.savedFingerprint);

  useEffect(() => {
    if (fingerprint === null || savedFingerprint === null) return;
    const { saveStatus, setSaveStatus, saveScene } = useDioramaStore.getState();
    if (fingerprint === savedFingerprint) {
      // Back to what is stored (an undo, or the save that just finished).
      if (saveStatus === "unsaved") setSaveStatus("saved");
      return;
    }
    if (saveStatus !== "error") setSaveStatus("unsaved");
    const debounce = window.setTimeout(() => void saveScene(), AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(debounce);
  }, [fingerprint, savedFingerprint]);

  // Leaving: the last changes are written even if the debounce has not run out.
  useEffect(() => {
    const flush = () => useDioramaStore.getState().flushSave();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);
}
