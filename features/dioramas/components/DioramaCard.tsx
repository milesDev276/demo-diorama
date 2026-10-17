"use client";

import { useState } from "react";
import Link from "next/link";
import { Trees } from "lucide-react";
import { editorPath } from "../hooks/useDioramaLauncher";
import type { DioramaListItem } from "../hooks/useDioramaList";
import { timeAgo } from "../utils/relativeTime";
import { DioramaCardMenu } from "./DioramaCardMenu";

interface DioramaCardProps {
  item: DioramaListItem;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}

/** One diorama in My Dioramas: its thumbnail opens it; the name can be edited in place. */
export function DioramaCard({ item, onRename, onDuplicate, onExport, onDelete }: DioramaCardProps) {
  const { entry, thumbnailUrl } = item;
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(entry.name);

  const commit = () => {
    setRenaming(false);
    const name = draft.trim();
    if (name && name !== entry.name) onRename(name);
  };

  return (
    <li className="group flex flex-col overflow-visible rounded-3xl border border-[#8b6f52]/15 bg-white/60 shadow-[0_8px_24px_rgba(139,111,82,0.08)] transition-shadow hover:shadow-[0_12px_32px_rgba(139,111,82,0.16)]">
      <Link
        href={editorPath(entry.id)}
        aria-label={`Open ${entry.name}`}
        className="block overflow-hidden rounded-t-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F52]"
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL, nothing for next/image to optimize
          <img src={thumbnailUrl} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <span className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-b from-[#e9dcc8] to-[#d9c4a6] text-[#8B6F52]/70">
            <Trees size={28} />
          </span>
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 px-4 pb-4 pt-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={draft}
              maxLength={80}
              aria-label="Diorama name"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setDraft(entry.name);
                  setRenaming(false);
                }
              }}
              className="w-full rounded-md border border-[#F0B27A]/60 bg-white px-1.5 py-0.5 text-sm font-semibold text-[#4A3421] outline-none"
            />
          ) : (
            <h2 className="truncate text-sm font-semibold text-[#4A3421]" title={entry.name}>
              {entry.name}
            </h2>
          )}
          <p className="mt-0.5 text-xs text-[#4A3421]/55">
            Edited {timeAgo(entry.updatedAt)} · {entry.objectCount} {entry.objectCount === 1 ? "object" : "objects"}
          </p>
        </div>
        <DioramaCardMenu
          name={entry.name}
          onRename={() => {
            setDraft(entry.name);
            setRenaming(true);
          }}
          onDuplicate={onDuplicate}
          onExport={onExport}
          onDelete={onDelete}
        />
      </div>
    </li>
  );
}
