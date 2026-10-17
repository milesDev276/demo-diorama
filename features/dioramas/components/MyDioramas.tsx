"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, Plus, Upload, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { NewSceneDialog } from "@/features/diorama/components/NewSceneDialog";
import type { DioramaEntry } from "../types";
import { useDioramaLauncher } from "../hooks/useDioramaLauncher";
import { useDioramaList } from "../hooks/useDioramaList";
import { DioramaCard } from "./DioramaCard";
import { DeleteDioramaDialog } from "./DeleteDioramaDialog";
import { StarterCards } from "./StarterCards";

const BUTTON =
  "flex items-center gap-1.5 rounded-full border border-[#8b6f52]/20 bg-white/50 px-3.5 py-2 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#8B6F52] cursor-pointer disabled:cursor-wait disabled:opacity-60";
const PRIMARY =
  "flex items-center gap-1.5 rounded-full bg-[#F0B27A] px-4 py-2 text-sm font-medium text-[#4A3421] shadow-[0_4px_16px_rgba(240,178,122,0.4)] transition-colors hover:bg-[#eda868] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F52] cursor-pointer";

/** The local collection: every diorama in this browser, the most recently edited first. */
export function MyDioramas() {
  const list = useDioramaList();
  const launcher = useDioramaLauncher();
  const [newOpen, setNewOpen] = useState(false);
  const [deleting, setDeleting] = useState<DioramaEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelDelete = useCallback(() => setDeleting(null), []);

  const error = list.actionError ?? (newOpen ? null : launcher.error);
  const clearError = () => {
    list.clearActionError();
    launcher.clearError();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await launcher.importFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] to-[#EAD9C2]">
      <SiteHeader current="dioramas" />
      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#4A3421]">My Dioramas</h1>
            <p className="mt-1 text-sm text-[#4A3421]/60">Kept in this browser. Export a diorama to keep a copy or move it.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className={BUTTON} disabled={launcher.busy} onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} /> Import file
            </button>
            <button type="button" className={PRIMARY} onClick={() => setNewOpen(true)}>
              <Plus size={15} /> New diorama
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-2xl border border-red-300/50 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={clearError} aria-label="Dismiss" className="rounded-md p-1 transition-colors hover:bg-red-100 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {list.state.status === "loading" && <p className="py-16 text-center text-sm text-[#8B6F52]">Loading your dioramas…</p>}

        {list.state.status === "error" && (
          <p className="py-16 text-center text-sm text-[#4A3421]/70">
            Your dioramas can&apos;t be read in this browser window. Private windows sometimes block storage.
          </p>
        )}

        {list.state.status === "ready" && list.state.items.length === 0 && (
          <section aria-labelledby="empty-title" className="rounded-3xl border border-dashed border-[#8b6f52]/30 bg-white/30 p-6 sm:p-8">
            <h2 id="empty-title" className="text-base font-semibold text-[#4A3421]">
              No dioramas yet
            </h2>
            <p className="mb-5 mt-1 text-sm text-[#4A3421]/60">Start from a finished street, or choose New diorama for an empty base.</p>
            <StarterCards />
          </section>
        )}

        {list.state.status === "ready" && list.state.items.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.state.items.map((item) => (
              <DioramaCard
                key={item.entry.id}
                item={item}
                onRename={(name) => void list.rename(item.entry.id, name)}
                onDuplicate={() => void list.duplicate(item.entry.id)}
                onExport={() => void list.exportFile(item.entry.id)}
                onDelete={() => setDeleting(item.entry)}
              />
            ))}
          </ul>
        )}
      </main>

      <NewSceneDialog
        open={newOpen}
        busy={launcher.busy}
        error={launcher.error}
        onCancel={() => {
          setNewOpen(false);
          launcher.clearError();
        }}
        onCreate={(base) => void launcher.createEmpty(base)}
        onCreateFromTemplate={(templateId) => void launcher.createFromStarter(templateId)}
      />
      <DeleteDioramaDialog
        name={deleting?.name ?? null}
        onCancel={cancelDelete}
        onConfirm={() => {
          if (deleting) void list.remove(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
