"use client";

import { useEffect, useState } from "react";
import { useDioramaStore } from "@/features/diorama/store/dioramaStore";
import { getDiorama } from "../storage/dioramaRepository";

export type OpenDioramaStatus = { state: "loading" } | { state: "ready" } | { state: "missing" } | { state: "error"; message: string };

/**
 * Loads the diorama `id` from the collection into the editor's store. The
 * editor mounts its canvas (and its autosave) only once this is `ready`.
 */
export function useOpenDiorama(id: string): OpenDioramaStatus {
  const [status, setStatus] = useState<OpenDioramaStatus>({ state: "loading" });

  useEffect(() => {
    // The editor is keyed by id, so `status` starts as loading for every diorama.
    let cancelled = false;
    getDiorama(id).then(
      (scene) => {
        if (cancelled) return;
        if (!scene) {
          setStatus({ state: "missing" });
          return;
        }
        useDioramaStore.getState().loadScene(scene);
        setStatus({ state: "ready" });
      },
      (error: unknown) => {
        if (cancelled) return;
        setStatus({ state: "error", message: error instanceof Error ? error.message : String(error) });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  return status;
}
