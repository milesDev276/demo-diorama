"use client";

import { TreePine, Gem, Home, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useDioramaStore } from "../store/dioramaStore";
import { OBJECT_LIBRARY } from "../utils/objectLibrary";
import type { DioramaObjectType } from "../types/diorama.types";

const ICONS: Record<DioramaObjectType, LucideIcon> = {
  tree: TreePine,
  rock: Gem,
  house: Home,
};

/**
 * Left panel: click an item to add it to the Diorama. Never touches
 * Three.js directly — it only dispatches to the store.
 */
export function ObjectLibrary() {
  const addObject = useDioramaStore((s) => s.addObject);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="flex h-full w-full flex-col gap-5 overflow-y-auto rounded-3xl border border-[#8b6f52]/15 bg-white/70 p-4 shadow-[0_8px_32px_rgba(139,111,82,0.12)] backdrop-blur-xl"
    >
      <div>
        <h2 className="text-sm font-semibold text-[#4A3421]">Object Library</h2>
        <p className="text-xs text-[#4A3421]/50">Click to add to your Diorama</p>
      </div>

      {OBJECT_LIBRARY.map((category) => (
        <div key={category.title} className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">
            {category.title}
          </p>
          <div className="flex flex-col gap-1.5">
            {category.items.map((item) => {
              const Icon = ICONS[item.type];
              return (
                <motion.button
                  key={item.type}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addObject(item.type)}
                  className="flex items-center gap-2.5 rounded-xl border border-[#8b6f52]/10 bg-white/50 px-3 py-2.5 text-left text-sm font-medium text-[#4A3421] transition-colors hover:border-[#8b6f52]/25 hover:bg-white cursor-pointer"
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
