"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { editorPath } from "@/features/dioramas/hooks/useDioramaLauncher";
import { DioramaThumbnail } from "@/features/dioramas/components/DioramaThumbnail";
import { timeAgo } from "@/features/dioramas/utils/relativeTime";
import { useHomeCollection } from "./HomeCollection";

/** How many of the newest dioramas the home page shows. */
const SHOWN = 4;

/**
 * The returning visitor's newest dioramas on the home page (D4): each card
 * opens one; renaming, duplicating and deleting stay in My Dioramas.
 * Nothing at all on a first visit, while reading, or without storage.
 */
export function YourDioramas() {
  const collection = useHomeCollection();
  if (collection.status !== "ready" || collection.items.length === 0) return null;

  const total = collection.items.length;
  return (
    <section aria-labelledby="your-dioramas-title" className="py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="your-dioramas-title" className="text-lg font-semibold text-[#4A3421]">
            Your dioramas
          </h2>
          <p className="mt-1 text-sm text-[#4A3421]/60">Pick up where you left off.</p>
        </div>
        {total > SHOWN && (
          <Link
            href="/dioramas"
            className="flex shrink-0 items-center gap-1 rounded-full px-1 text-sm font-medium text-[#4A3421]/70 transition-colors hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F52]"
          >
            See all {total} <ArrowRight size={15} />
          </Link>
        )}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collection.items.slice(0, SHOWN).map(({ entry, thumbnailUrl }) => (
          <li key={entry.id}>
            <Link
              href={editorPath(entry.id)}
              aria-label={`Open ${entry.name}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#8b6f52]/15 bg-white/60 shadow-[0_8px_24px_rgba(139,111,82,0.08)] transition-shadow hover:shadow-[0_12px_32px_rgba(139,111,82,0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F52]"
            >
              <span className="block overflow-hidden">
                <DioramaThumbnail url={thumbnailUrl} className={thumbnailUrl ? "transition-transform duration-300 group-hover:scale-[1.02]" : undefined} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 px-4 pb-4 pt-3">
                <span className="truncate text-sm font-semibold text-[#4A3421]" title={entry.name}>
                  {entry.name}
                </span>
                <span className="text-xs text-[#4A3421]/55">Edited {timeAgo(entry.updatedAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
