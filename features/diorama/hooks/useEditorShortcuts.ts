"use client";

import { useEffect } from "react";
import { useDioramaStore } from "../store/dioramaStore";
import { getWorldPosition, indexObjects } from "../utils/sceneGraph";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Factor one [ or ] press changes the brush radius by. */
const BRUSH_STEP = 1.2;

/**
 * Global editor keyboard shortcuts. Disabled entirely while typing in a
 * field, and while Preview mode is active (pass `enabled={false}`).
 *
 * Delete/Backspace  Delete selection
 * Ctrl+Z            Undo
 * Ctrl+Shift+Z/Y    Redo
 * Ctrl+D            Duplicate selection
 * Ctrl+S            Save scene
 * Esc               Cancel placing, else end the scatter or ground brush, else clear selection
 * F                 Focus selected object(s)
 * W / E / R         Move / Rotate / Scale mode (several objects move and rotate together)
 * R / Shift+R       While placing: turn the ghost by 45°
 * [ / ]             While brushing or painting ground: smaller / larger brush
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
        // Esc first backs out of picking a surface or brushing, then clears the selection.
        const state = useDioramaStore.getState();
        if (state.placement) state.cancelPlacement();
        else if (state.brush) state.stopBrush();
        else if (state.groundBrush) state.stopGroundBrush();
        else clearSelection();
        return;
      }

      if (isMeta || event.altKey) return;

      const state = useDioramaStore.getState();
      if (state.brush && (event.key === "[" || event.key === "]")) {
        state.setBrushRadius(state.brushRadius * (event.key === "]" ? BRUSH_STEP : 1 / BRUSH_STEP));
        return;
      }
      if (state.groundBrush && (event.key === "[" || event.key === "]")) {
        state.setGroundBrushSize(state.groundBrushSize + (event.key === "]" ? 1 : -1));
        return;
      }
      // While placing, R turns the ghost: the transform mode means nothing until it lands.
      if (state.placement && key === "r") {
        state.rotatePlacement(((event.shiftKey ? -1 : 1) * Math.PI) / 4);
        return;
      }

      if (key === "f") {
        const state = useDioramaStore.getState();
        const byId = indexObjects(state.objects);
        const positions = state.objects
          .filter((o) => selectedObjectIds.includes(o.id))
          .map((o) => getWorldPosition(o, byId));
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
