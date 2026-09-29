"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MousePointerClick, Copy, Eye, EyeOff, Lock, Unlock, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDioramaStore } from "../store/dioramaStore";
import type { Vector3Tuple } from "../types/diorama.types";

const AXES: { key: 0 | 1 | 2; label: string }[] = [
  { key: 0, label: "X" },
  { key: 1, label: "Y" },
  { key: 2, label: "Z" },
];

const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
const degToRad = (deg: number) => (deg * Math.PI) / 180;

interface NumberFieldProps {
  label: string;
  value: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onCommit: () => void;
}

function NumberField({ label, value, step = 0.1, disabled, onChange, onCommit }: NumberFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#4A3421]">
      <span className="w-4 text-xs font-semibold text-[#4A3421]/50">{label}</span>
      <input
        type="number"
        step={step}
        disabled={disabled}
        value={Number.isFinite(value) ? Number(value.toFixed(2)) : 0}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={cn(
          "w-full rounded-lg border border-[#8b6f52]/15 bg-white/60 px-2.5 py-1.5 text-[#4A3421] outline-none transition-colors focus:border-[#F0B27A] focus:bg-white",
          disabled && "cursor-not-allowed opacity-50"
        )}
      />
    </label>
  );
}

/**
 * Right panel: reflects the current selection and edits it through the
 * store only — never touches meshes directly. Handles single-object detail
 * editing and a lighter multi-object summary.
 */
export function PropertiesPanel() {
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const objects = useDioramaStore((s) => s.objects);
  const updateObject = useDioramaStore((s) => s.updateObject);
  const commitTransform = useDioramaStore((s) => s.commitTransform);
  const removeObject = useDioramaStore((s) => s.removeObject);
  const removeObjects = useDioramaStore((s) => s.removeObjects);
  const duplicateObject = useDioramaStore((s) => s.duplicateObject);
  const duplicateObjects = useDioramaStore((s) => s.duplicateObjects);
  const setObjectVisibility = useDioramaStore((s) => s.setObjectVisibility);
  const setObjectLocked = useDioramaStore((s) => s.setObjectLocked);
  const clearSelection = useDioramaStore((s) => s.clearSelection);

  const selectedObjects = objects.filter((o) => selectedObjectIds.includes(o.id));
  const object = selectedObjects.length === 1 ? selectedObjects[0] : null;

  const setAxis = (key: "position" | "rotation" | "scale", axis: 0 | 1 | 2, value: number) => {
    if (!object) return;
    const next = [...object[key]] as Vector3Tuple;
    next[axis] = value;
    updateObject(object.id, { [key]: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
      className="flex h-full w-full flex-col gap-5 overflow-y-auto rounded-3xl border border-[#8b6f52]/15 bg-white/70 p-4 shadow-[0_8px_32px_rgba(139,111,82,0.12)] backdrop-blur-xl"
    >
      <div>
        <h2 className="text-sm font-semibold text-[#4A3421]">Properties</h2>
        <p className="text-xs text-[#4A3421]/50">Edit the selected object</p>
      </div>

      <AnimatePresence mode="wait">
        {selectedObjects.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-[#4A3421]/45"
          >
            <MousePointerClick size={22} />
            <p className="text-sm font-medium">No object selected</p>
            <p className="text-xs">Select an object to edit its properties.</p>
          </motion.div>
        ) : object ? (
          <motion.div
            key={object.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#A7C4A0]/25 px-2.5 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-[#4A3421]">
              {object.locked && <Lock size={11} />}
              {object.type}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">
                Position
              </p>
              <div className="flex flex-col gap-1.5">
                {AXES.map(({ key, label }) => (
                  <NumberField
                    key={label}
                    label={label}
                    value={object.position[key]}
                    disabled={object.locked}
                    onChange={(value) => setAxis("position", key, value)}
                    onCommit={commitTransform}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">
                Rotation
              </p>
              <NumberField
                label="Y°"
                step={5}
                value={radToDeg(object.rotation[1])}
                disabled={object.locked}
                onChange={(value) => setAxis("rotation", 1, degToRad(value))}
                onCommit={commitTransform}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">
                Scale
              </p>
              <NumberField
                label="S"
                step={0.05}
                value={object.scale[0]}
                disabled={object.locked}
                onChange={(value) => updateObject(object.id, { scale: [value, value, value] })}
                onCommit={commitTransform}
              />
            </div>

            <div className="flex flex-col gap-1.5 border-t border-[#8b6f52]/10 pt-4">
              <button
                type="button"
                onClick={() => setObjectVisibility(object.id, !object.visible)}
                className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {object.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  {object.visible ? "Visible" : "Hidden"}
                </span>
                <span className="text-xs text-[#4A3421]/40">Toggle</span>
              </button>
              <button
                type="button"
                onClick={() => setObjectLocked(object.id, !object.locked)}
                className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {object.locked ? <Lock size={15} /> : <Unlock size={15} />}
                  {object.locked ? "Locked" : "Unlocked"}
                </span>
                <span className="text-xs text-[#4A3421]/40">Toggle</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => duplicateObject(object.id)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#8b6f52]/15 bg-white/50 px-3 py-2.5 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white cursor-pointer"
              >
                <Copy size={15} />
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => removeObject(object.id)}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-400/20 cursor-pointer"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="multi"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <p className="rounded-lg bg-[#A7C4A0]/25 px-2.5 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-[#4A3421]">
              {selectedObjects.length} Objects Selected
            </p>
            <p className="text-xs text-[#4A3421]/50">
              Drag any of the selected objects in the scene to move the whole group. Rotate and
              scale apply to a single object at a time — narrow your selection to use them.
            </p>

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => duplicateObjects(selectedObjectIds)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#8b6f52]/15 bg-white/50 px-3 py-2.5 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white cursor-pointer"
              >
                <Copy size={15} />
                Duplicate All
              </button>
              <button
                type="button"
                onClick={() => removeObjects(selectedObjectIds)}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-400/20 cursor-pointer"
              >
                <Trash2 size={15} />
                Delete All
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4A3421]/60 transition-colors hover:bg-white/50 cursor-pointer"
              >
                <X size={15} />
                Clear Selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
