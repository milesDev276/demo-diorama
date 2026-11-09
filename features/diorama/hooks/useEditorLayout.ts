import { useLayoutEffect } from "react";
import { useDioramaStore } from "../store/dioramaStore";
import { readStoredLayout, writeStoredLayout } from "../utils/editorLayout";

/** A drag changes the width on every pointer move; the layout is written once it has stopped changing this long. */
const WRITE_DELAY_MS = 300;

/**
 * Remembers the side columns' folding and widths in this browser
 * (plan/Stage-21-Implementation.md D5): reads them before the editor first paints,
 * writes them shortly after they change. Not scene data.
 */
export function useEditorLayout() {
  // Before the first paint, so the columns open at their stored layout instead of sliding there.
  useLayoutEffect(() => {
    const stored = readStoredLayout();
    const { setPanelLayout } = useDioramaStore.getState();
    if (stored.left) setPanelLayout("left", stored.left);
    if (stored.right) setPanelLayout("right", stored.right);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useDioramaStore.subscribe((state, previous) => {
      if (state.panels === previous.panels) return;
      clearTimeout(timer);
      timer = setTimeout(() => writeStoredLayout(useDioramaStore.getState().panels), WRITE_DELAY_MS);
    });
    return () => {
      unsubscribe();
      if (timer !== undefined) {
        clearTimeout(timer);
        writeStoredLayout(useDioramaStore.getState().panels);
      }
    };
  }, []);
}
