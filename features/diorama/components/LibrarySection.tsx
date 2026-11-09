"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

interface LibrarySectionProps {
  title: string;
  /** "17", or "3 of 17" while searching. */
  count: string;
  /** Unfolded. */
  open: boolean;
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
export function LibrarySection({ title, count, open, onToggle, actions, children }: LibrarySectionProps) {
  const bodyId = useId();
  const reduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLDivElement>(null);
  const stuck = useStuck(headerRef, open);
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
    <section aria-label={title} className="flex flex-col">
      {/*
        Sticks to the scroll area's top edge: -top-3 cancels the panel body's pt-3. Only
        while it is stuck does it get a frosted strip to hide the cards scrolling under it:
        the panel's own translucent white shades with the page behind, so a strip at rest
        would show as a band.
      */}
      <div
        ref={headerRef}
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
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-2 pb-3 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * Whether the header is stuck to the top of its scroll area with its
 * section's content scrolling under it. Followed on scroll only while the
 * section is open (a folded section has nothing to scroll under it).
 */
function useStuck(ref: RefObject<HTMLDivElement | null>, open: boolean): boolean {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const header = ref.current;
    const scroller = header?.closest<HTMLElement>(".overflow-y-auto");
    if (!header || !scroller || !open) {
      setStuck(false);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = header.parentElement!;
      const top = scroller.getBoundingClientRect().top;
      const box = header.getBoundingClientRect();
      // Pinned at the top while its section runs on under it (a section scrolled past entirely takes its header along).
      setStuck(section.getBoundingClientRect().top < top - 0.5 && box.top <= top + 0.5 && box.bottom > top + 0.5);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ref, open]);

  return stuck;
}
