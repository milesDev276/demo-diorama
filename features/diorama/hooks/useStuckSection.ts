import { useEffect, useState, type RefObject } from "react";

/** The nearest ancestor that scrolls vertically. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY;
    if (overflow === "auto" || overflow === "scroll") return parent;
  }
  return null;
}

/**
 * The library section whose header is pinned to the top of the scroll area
 * with its cards running on under it (plan/Stage-22-Implementation.md D4), or
 * null. Sections are the `section[data-open]` elements under `rootRef`, named
 * by `data-section`. One scroll listener and one ResizeObserver serve the
 * whole list, so folding, a search or a panel resize updates it without a
 * scroll.
 */
export function useStuckSection(rootRef: RefObject<HTMLElement | null>): string | null {
  const [stuckId, setStuckId] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const scroller = root && scrollParent(root);
    if (!root || !scroller) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = scroller.getBoundingClientRect().top;
      let found: string | null = null;
      for (const section of root.querySelectorAll<HTMLElement>("section[data-open]")) {
        const box = section.getBoundingClientRect();
        // Begun above the top edge and not yet scrolled past it: its header is pinned there.
        if (box.top < top - 0.5 && box.bottom > top + 0.5) {
          found = section.dataset.section ?? null;
          break;
        }
      }
      setStuckId(found);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    scroller.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    return () => {
      scroller.removeEventListener("scroll", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [rootRef]);

  return stuckId;
}
