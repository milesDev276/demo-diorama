import type { DioramaObject, SurfaceMap } from "../types/diorama.types";

/** Cap on undo depth — keeps memory bounded even in a long editing session. */
export const MAX_HISTORY_LENGTH = 50;

/** What one undo step restores: the objects and the painted ground (plot scenes only). */
export interface HistoryEntry {
  objects: DioramaObject[];
  surface?: SurfaceMap;
}

function cloneEntry(entry: HistoryEntry): HistoryEntry {
  if (typeof structuredClone === "function") return structuredClone(entry);
  return JSON.parse(JSON.stringify(entry)) as HistoryEntry;
}

export interface HistoryState {
  history: HistoryEntry[];
  historyIndex: number;
}

export function createInitialHistory(objects: DioramaObject[], surface?: SurfaceMap): HistoryState {
  return { history: [cloneEntry({ objects, surface })], historyIndex: 0 };
}

/**
 * Snapshots `entry` onto the history stack, discarding any redo-able
 * future (per the "old future history should be discarded" rule). No-ops if
 * nothing actually changed since the last entry, so clicking without
 * dragging — or committing a no-op edit — doesn't pollute the undo stack.
 */
export function pushHistory(state: HistoryState, entry: HistoryEntry): HistoryState {
  const current = state.history[state.historyIndex];
  const snapshot = cloneEntry(entry);
  if (current && JSON.stringify(current) === JSON.stringify(snapshot)) {
    return state;
  }

  const truncated = state.history.slice(0, state.historyIndex + 1);
  const nextHistory = [...truncated, snapshot].slice(-MAX_HISTORY_LENGTH);
  return { history: nextHistory, historyIndex: nextHistory.length - 1 };
}

export function undoHistory(state: HistoryState): ({ historyIndex: number } & HistoryEntry) | null {
  if (state.historyIndex <= 0) return null;
  const nextIndex = state.historyIndex - 1;
  return { historyIndex: nextIndex, ...cloneEntry(state.history[nextIndex]) };
}

export function redoHistory(state: HistoryState): ({ historyIndex: number } & HistoryEntry) | null {
  if (state.historyIndex >= state.history.length - 1) return null;
  const nextIndex = state.historyIndex + 1;
  return { historyIndex: nextIndex, ...cloneEntry(state.history[nextIndex]) };
}
