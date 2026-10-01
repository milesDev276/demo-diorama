"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useDioramaStore } from "../store/dioramaStore";
import { cn } from "@/lib/cn";
import { getLibraryItems } from "../assets/assetRegistry";

/**
 * Left panel: click an item, then click a surface in the scene to put it
 * there. Activating an item from the keyboard adds it near the middle of
 * the base instead, so no pointer is needed. Never touches Three.js
 * directly — it only dispatches to the store.
 */
export function ObjectLibrary() {
  const addObject = useDioramaStore((s) => s.addObject);
  const startPlacement = useDioramaStore((s) => s.startPlacement);
  const cancelPlacement = useDioramaStore((s) => s.cancelPlacement);
  const placement = useDioramaStore((s) => s.placement);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => getLibraryItems(query), [query]);

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

      {groups.map(({ category, items }) => (
        <div key={category} className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">{category}</p>
          <div className="flex flex-col gap-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isPlacing = !!placement && !placement.movingId && placement.type === item.type && placement.params === item.params;
              return (
                <motion.button
                  key={item.key}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-pressed={isPlacing}
                  onClick={(event) => {
                    // detail is 0 when the button was activated from the keyboard.
                    if (event.detail === 0) addObject(item.type, item.params);
                    else if (isPlacing) cancelPlacement();
                    else startPlacement({ type: item.type, params: item.params });
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium text-[#4A3421] transition-colors cursor-pointer",
                    isPlacing
                      ? "border-[#F0B27A] bg-[#F0B27A]/25"
                      : "border-[#8b6f52]/10 bg-white/50 hover:border-[#8b6f52]/25 hover:bg-white"
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A7C4A0]/35 text-[#4A3421]">
                    <Icon size={16} />
                  </span>
                  {item.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
