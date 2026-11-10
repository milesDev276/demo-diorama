"use client";

import Image from "next/image";
import { Paintbrush } from "lucide-react";
import { motion } from "framer-motion";
import { useDioramaStore } from "../store/dioramaStore";
import { cn } from "@/lib/cn";
import type { LibraryItem } from "../assets/assetRegistry";
import { SURFACE_KIND_SPECS, surfaceSwatch } from "../assets/surfaceKinds";
import type { SurfaceKind } from "../types/diorama.types";
import { scatterPatchParams } from "../utils/objectDefaults";
import { KitCardActions } from "./KitCardActions";

/** The library's cards (moved out of ObjectLibrary in plan/Stage-22-Implementation.md). */

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

export function LibraryCard({ item }: { item: LibraryItem }) {
  const isActive = useIsActive(item);
  const Icon = item.icon;
  const userKit = item.action === "kit" && !item.kit.builtIn ? item.kit : null;

  const activate = (fromKeyboard: boolean) => {
    const store = useDioramaStore.getState();
    if (fromKeyboard || !isActive) store.noteLibraryUse(item.key);
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
      {userKit && <KitCardActions kit={userKit} />}
    </div>
  );
}

/** A ground material of a plot scene: picking it starts the ground brush, picking it again ends it. */
export function GroundCard({ kind }: { kind: SurfaceKind }) {
  const isActive = useDioramaStore((s) => s.groundBrush?.kind === kind);
  const spec = SURFACE_KIND_SPECS[kind];

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-pressed={isActive}
      title={`${spec.label} — paint the ground`}
      onClick={() => {
        const store = useDioramaStore.getState();
        if (isActive) store.stopGroundBrush();
        else store.startGroundBrush(kind);
      }}
      className={cn(
        "flex w-full flex-col items-center gap-1 rounded-xl border p-1 pb-1.5 text-center transition-colors cursor-pointer",
        isActive ? "border-[#F0B27A] bg-[#F0B27A]/25" : "border-[#8b6f52]/10 bg-white/50 hover:border-[#8b6f52]/25 hover:bg-white"
      )}
    >
      <span className="relative block h-7 w-full overflow-hidden rounded-lg" style={{ background: surfaceSwatch(kind) }}>
        <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/85 text-[#4A3421]">
          <Paintbrush size={9} aria-hidden />
        </span>
      </span>
      <span className="text-[10px] font-medium leading-tight text-[#4A3421]">{spec.label}</span>
    </motion.button>
  );
}
