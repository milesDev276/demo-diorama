import type { DioramaObject } from "../types/diorama.types";

/** Cap on undo depth — keeps memory bounded even in a long editing session. */
export const MAX_HISTORY_LENGTH = 50;

export function cloneObjects(objects: DioramaObject[]): DioramaObject[] {
  if (typeof structuredClone === "function") return structuredClone(objects);
  return JSON.parse(JSON.stringify(objects)) as DioramaObject[];
}

export interface HistoryState {
  history: DioramaObject[][];
  historyIndex: number;
}

export function createInitialHistory(objects: DioramaObject[]): HistoryState {
  return { history: [cloneObjects(objects)], historyIndex: 0 };
}

/**
 * Snapshots `objects` onto the history stack, discarding any redo-able
 * future (per the "old future history should be discarded" rule). No-ops if
 * nothing actually changed since the last entry, so clicking without
 * dragging — or committing a no-op edit — doesn't pollute the undo stack.
 */
export function pushHistory(state: HistoryState, objects: DioramaObject[]): HistoryState {
  const current = state.history[state.historyIndex];
  const snapshot = cloneObjects(objects);
  if (current && JSON.stringify(current) === JSON.stringify(snapshot)) {
    return state;
  }

  const truncated = state.history.slice(0, state.historyIndex + 1);
  const nextHistory = [...truncated, snapshot].slice(-MAX_HISTORY_LENGTH);
  return { history: nextHistory, historyIndex: nextHistory.length - 1 };
}

export function undoHistory(
  state: HistoryState
): { historyIndex: number; objects: DioramaObject[] } | null {
  if (state.historyIndex <= 0) return null;
  const nextIndex = state.historyIndex - 1;
  return { historyIndex: nextIndex, objects: cloneObjects(state.history[nextIndex]) };
}

export function redoHistory(
  state: HistoryState
): { historyIndex: number; objects: DioramaObject[] } | null {
  if (state.historyIndex >= state.history.length - 1) return null;
  const nextIndex = state.historyIndex + 1;
  return { historyIndex: nextIndex, objects: cloneObjects(state.history[nextIndex]) };
}
