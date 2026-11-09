"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Paintbrush, Search, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useDioramaStore } from "../store/dioramaStore";
import { useKitStore } from "../store/kitStore";
import { cn } from "@/lib/cn";
import { getLibraryItems, LIBRARY_CATEGORIES, type LibraryCategory, type LibraryItem } from "../assets/assetRegistry";
import { BUILT_IN_KITS } from "../assets/builtInKits";
import { SURFACE_KIND_SPECS, surfaceSwatch } from "../assets/surfaceKinds";
import { SURFACE_KINDS, type SurfaceKind } from "../types/diorama.types";
import { parseKitFile } from "../utils/kitFile";
import { scatterPatchParams } from "../utils/objectDefaults";
import { readFileAsText } from "../utils/sceneSerializer";
import { KitCardActions } from "./KitCardActions";

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
      {userKit && <KitCardActions kit={userKit} />}
    </div>
  );
}

/** A ground material of a plot scene: picking it starts the ground brush, picking it again ends it. */
function GroundCard({ kind }: { kind: SurfaceKind }) {
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

/** "Import" beside the Kits heading: reads kit files into the library and says what went wrong, if anything. */
function KitImport({ onMessage }: { onMessage: (message: string | null) => void }) {
  const importKits = useKitStore((s) => s.importKits);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow importing the same file again later
    const kits = [];
    let error: string | null = null;
    for (const file of files) {
      const result = parseKitFile(await readFileAsText(file).catch(() => ""));
      if ("error" in result) error = files.length > 1 ? `${file.name}: ${result.error}` : result.error;
      else kits.push(...result.kits);
    }
    if (kits.length) importKits(kits);
    onMessage(error);
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="application/json,.json" multiple className="hidden" onChange={handleFiles} />
      <button
        type="button"
        title="Import kit files"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-[#4A3421]/60 transition-colors hover:bg-white hover:text-[#4A3421] cursor-pointer"
      >
        <Upload size={11} aria-hidden />
        Import
      </button>
    </>
  );
}

/** The category chips under the search box: one section of the library, or all of them. */
function CategoryChips({ category, showGround }: { category: LibraryCategory; showGround: boolean }) {
  const setCategory = useDioramaStore((s) => s.setLibraryCategory);
  const chips = showGround ? LIBRARY_CATEGORIES : LIBRARY_CATEGORIES.filter((c) => c !== "Ground");

  return (
    <div role="group" aria-label="Library categories" className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          aria-pressed={chip === category}
          onClick={() => setCategory(chip)}
          className={cn(
            "rounded-full border px-1.5 py-px text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer",
            chip === category
              ? "border-[#F0B27A] bg-[#F0B27A]/30 text-[#4A3421]"
              : "border-[#8b6f52]/15 bg-white/50 text-[#4A3421]/65 hover:bg-white hover:text-[#4A3421]"
          )}
        >
          {chip === "all" ? "All" : chip}
        </button>
      ))}
    </div>
  );
}

/**
 * The Library tab: click an item, then click a surface in the scene to put
 * it there (the canvas says so while a surface is being picked); a scatter
 * item starts the brush instead, and a kit places a whole group. On a plot
 * scene the ground materials come first: they paint. Activating an item
 * from the keyboard adds it near the middle of the base, so no pointer is
 * needed. A category chip narrows it to one section, and the search runs
 * inside that section. Never touches Three.js directly — it only
 * dispatches to the store.
 */
export function ObjectLibrary() {
  const userKits = useKitStore((s) => s.kits);
  const [query, setQuery] = useState("");
  const [kitMessage, setKitMessage] = useState<string | null>(null);
  const isPlot = useDioramaStore((s) => s.environment.base === "plot");
  const chosen = useDioramaStore((s) => s.libraryCategory);
  // Ground materials exist only on a plot; elsewhere their chip is gone and the whole library shows.
  const category: LibraryCategory = chosen === "Ground" && !isPlot ? "all" : chosen;
  const groups = useMemo(
    () => getLibraryItems(query, [...userKits, ...BUILT_IN_KITS]).filter(({ title }) => category === "all" || title === category),
    [query, userKits, category]
  );
  const groundKinds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SURFACE_KINDS.filter((kind) => {
      const { label, tags } = SURFACE_KIND_SPECS[kind];
      return !q || label.toLowerCase().includes(q) || tags.some((tag) => tag.includes(q));
    });
  }, [query]);
  const showGround = isPlot && (category === "all" || category === "Ground") && groundKinds.length > 0;
  const where = category === "all" ? "" : ` in ${category}`;

  return (
    <div className="flex flex-col gap-4">
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

      <CategoryChips category={category} showGround={isPlot} />

      {groups.length === 0 && !showGround && (
        <p className="text-xs text-[#4A3421]/50">
          {query.trim() ? `Nothing${where} matches “${query.trim()}”.` : `Nothing${where} yet.`}
        </p>
      )}

      {showGround && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">Ground</p>
          {/* As many columns as the column's width holds (Stage 21 D5): four at the default width. */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
            {groundKinds.map((kind) => (
              <GroundCard key={kind} kind={kind} />
            ))}
          </div>
        </div>
      )}

      {groups.map(({ title, items }) => (
        <div key={title} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">{title}</p>
            {title === "Kits" && <KitImport onMessage={setKitMessage} />}
          </div>
          {title === "Kits" && kitMessage && (
            <p role="alert" className="rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-600">
              {kitMessage}
            </p>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {items.map((item) => (
              <LibraryCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
