"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorLoadingScreen, EditorMessageScreen } from "@/features/diorama/components/EditorScreens";
import { DIORAMA_BASES, type DioramaBase } from "@/features/diorama/types/diorama.types";
import { latestDioramaId } from "../storage/dioramaRepository";
import { createEmptyDiorama, createStarterDiorama } from "../storage/newDiorama";
import { editorPath, STORAGE_ERROR } from "../hooks/useDioramaLauncher";

/** What to open: the latest diorama (or the hero starter if there is none), or a new one from the URL's `starter` / `base`. */
async function resolveDiorama(to: "latest" | "new", search: URLSearchParams): Promise<string> {
  if (to === "latest") return (await latestDioramaId()) ?? createStarterDiorama();
  const base = search.get("base");
  if (base && (DIORAMA_BASES as readonly string[]).includes(base)) return createEmptyDiorama(base as DioramaBase);
  return createStarterDiorama(search.get("starter") ?? undefined);
}

/**
 * Sends the visitor to the editor of a diorama that is looked up or created
 * here. Other query parameters (such as `dev`) are carried along.
 */
export function DioramaRedirect({ to }: { to: "latest" | "new" }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  // Strict Mode runs effects twice; a diorama must still be created only once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const search = new URLSearchParams(window.location.search);
    resolveDiorama(to, search).then(
      (id) => {
        search.delete("starter");
        search.delete("base");
        const query = search.toString();
        router.replace(query ? `${editorPath(id)}?${query}` : editorPath(id));
      },
      () => setFailed(true)
    );
  }, [to, router]);

  return failed ? <EditorMessageScreen title="The editor can't open" message={STORAGE_ERROR} /> : <EditorLoadingScreen />;
}
