"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { editorPath } from "@/features/dioramas/hooks/useDioramaLauncher";
import { HERO_BUTTON } from "./heroButton";
import { StartBuildingButton } from "./StartBuildingButton";
import { useHomeCollection } from "./HomeCollection";

/**
 * The hero's buttons (D4): Start building on a first visit; Continue with
 * the most recently edited diorama, and the way to all of them, when this
 * browser has some. While the collection is being read, a quiet stand-in
 * of the same height keeps the page from jumping or showing the wrong
 * button. Unreadable storage counts as a first visit.
 */
export function HomeActions() {
  const collection = useHomeCollection();

  if (collection.status === "loading") {
    return <div aria-hidden className="h-12 w-52 rounded-full bg-[#F0B27A]/25" />;
  }
  if (collection.status === "error" || collection.items.length === 0) return <StartBuildingButton />;

  const latest = collection.items[0].entry;
  const total = collection.items.length;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <Link
        href={editorPath(latest.id)}
        className={`${HERO_BUTTON} min-w-0 max-w-full`}
      >
        <span className="truncate">Continue “{latest.name}”</span>
        <ArrowRight size={18} className="shrink-0" />
      </Link>
      <Link
        href="/dioramas"
        className="rounded-full text-sm font-medium text-[#4A3421]/70 underline-offset-4 transition-colors hover:text-[#4A3421] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B6F52]"
      >
        My Dioramas ({total})
      </Link>
    </div>
  );
}
