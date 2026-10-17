"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface DeleteDioramaDialogProps {
  /** The diorama to delete; the dialog is closed while this is null. */
  name: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks before a diorama is deleted. Deleting is permanent, and the dialog says so. */
export function DeleteDioramaDialog({ name, onConfirm, onCancel }: DeleteDioramaDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const open = name !== null;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1d12]/30 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-diorama-title"
            aria-describedby="delete-diorama-body"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-[#8b6f52]/15 bg-[#FDF6EC] p-5 shadow-[0_16px_48px_rgba(74,52,33,0.25)]"
          >
            <h2 id="delete-diorama-title" className="text-sm font-semibold text-[#4A3421]">
              Delete “{name}”?
            </h2>
            <p id="delete-diorama-body" className="mt-1 text-sm text-[#4A3421]/60">
              This can&apos;t be undone. Export it first if you may want it back.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#4A3421]/70 transition-colors hover:bg-[#4A3421]/5 focus-visible:outline-2 focus-visible:outline-[#8B6F52] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
