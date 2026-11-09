"use client";

import { useId, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SidePanelTab<T extends string> {
  id: T;
  label: string;
  /** Stands for the tab on the folded rail. */
  icon: LucideIcon;
  /** A number shown beside the label, such as the object count. */
  count?: number;
  /** Marks the tab's rail icon: there is something to look at (the selection, on the folded inspector). */
  dot?: boolean;
}

interface EditorSidePanelProps<T extends string> {
  /** Names the tab bar for assistive technology. */
  label: string;
  side: "left" | "right";
  tabs: SidePanelTab<T>[];
  value: T;
  onChange: (tab: T) => void;
  /**
   * One body per tab. Every tab panel stays mounted (hidden when not open), so a body that is
   * always passed keeps its search or scroll position across a tab switch; pass `false` for a
   * body that should not render while hidden.
   */
  panels: Record<T, React.ReactNode>;
  /** A line under the tab bar naming what the open tab shows. */
  heading?: React.ReactNode;
  /** What the fold button calls the column: "library", "inspector". */
  name: string;
  /** Folded into a rail of tab icons (plan/Stage-21-Implementation.md D4). */
  folded: boolean;
  onFoldedChange: (folded: boolean) => void;
}

/**
 * A column of the editor: a card with a tab bar and one scrolling body per
 * tab. The arrow keys, Home and End move between the tabs. Folded, the card
 * is a rail with one icon per tab; an icon unfolds the column on its tab.
 */
export function EditorSidePanel<T extends string>({
  label,
  side,
  tabs,
  value,
  onChange,
  panels,
  heading,
  name,
  folded,
  onFoldedChange,
}: EditorSidePanelProps<T>) {
  const baseId = useId();
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());

  const focusTab = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    onChange(tab.id);
    tabRefs.current.get(tab.id)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const index = tabs.findIndex((tab) => tab.id === value);
    if (event.key === "ArrowRight") focusTab(index + 1);
    else if (event.key === "ArrowLeft") focusTab(index - 1);
    else if (event.key === "Home") focusTab(0);
    else if (event.key === "End") focusTab(tabs.length - 1);
    else return;
    event.preventDefault();
  };

  // The chevrons point toward the window's edge to fold, away from it to unfold.
  const FoldIcon = side === "left" ? ChevronsLeft : ChevronsRight;
  const UnfoldIcon = side === "left" ? ChevronsRight : ChevronsLeft;
  const foldButton = (
    <button
      type="button"
      onClick={() => onFoldedChange(true)}
      aria-label={`Hide ${name}`}
      title={`Hide ${name} (\\ hides both panels)`}
      className="flex shrink-0 items-center justify-center rounded-xl px-1.5 text-[#4A3421]/45 transition-colors hover:bg-white/70 hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
    >
      <FoldIcon size={16} aria-hidden />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: side === "left" ? 0.1 : 0.15 }}
      className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[#8b6f52]/15 bg-white/70 shadow-[0_8px_32px_rgba(139,111,82,0.12)] backdrop-blur-xl"
    >
      {folded && (
        <nav aria-label={label} className="flex flex-col items-center gap-1 py-3">
          <button
            type="button"
            onClick={() => onFoldedChange(false)}
            aria-label={`Show ${name}`}
            title={`Show ${name}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4A3421]/50 transition-colors hover:bg-white hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
          >
            <UnfoldIcon size={16} aria-hidden />
          </button>
          <span aria-hidden className="my-1 h-px w-6 bg-[#4A3421]/10" />
          {tabs.map(({ id, label: tabLabel, icon: Icon, count, dot }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(id);
                onFoldedChange(false);
              }}
              aria-label={count !== undefined ? `${tabLabel} (${count})` : tabLabel}
              title={tabLabel}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#4A3421]/60 transition-colors hover:bg-white hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
            >
              <Icon size={17} aria-hidden />
              {count !== undefined && (
                <span className="absolute -right-1 -top-0.5 min-w-4 rounded-full bg-[#EAD9C2] px-1 text-center text-[10px] font-medium leading-4 tabular-nums text-[#4A3421]/75">
                  {count > 99 ? "99+" : count}
                </span>
              )}
              {dot && <span aria-hidden className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#F0B27A] ring-2 ring-white" />}
            </button>
          ))}
        </nav>
      )}

      {/* Folded, the column's bodies stay mounted (hidden), so the library keeps its search and scroll. */}
      <div hidden={folded} className="flex min-h-0 flex-1 flex-col">
        <div className="m-3 mb-0 flex shrink-0 gap-1">
          {side === "left" && foldButton}
          <div role="tablist" aria-label={label} onKeyDown={handleKeyDown} className="flex min-w-0 flex-1 gap-1 rounded-2xl bg-[#4A3421]/5 p-1">
            {tabs.map((tab) => {
              const selected = tab.id === value;
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    if (node) tabRefs.current.set(tab.id, node);
                    else tabRefs.current.delete(tab.id);
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onChange(tab.id)}
                  className={cn(
                    "flex min-w-0 grow basis-auto items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer",
                    selected ? "bg-white text-[#4A3421] shadow-sm" : "text-[#4A3421]/55 hover:text-[#4A3421]"
                  )}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="rounded-full bg-[#4A3421]/8 px-1.5 text-[11px] font-medium tabular-nums text-[#4A3421]/60">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
          {side === "right" && foldButton}
        </div>

        {heading && <div className="mx-4 mt-3 shrink-0">{heading}</div>}

        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            hidden={tab.id !== value}
            className="min-h-0 flex-1 overflow-y-auto p-4 pt-3"
          >
            {panels[tab.id]}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
