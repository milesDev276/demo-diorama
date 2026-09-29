"use client";

import { useEffect } from "react";
import { useDioramaStore } from "../store/dioramaStore";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Global editor keyboard shortcuts. Disabled entirely while typing in a
 * field, and while Preview mode is active (pass `enabled={false}`).
 *
 * Delete/Backspace  Delete selection
 * Ctrl+Z            Undo
 * Ctrl+Shift+Z/Y    Redo
 * Ctrl+D            Duplicate selection
 * Ctrl+S            Save scene
 * Esc               Clear selection
 * F                 Focus selected object(s)
 * W / E / R         Move / Rotate / Scale mode
 */
export function useEditorShortcuts(enabled: boolean) {
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const removeObjects = useDioramaStore((s) => s.removeObjects);
  const duplicateObjects = useDioramaStore((s) => s.duplicateObjects);
  const undo = useDioramaStore((s) => s.undo);
  const redo = useDioramaStore((s) => s.redo);
  const clearSelection = useDioramaStore((s) => s.clearSelection);
  const saveScene = useDioramaStore((s) => s.saveScene);
  const setTransformMode = useDioramaStore((s) => s.setTransformMode);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && EDITABLE_TAGS.has(target.tagName)) return;

      const isMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if ((event.key === "Delete" || event.key === "Backspace") && selectedObjectIds.length) {
        event.preventDefault();
        removeObjects(selectedObjectIds);
        return;
      }

      if (isMeta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (isMeta && key === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (isMeta && key === "d") {
        event.preventDefault();
        if (selectedObjectIds.length) duplicateObjects(selectedObjectIds);
        return;
      }

      if (isMeta && key === "s") {
        event.preventDefault();
        saveScene();
        return;
      }

      if (event.key === "Escape") {
        clearSelection();
        return;
      }

      if (isMeta || event.altKey) return;

      if (key === "f") {
        const state = useDioramaStore.getState();
        const positions = state.objects
          .filter((o) => selectedObjectIds.includes(o.id))
          .map((o) => o.position);
        state.cameraApi?.focusOn(positions);
        return;
      }

      if (key === "w") setTransformMode("translate");
      else if (key === "e") setTransformMode("rotate");
      else if (key === "r") setTransformMode("scale");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    selectedObjectIds,
    removeObjects,
    duplicateObjects,
    undo,
    redo,
    clearSelection,
    saveScene,
    setTransformMode,
  ]);
}
