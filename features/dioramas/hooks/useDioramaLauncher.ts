"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { DioramaBase } from "@/features/diorama/types/diorama.types";
import { readFileAsText } from "@/features/diorama/utils/sceneSerializer";
import { createEmptyDiorama, createStarterDiorama, importDiorama } from "../storage/newDiorama";

export const STORAGE_ERROR = "This browser could not store the diorama. Private windows sometimes block storage.";

export function editorPath(id: string): string {
  return `/diorama/${encodeURIComponent(id)}`;
}

/**
 * Creates a diorama (empty, from a starter, or from a file) and opens it
 * in the editor. Used by the home page, My Dioramas and the editor's New
 * and Import.
 */
export function useDioramaLauncher() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const launch = useCallback(
    async (start: () => Promise<string | { id: string } | { error: string }>) => {
      setBusy(true);
      setError(null);
      try {
        const result = await start();
        if (typeof result !== "string" && "error" in result) {
          setError(result.error);
          setBusy(false);
          return;
        }
        router.push(editorPath(typeof result === "string" ? result : result.id));
      } catch {
        setError(STORAGE_ERROR);
        setBusy(false);
      }
    },
    [router]
  );

  return {
    busy,
    error,
    clearError: useCallback(() => setError(null), []),
    createEmpty: useCallback((base: DioramaBase) => launch(() => createEmptyDiorama(base)), [launch]),
    createFromStarter: useCallback((templateId?: string) => launch(() => createStarterDiorama(templateId)), [launch]),
    importFile: useCallback((file: File) => launch(async () => importDiorama(await readFileAsText(file))), [launch]),
  };
}
