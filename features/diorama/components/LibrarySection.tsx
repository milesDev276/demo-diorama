"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

interface LibrarySectionProps {
  title: string;
  /** "17", or "3 of 17" while searching. */
  count: string;
  /** Unfolded. */
  open: boolean;
  /** Its header is pinned to the top with the cards scrolling under it (useStuckSection). */
  stuck: boolean;
  /** Undefined: the section cannot fold (a category chip shows it alone). */
  onToggle?: () => void;
  /** Controls at the header's right end, outside the toggle (Kits' Import). */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * One section of the library (plan/Stage-22-Implementation.md D1, D4): a
 * header that folds and unfolds it and sticks to the top of the panel's
 * scroll area while the section's cards scroll past.
 */
export function LibrarySection({ title, count, open, stuck, onToggle, actions, children }: LibrarySectionProps) {
  const bodyId = useId();
  const reduceMotion = useReducedMotion();
  // No height animation in the first frame: the stored folding is applied right after the
  // library first renders, and a section remembered open must not slide open on every visit.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const label = (
    <>
      {onToggle && (
        <ChevronRight
          size={14}
          aria-hidden
          className={cn("shrink-0 text-[#4A3421]/45 transition-transform duration-150", open && "rotate-90")}
        />
      )}
      <span className="truncate">{title}</span>
      <span className="ml-auto shrink-0 pl-2 text-[11px] font-medium tabular-nums text-[#4A3421]/45">{count}</span>
    </>
  );
  const labelClass = "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-[#4A3421]";

  return (
    <section aria-label={title} data-section={title} data-open={open || undefined} className="flex flex-col">
      {/*
        Sticks to the scroll area's top edge: -top-3 and -mx-4 cancel the panel body's
        padding (EditorSidePanel's tab panels, p-4 pt-3; change them together). Only
        while it is stuck does it get a frosted strip to hide the cards scrolling under it:
        the panel's own translucent white shades with the page behind, so a strip at rest
        would show as a band.
      */}
      <div
        className={cn(
          "sticky -top-3 z-10 -mx-4 flex items-center gap-1 px-4",
          stuck && "bg-[#FAF6F1]/90 shadow-[0_1px_0_rgba(139,111,82,0.12)] backdrop-blur-md"
        )}
      >
        {onToggle ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={onToggle}
            title={open ? `Fold ${title}` : `Unfold ${title}`}
            className={cn(labelClass, "-mx-1 px-1 transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer")}
          >
            {label}
          </button>
        ) : (
          <h3 className={labelClass}>{label}</h3>
        )}
        {actions}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            key="body"
            // Clipped only while the height moves, so a hovered card's scale-up is not cut at the edges.
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: reduceMotion || !settled ? 0 : 0.15, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-2 pb-3 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
