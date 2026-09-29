"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Background } from "@/types";

interface BackgroundGalleryProps {
  backgrounds: Background[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function BackgroundGallery({ backgrounds, selectedId, onSelect }: BackgroundGalleryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
      className="w-full rounded-3xl border border-white/25 bg-white/15 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl"
    >
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {backgrounds.map((bg) => {
          const isSelected = bg.id === selectedId;
          return (
            <motion.button
              key={bg.id}
              type="button"
              onClick={() => onSelect(bg.id)}
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors sm:h-20 sm:w-28",
                isSelected
                  ? "border-[#F0B27A] shadow-[0_0_16px_rgba(240,178,122,0.6)]"
                  : "border-white/20"
              )}
            >
              <Image
                src={bg.thumbnail}
                alt={bg.title}
                fill
                sizes="112px"
                className={cn(
                  "object-cover transition-transform",
                  isSelected && "scale-105"
                )}
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {bg.title}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
