"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useStuckSection } from "../hooks/useStuckSection";
import { Search, Upload } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { useKitStore } from "../store/kitStore";
import { cn } from "@/lib/cn";
import {
  getLibraryItems,
  LIBRARY_CATEGORIES,
  libraryItemByKey,
  type LibraryCategory,
  type LibraryItem,
} from "../assets/assetRegistry";
import { BUILT_IN_KITS } from "../assets/builtInKits";
import { SURFACE_KIND_SPECS } from "../assets/surfaceKinds";
import { SURFACE_KINDS } from "../types/diorama.types";
import { parseKitFile } from "../utils/kitFile";
import type { LibrarySectionId } from "../utils/libraryPrefs";
import { readFileAsText } from "../utils/sceneSerializer";
import { GroundCard, LibraryCard } from "./LibraryCards";
import { LibrarySection } from "./LibrarySection";

/** "Import" beside the Kits heading: reads kit files into the library and says what went wrong, if anything. */
function KitImport({ onMessage }: { onMessage: (message: string | null) => void }) {
  const importKits = useKitStore((s) => s.importKits);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow importing the same file again later
    // The kits, or what went wrong, show in the section's body: unfold it.
    if (files.length) useDioramaStore.getState().setSectionsFolded(["Kits"], false);
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

/**
 * The category chips under the search box: one section of the library, or
 * all of them. `children` (Collapse all) wraps in after the last chip.
 */
function CategoryChips({ category, showGround, children }: { category: LibraryCategory; showGround: boolean; children?: ReactNode }) {
  const setCategory = useDioramaStore((s) => s.setLibraryCategory);
  const chips = showGround ? LIBRARY_CATEGORIES : LIBRARY_CATEGORIES.filter((c) => c !== "Ground");

  return (
    <div role="group" aria-label="Library categories" className="flex flex-wrap items-center gap-1">
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
      {children}
    </div>
  );
}

interface Section {
  id: LibrarySectionId;
  /** Items shown, and how many the section has without a search. */
  shown: number;
  total: number;
  actions?: ReactNode;
  body: ReactNode;
}

function CardGrid({ items }: { items: LibraryItem[] }) {
  return (
    // As many columns as the column's width holds (Stage 21 D5): two at the default width.
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
      {items.map((item) => (
        <LibraryCard key={item.key} item={item} />
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
 *
 * In the All view each section folds (plan/Stage-22-Implementation.md D1);
 * a search shows every matching section unfolded without changing the
 * stored folding (D2); Recent holds the items started last (D3).
 */
export function ObjectLibrary() {
  const userKits = useKitStore((s) => s.kits);
  const kits = useMemo(() => [...userKits, ...BUILT_IN_KITS], [userKits]);
  const [query, setQuery] = useState("");
  const [kitMessage, setKitMessage] = useState<string | null>(null);
  const isPlot = useDioramaStore((s) => s.environment.base === "plot");
  const chosen = useDioramaStore((s) => s.libraryCategory);
  const storedFolded = useDioramaStore((s) => s.foldedSections);
  const storedRecent = useDioramaStore((s) => s.recentLibraryKeys);
  const busy = useDioramaStore((s) => Boolean(s.placement || s.brush));
  // Recent keeps its order while a placement or brush runs, so the card just clicked stays
  // under the pointer and a second click on it still cancels (it moves to the front after).
  const [recentKeys, setRecentKeys] = useState(storedRecent);
  if (!busy && recentKeys !== storedRecent) setRecentKeys(storedRecent);
  const listRef = useRef<HTMLDivElement>(null);
  const stuckId = useStuckSection(listRef);
  // Folding during a search applies to that search only (D2).
  const [searchFolded, setSearchFolded] = useState<{ query: string; ids: LibrarySectionId[] }>({ query: "", ids: [] });
  const q = query.trim();
  // Ground materials exist only on a plot; elsewhere their chip is gone and the whole library shows.
  const category: LibraryCategory = chosen === "Ground" && !isPlot ? "all" : chosen;

  const totals = useMemo(() => new Map(getLibraryItems("", kits).map(({ title, items }) => [title, items.length])), [kits]);
  const groups = useMemo(
    () => getLibraryItems(query, kits).filter(({ title }) => category === "all" || title === category),
    [query, kits, category]
  );
  const groundKinds = useMemo(() => {
    const lower = q.toLowerCase();
    return SURFACE_KINDS.filter((kind) => {
      const { label, tags } = SURFACE_KIND_SPECS[kind];
      return !lower || label.toLowerCase().includes(lower) || tags.some((tag) => tag.includes(lower));
    });
  }, [q]);
  const recentItems = useMemo(
    () => recentKeys.map((key) => libraryItemByKey(key, kits)).filter((item): item is LibraryItem => Boolean(item)),
    [recentKeys, kits]
  );
  const showGround = isPlot && (category === "all" || category === "Ground") && groundKinds.length > 0;
  const where = category === "all" ? "" : ` in ${category}`;

  const sections: Section[] = [];
  if (category === "all" && !q && recentItems.length > 0) {
    sections.push({ id: "Recent", shown: recentItems.length, total: recentItems.length, body: <CardGrid items={recentItems} /> });
  }
  if (showGround) {
    sections.push({
      id: "Ground",
      shown: groundKinds.length,
      total: SURFACE_KINDS.length,
      body: (
        // As many columns as the column's width holds (Stage 21 D5): four at the default width.
        <div className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
          {groundKinds.map((kind) => (
            <GroundCard key={kind} kind={kind} />
          ))}
        </div>
      ),
    });
  }
  for (const { title, items } of groups) {
    const isKits = title === "Kits";
    sections.push({
      id: title as LibrarySectionId,
      shown: items.length,
      total: totals.get(title) ?? items.length,
      actions: isKits ? <KitImport onMessage={setKitMessage} /> : undefined,
      body: (
        <>
          {isKits && kitMessage && (
            <p role="alert" className="rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-600">
              {kitMessage}
            </p>
          )}
          <CardGrid items={items} />
        </>
      ),
    });
  }

  // A chip shows its section alone and unfolded; folding is the All view's.
  const foldable = category === "all";
  const folded = q ? (searchFolded.query === q ? searchFolded.ids : []) : storedFolded;
  const isOpen = (id: LibrarySectionId) => !foldable || !folded.includes(id);
  const toggle = (id: LibrarySectionId) => {
    if (!q) {
      useDioramaStore.getState().toggleSection(id);
      return;
    }
    const ids = folded.includes(id) ? folded.filter((section) => section !== id) : [...folded, id];
    setSearchFolded({ query: q, ids });
  };
  const anyOpen = sections.some(({ id }) => isOpen(id));
  const foldAll = () => {
    const ids = sections.map(({ id }) => id);
    if (q) setSearchFolded({ query: q, ids: anyOpen ? ids : [] });
    else useDioramaStore.getState().setSectionsFolded(ids, anyOpen);
  };

  return (
    <div className="flex flex-col gap-3">
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

      <CategoryChips category={category} showGround={isPlot}>
        {foldable && sections.length > 1 && (
          <button
            type="button"
            onClick={foldAll}
            className="ml-auto rounded-full px-1.5 py-px whitespace-nowrap text-[11px] font-medium text-[#4A3421]/55 transition-colors hover:bg-white hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
          >
            {anyOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </CategoryChips>

      {sections.length === 0 && (
        <p className="text-xs text-[#4A3421]/50">{q ? `Nothing${where} matches “${q}”.` : `Nothing${where} yet.`}</p>
      )}

      <div ref={listRef} className="flex flex-col">
        {sections.map(({ id, shown, total, actions, body }) => (
          <LibrarySection
            key={id}
            title={id}
            count={q ? `${shown} of ${total}` : `${total}`}
            open={isOpen(id)}
            stuck={stuckId === id}
            onToggle={foldable ? () => toggle(id) : undefined}
            actions={actions}
          >
            {body}
          </LibrarySection>
        ))}
      </div>
    </div>
  );
}
