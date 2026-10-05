import { create } from "zustand";
import type { Kit } from "../types/diorama.types";
import { createId } from "../utils/id";
import { KIT_FILE_VERSION } from "../utils/kitFile";
import { KIT_NAME_MAX, normalizeKits } from "../utils/kits";

/** Kits are library data, not scene data: kept apart from the scene's autosave. */
export const KIT_STORAGE_KEY = "diorama-kits";

interface KitState {
  /** The user's own kits, newest first. Built-in kits live in assets/builtInKits.ts. */
  kits: Kit[];
  addKit: (kit: Kit) => void;
  deleteKit: (id: string) => void;
  /** Gives a kit another name; an empty name changes nothing. */
  renameKit: (id: string, name: string) => void;
  /** Adds kits read from a file. Each gets a new id, so nothing in the library is replaced. */
  importKits: (kits: Kit[]) => void;
}

function loadKits(): Kit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KIT_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { version?: unknown; kits?: unknown };
    if (typeof data.version === "number" && data.version > KIT_FILE_VERSION) return [];
    return normalizeKits(data.kits);
  } catch {
    return []; // Unreadable storage: start without user kits rather than crash.
  }
}

/** Saving a kit is a rare, explicit action, so every change is written at once. */
function storeKits(kits: Kit[]): void {
  try {
    window.localStorage.setItem(KIT_STORAGE_KEY, JSON.stringify({ version: KIT_FILE_VERSION, kits }));
  } catch {
    // Storage unavailable or full — the kits still work for this session.
  }
}

export const useKitStore = create<KitState>((set) => ({
  kits: loadKits(),
  addKit: (kit) =>
    set((state) => {
      const kits = [kit, ...state.kits];
      storeKits(kits);
      return { kits };
    }),
  deleteKit: (id) =>
    set((state) => {
      const kits = state.kits.filter((kit) => kit.id !== id);
      storeKits(kits);
      return { kits };
    }),
  renameKit: (id, name) =>
    set((state) => {
      const trimmed = name.trim().slice(0, KIT_NAME_MAX);
      if (!trimmed) return state;
      const kits = state.kits.map((kit) => (kit.id === id ? { ...kit, name: trimmed } : kit));
      storeKits(kits);
      return { kits };
    }),
  importKits: (imported) =>
    set((state) => {
      const kits = [...imported.map((kit) => ({ ...kit, id: createId("kit") })), ...state.kits];
      storeKits(kits);
      return { kits };
    }),
}));
