import { useLayoutEffect } from "react";
import { libraryItemByKey } from "../assets/assetRegistry";
import { BUILT_IN_KITS } from "../assets/builtInKits";
import { useDioramaStore } from "../store/dioramaStore";
import { useKitStore } from "../store/kitStore";
import { readLibraryPrefs, writeLibraryPrefs } from "../utils/libraryPrefs";

/** Folding several sections in a row is written once. */
const WRITE_DELAY_MS = 300;

const currentPrefs = () => {
  const { foldedSections, recentLibraryKeys } = useDioramaStore.getState();
  return { folded: foldedSections, recent: recentLibraryKeys };
};

/**
 * Remembers the library's folded sections and its Recent items in this
 * browser (plan/Stage-22-Implementation.md D5): read before the editor first
 * paints, written shortly after they change. Not scene data.
 */
export function useLibraryPrefs() {
  useLayoutEffect(() => {
    const kits = [...useKitStore.getState().kits, ...BUILT_IN_KITS];
    useDioramaStore.getState().setLibraryPrefs(readLibraryPrefs((key) => Boolean(libraryItemByKey(key, kits))));

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useDioramaStore.subscribe((state, previous) => {
      if (state.foldedSections === previous.foldedSections && state.recentLibraryKeys === previous.recentLibraryKeys) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        writeLibraryPrefs(currentPrefs());
      }, WRITE_DELAY_MS);
    });
    // A deleted kit leaves Recent at once, so it does not hold one of the eight places.
    const unsubscribeKits = useKitStore.subscribe((state, previous) => {
      if (state.kits === previous.kits) return;
      const known = [...state.kits, ...BUILT_IN_KITS];
      const { recentLibraryKeys, setLibraryPrefs } = useDioramaStore.getState();
      const recent = recentLibraryKeys.filter((key) => Boolean(libraryItemByKey(key, known)));
      if (recent.length !== recentLibraryKeys.length) setLibraryPrefs({ recent });
    });
    return () => {
      unsubscribe();
      unsubscribeKits();
      if (timer !== undefined) {
        clearTimeout(timer);
        writeLibraryPrefs(currentPrefs());
      }
    };
  }, []);
}
