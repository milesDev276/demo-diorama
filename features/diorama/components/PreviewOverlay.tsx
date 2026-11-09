"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";

/** How long the help line stays up unless the canvas is pressed first. */
const HELP_MS = 4000;
/** How long the focus marker shows, including its fade. */
const FOCUS_MARK_S = 1.8;

/**
 * What floats over Preview besides the photo bar: the way back to the
 * editor, a line of help when Preview opens, and the marker where a focus
 * click landed (plan/Stage-20-Implementation.md D2, D4). All of it is DOM
 * over the canvas, so none of it can end up in a saved photo. Each element
 * carries `data-preview-overlay`, which screenshot scripts hide.
 */
export function PreviewOverlay({ onExit }: { onExit: () => void }) {
  const focusPing = useDioramaStore((s) => s.focusPing);
  const [showHelp, setShowHelp] = useState(true);
  // Only clicks made in this Preview session are marked, not the last one of an earlier session.
  const [openedAt] = useState(() => performance.now());

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHelp(false), HELP_MS);
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof HTMLCanvasElement) setShowHelp(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const ping = focusPing && focusPing.at >= openedAt ? focusPing : null;

  return (
    <>
      <motion.button
        type="button"
        data-preview-overlay
        onClick={onExit}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="absolute left-5 top-5 z-20 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-medium text-[#4A3421] shadow-[0_8px_24px_rgba(139,111,82,0.2)] backdrop-blur-xl transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0B27A] cursor-pointer"
      >
        <ArrowLeft size={15} aria-hidden />
        Back to editor
      </motion.button>

      <div role="status" data-preview-overlay className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center px-40">
        <AnimatePresence>
          {showHelp && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-full bg-[#4A3421]/70 px-4 py-1.5 text-center text-xs font-medium text-white backdrop-blur"
            >
              Drag to turn · Scroll to zoom · Click to choose what stays sharp
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {ping && (
        <motion.span
          key={ping.at}
          aria-hidden
          data-preview-overlay
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [1.6, 1, 1, 1] }}
          transition={{ duration: FOCUS_MARK_S, times: [0, 0.12, 0.75, 1] }}
          className="pointer-events-none fixed z-20 -ml-4 -mt-4 h-8 w-8 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(74,52,33,0.45)]"
          style={{ left: ping.x, top: ping.y }}
        />
      )}
    </>
  );
}
