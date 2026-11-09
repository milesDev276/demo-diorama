import { ASSET_CATEGORY_ORDER, type AssetCategory } from "../assets/assetRegistry";

/**
 * The library's sections and how this browser remembers their folding and
 * the recently used items (plan/Stage-22-Implementation.md D1, D3, D5).
 * Editor preferences, not scene data.
 */

export type LibrarySectionId = "Recent" | "Ground" | AssetCategory | "Kits";

export const LIBRARY_SECTIONS: LibrarySectionId[] = ["Recent", "Ground", ...ASSET_CATEGORY_ORDER, "Kits"];

/**
 * A first visit: every section folded but Recent, so the whole list of
 * sections fits the panel at 1366 × 768 (D1; Ground and Buildings open did
 * not: Buildings alone is about 520 px tall).
 */
export const DEFAULT_FOLDED_SECTIONS: LibrarySectionId[] = LIBRARY_SECTIONS.filter((id) => id !== "Recent");

/** How many recently used items the Recent section keeps (D3). */
export const RECENT_LIMIT = 8;

const STORAGE_KEY = "diorama-library";

export interface LibraryPrefs {
  folded: LibrarySectionId[];
  recent: string[];
}

const isSectionId = (value: unknown): value is LibrarySectionId =>
  typeof value === "string" && (LIBRARY_SECTIONS as string[]).includes(value);

/** `key` first, no duplicates, at most RECENT_LIMIT. */
export function withRecent(recent: string[], key: string): string[] {
  return [key, ...recent.filter((k) => k !== key)].slice(0, RECENT_LIMIT);
}

/**
 * What this browser remembers; a missing or malformed part is left out.
 * `isKnownItem` drops recent keys the library no longer has.
 */
export function readLibraryPrefs(isKnownItem: (key: string) => boolean): Partial<LibraryPrefs> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const stored = JSON.parse(raw) as Record<string, unknown> | null;
    const prefs: Partial<LibraryPrefs> = {};
    if (Array.isArray(stored?.folded)) prefs.folded = [...new Set(stored.folded.filter(isSectionId))];
    if (Array.isArray(stored?.recent)) {
      const keys = stored.recent.filter((key): key is string => typeof key === "string" && isKnownItem(key));
      prefs.recent = [...new Set(keys)].slice(0, RECENT_LIMIT);
    }
    return prefs;
  } catch {
    return {}; // storage blocked or unreadable: the defaults
  }
}

export function writeLibraryPrefs(prefs: LibraryPrefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage blocked or full: the library is simply not remembered
  }
}
