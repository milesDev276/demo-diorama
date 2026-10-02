"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SCENE_TEMPLATES } from "../assets/sceneTemplates";
import type { DioramaBase } from "../types/diorama.types";
import { BASE_ORDER, BASE_TEMPLATES } from "../utils/baseTemplates";
import { DIORAMA_COLORS } from "../utils/palette";

/** A tiny top-down plan of each base: lot, sidewalk and road. */
function BasePlan({ base }: { base: DioramaBase }) {
  const { lotGravel, sidewalkConcrete, asphalt } = DIORAMA_COLORS;
  return (
    <svg viewBox="0 0 64 40" className="h-14 w-full" aria-hidden>
      {base === "street" ? (
        <g>
          <rect x="2" y="8" width="60" height="24" rx="2" fill={lotGravel} />
          <rect x="2" y="22" width="60" height="3" fill={sidewalkConcrete} />
          <rect x="2" y="25" width="60" height="7" fill={asphalt} />
        </g>
      ) : (
        <g>
          <rect x="14" y="2" width="36" height="36" rx="2" fill={asphalt} />
          <rect x="14" y="2" width="26" height="26" fill={sidewalkConcrete} />
          <rect x="14" y="2" width="23" height="23" fill={lotGravel} />
        </g>
      )}
    </svg>
  );
}

interface NewSceneDialogProps {
  open: boolean;
  /** Adds a warning that the current, unsaved Diorama will be discarded. */
  hasUnsavedChanges: boolean;
  onCreate: (base: DioramaBase) => void;
  onCreateFromTemplate: (templateId: string) => void;
  onCancel: () => void;
}

const CARD =
  "rounded-2xl border border-[#8b6f52]/15 bg-white/60 p-3 text-left transition-colors hover:border-[#F0B27A] hover:bg-white focus-visible:border-[#F0B27A] focus-visible:outline-none cursor-pointer";

/** "New Diorama": start from a built-in scene, or pick an empty base to build on. Choosing a card creates the scene. */
export function NewSceneDialog({ open, hasUnsavedChanges, onCreate, onCreateFromTemplate, onCancel }: NewSceneDialogProps) {
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-scene-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#8b6f52]/15 bg-[#FDF6EC] p-5 shadow-[0_16px_48px_rgba(74,52,33,0.25)]"
          >
            <h3 id="new-scene-title" className="text-sm font-semibold text-[#4A3421]">
              New Diorama
            </h3>
            <p className="mt-1 text-sm text-[#4A3421]/60">Start from a finished scene, or choose an empty base.</p>

            <div className="mt-4 flex flex-col gap-3">
              {SCENE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onCreateFromTemplate(template.id)}
                  className={`flex items-center gap-3 ${CARD}`}
                >
                  <Image
                    src={template.thumbnail}
                    alt=""
                    width={320}
                    height={200}
                    unoptimized
                    className="h-20 w-32 shrink-0 rounded-xl object-cover"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#4A3421]">{template.name}</span>
                    <span className="text-xs text-[#4A3421]/55">{template.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {BASE_ORDER.map((base) => (
                <button
                  key={base}
                  type="button"
                  onClick={() => onCreate(base)}
                  className={`flex flex-col gap-2 ${CARD}`}
                >
                  <BasePlan base={base} />
                  <span className="text-sm font-semibold text-[#4A3421]">Empty {BASE_TEMPLATES[base].label.toLowerCase()}</span>
                  <span className="text-xs text-[#4A3421]/55">{BASE_TEMPLATES[base].description}</span>
                </button>
              ))}
            </div>

            {hasUnsavedChanges && (
              <p className="mt-4 rounded-xl bg-red-400/10 px-3 py-2 text-xs text-red-600">
                You have unsaved changes. Starting a new Diorama will discard them.
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#4A3421]/70 transition-colors hover:bg-[#4A3421]/5 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
