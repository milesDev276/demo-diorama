"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Paintbrush, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useDioramaStore } from "../store/dioramaStore";
import { useKitStore } from "../store/kitStore";
import { cn } from "@/lib/cn";
import { getLibraryItems, type LibraryItem } from "../assets/assetRegistry";
import { BUILT_IN_KITS } from "../assets/builtInKits";
import { scatterPatchParams } from "../utils/objectDefaults";

/** Whether the item's placement or brush is the one running now. */
function useIsActive(item: LibraryItem): boolean {
  return useDioramaStore((s) => {
    if (item.action === "brush") return s.brush?.kind === item.kind;
    const placement = s.placement;
    if (!placement) return false;
    if (item.action === "kit") return "kit" in placement && placement.kit.id === item.kit.id;
    return !("kit" in placement) && !placement.movingId && placement.type === item.type && placement.params === item.params;
  });
}

function LibraryCard({ item }: { item: LibraryItem }) {
  const isActive = useIsActive(item);
  const deleteKit = useKitStore((s) => s.deleteKit);
  const Icon = item.icon;
  const userKit = item.action === "kit" && !item.kit.builtIn ? item.kit : null;

  const activate = (fromKeyboard: boolean) => {
    const store = useDioramaStore.getState();
    if (fromKeyboard) {
      // No pointer: add near the middle of the base instead of picking a surface.
      if (item.action === "place") store.addObject(item.type, item.params);
      else if (item.action === "brush") store.addObject("scatter", scatterPatchParams(item.kind));
      else store.addKit(item.kit);
      return;
    }
    if (isActive) {
      if (item.action === "brush") store.stopBrush();
      else store.cancelPlacement();
      return;
    }
    if (item.action === "place") store.startPlacement({ type: item.type, params: item.params });
    else if (item.action === "brush") store.startBrush(item.kind);
    else store.startPlacement({ kit: item.kit });
  };

  return (
    <div className="group relative">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-pressed={isActive}
        title={item.action === "brush" ? `${item.label} — paint with a brush` : item.label}
        // detail is 0 when the button was activated from the keyboard.
        onClick={(event) => activate(event.detail === 0)}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-2xl border p-1.5 pb-2 text-center transition-colors cursor-pointer",
          isActive
            ? "border-[#F0B27A] bg-[#F0B27A]/25"
            : "border-[#8b6f52]/10 bg-white/50 hover:border-[#8b6f52]/25 hover:bg-white"
        )}
      >
        <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#f3ece0] to-[#e6dccb] text-[#4A3421]/70">
          {item.thumbnail ? (
            <Image src={item.thumbnail} alt="" width={192} height={192} unoptimized className="h-full w-full object-contain" />
          ) : (
            <Icon size={26} />
          )}
          {item.action === "brush" && (
            <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[#4A3421]">
              <Paintbrush size={11} aria-hidden />
            </span>
          )}
        </span>
        <span className="line-clamp-2 text-[11px] font-medium leading-tight text-[#4A3421]">{item.label}</span>
      </motion.button>
      {userKit && (
        <button
          type="button"
          aria-label={`Delete kit ${userKit.name}`}
          onClick={() => {
            if (window.confirm(`Delete the kit “${userKit.name}”?`)) deleteKit(userKit.id);
          }}
          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-400 opacity-0 shadow-sm transition-opacity hover:text-red-500 focus:opacity-100 group-hover:opacity-100 cursor-pointer"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

/**
 * Left panel: click an item, then click a surface in the scene to put it
 * there; a scatter item starts the brush instead, and a kit places a whole
 * group. Activating an item from the keyboard adds it near the middle of
 * the base, so no pointer is needed. Never touches Three.js directly — it
 * only dispatches to the store.
 */
export function ObjectLibrary() {
  const userKits = useKitStore((s) => s.kits);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => getLibraryItems(query, [...userKits, ...BUILT_IN_KITS]), [query, userKits]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="flex h-full w-full flex-col gap-5 overflow-y-auto rounded-3xl border border-[#8b6f52]/15 bg-white/70 p-4 shadow-[0_8px_32px_rgba(139,111,82,0.12)] backdrop-blur-xl"
    >
      <div>
        <h2 className="text-sm font-semibold text-[#4A3421]">Object Library</h2>
        <p className="text-xs text-[#4A3421]/50">Pick an item, then click where it goes</p>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-[#8b6f52]/15 bg-white/60 px-3 py-2 text-[#4A3421]/50 focus-within:border-[#8b6f52]/40 focus-within:bg-white">
        <Search size={14} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets…"
          aria-label="Search assets"
          className="w-full bg-transparent text-sm text-[#4A3421] placeholder:text-[#4A3421]/40 focus:outline-none"
        />
      </label>

      {groups.length === 0 && (
        <p className="text-xs text-[#4A3421]/50">No assets match “{query.trim()}”.</p>
      )}

      {groups.map(({ title, items }) => (
        <div key={title} className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">{title}</p>
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <LibraryCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
