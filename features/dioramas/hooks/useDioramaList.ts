"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { downloadSceneAsJson } from "@/features/diorama/utils/sceneSerializer";
import type { DioramaEntry } from "../types";
import { deleteDiorama, duplicateDiorama, getDiorama, listDioramas, renameDiorama } from "../storage/dioramaRepository";

export interface DioramaListItem {
  entry: DioramaEntry;
  /** An object URL of the thumbnail, revoked when the list reloads or closes. */
  thumbnailUrl: string | null;
}

export type DioramaListState =
  | { status: "loading" }
  | { status: "ready"; items: DioramaListItem[] }
  | { status: "error" };

/** My Dioramas' list and what can be done to its dioramas. Every action reloads the list. */
export function useDioramaList() {
  const [state, setState] = useState<DioramaListState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const urls = useRef<string[]>([]);
  const alive = useRef(true);

  const revokeAll = () => {
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current = [];
  };

  const reload = useCallback(async () => {
    try {
      const entries = await listDioramas();
      if (!alive.current) return;
      revokeAll();
      const items = entries.map((entry) => {
        const thumbnailUrl = entry.thumbnail ? URL.createObjectURL(entry.thumbnail) : null;
        if (thumbnailUrl) urls.current.push(thumbnailUrl);
        return { entry, thumbnailUrl };
      });
      setState({ status: "ready", items });
    } catch {
      if (alive.current) setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void reload();
    return () => {
      alive.current = false;
      revokeAll();
    };
  }, [reload]);

  const act = useCallback(
    async (action: () => Promise<unknown>, failure: string) => {
      setActionError(null);
      try {
        await action();
      } catch {
        setActionError(failure);
      }
      await reload();
    },
    [reload]
  );

  return {
    state,
    actionError,
    clearActionError: useCallback(() => setActionError(null), []),
    rename: useCallback((id: string, name: string) => act(() => renameDiorama(id, name), "The diorama could not be renamed."), [act]),
    duplicate: useCallback((id: string) => act(() => duplicateDiorama(id), "The diorama could not be duplicated."), [act]),
    remove: useCallback((id: string) => act(() => deleteDiorama(id), "The diorama could not be deleted."), [act]),
    exportFile: useCallback(
      (id: string) =>
        act(async () => {
          const scene = await getDiorama(id);
          if (scene) downloadSceneAsJson(scene);
        }, "The diorama could not be exported."),
      [act]
    ),
  };
}
