"use client";

import { useRef, useState } from "react";
import { Download, Pencil, X } from "lucide-react";
import type { Kit } from "../types/diorama.types";
import { useKitStore } from "../store/kitStore";
import { downloadKit } from "../utils/kitFile";
import { KIT_NAME_MAX } from "../utils/kits";

const ACTION_CLASS =
  "rounded-full bg-white/90 p-1 text-[#4A3421]/60 shadow-sm transition-colors hover:text-[#4A3421] cursor-pointer";

/**
 * What a user's own kit offers on its library card: rename, export as a
 * file, delete. The buttons show on hover and on keyboard focus; renaming
 * puts a field over the card's label.
 */
export function KitCardActions({ kit }: { kit: Kit }) {
  const renameKit = useKitStore((s) => s.renameKit);
  const deleteKit = useKitStore((s) => s.deleteKit);
  const [draft, setDraft] = useState<string | null>(null);

  // Esc removes the field, which also blurs it: that blur must not save.
  const cancelledRef = useRef(false);

  const commit = () => {
    if (draft !== null && !cancelledRef.current) renameKit(kit.id, draft);
    setDraft(null);
  };

  return (
    <>
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" aria-label={`Rename kit ${kit.name}`} title="Rename" onClick={() => {
            cancelledRef.current = false;
            setDraft(kit.name);
          }} className={ACTION_CLASS}>
          <Pencil size={11} />
        </button>
        <button type="button" aria-label={`Export kit ${kit.name}`} title="Export as a file" onClick={() => downloadKit(kit)} className={ACTION_CLASS}>
          <Download size={11} />
        </button>
        <button
          type="button"
          aria-label={`Delete kit ${kit.name}`}
          title="Delete"
          onClick={() => {
            if (window.confirm(`Delete the kit “${kit.name}”?`)) deleteKit(kit.id);
          }}
          className="rounded-full bg-white/90 p-1 text-red-400 shadow-sm transition-colors hover:text-red-500 cursor-pointer"
        >
          <X size={11} />
        </button>
      </div>
      {draft !== null && (
        <input
          autoFocus
          aria-label="Kit name"
          value={draft}
          maxLength={KIT_NAME_MAX}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              cancelledRef.current = true;
              setDraft(null);
            }
          }}
          className="absolute inset-x-1 bottom-1 rounded-md border border-[#F0B27A] bg-white px-1.5 py-1 text-center text-[11px] font-medium text-[#4A3421] outline-none"
        />
      )}
    </>
  );
}
