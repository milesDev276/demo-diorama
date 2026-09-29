"use client";

import { motion } from "framer-motion";
import { Undo2, Redo2, Move, RotateCw, Maximize2, Magnet, Grid3x3, Camera as CameraIcon, Crosshair } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDioramaStore } from "../store/dioramaStore";
import type { CameraPreset, TransformMode } from "../types/diorama.types";
import { CAMERA_PRESET_ORDER, CAMERA_PRESETS } from "../utils/cameraPresets";

const MODES: { mode: TransformMode; label: string; icon: typeof Move }[] = [
  { mode: "translate", label: "Move", icon: Move },
  { mode: "rotate", label: "Rotate", icon: RotateCw },
  { mode: "scale", label: "Scale", icon: Maximize2 },
];

const GRID_SIZES = [0.25, 0.5, 1];
const ROTATION_SNAPS = [15, 30, 45, 90];

function ToolbarChip({
  active,
  onClick,
  icon: Icon,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Move;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
        active ? "bg-[#F0B27A] text-[#4A3421]" : "text-[#4A3421]/60 hover:bg-white/60"
      )}
    >
      <Icon size={14} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

/** Second toolbar row: undo/redo, transform mode, snapping, and camera presets. Hidden in Preview. */
export function EditorSubToolbar() {
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const transformMode = useDioramaStore((s) => s.transformMode);
  const setTransformMode = useDioramaStore((s) => s.setTransformMode);
  const historyIndex = useDioramaStore((s) => s.historyIndex);
  const historyLength = useDioramaStore((s) => s.history.length);
  const undo = useDioramaStore((s) => s.undo);
  const redo = useDioramaStore((s) => s.redo);
  const snapEnabled = useDioramaStore((s) => s.snapEnabled);
  const setSnapEnabled = useDioramaStore((s) => s.setSnapEnabled);
  const gridSize = useDioramaStore((s) => s.gridSize);
  const setGridSize = useDioramaStore((s) => s.setGridSize);
  const rotationSnapEnabled = useDioramaStore((s) => s.rotationSnapEnabled);
  const setRotationSnapEnabled = useDioramaStore((s) => s.setRotationSnapEnabled);
  const rotationSnapDegrees = useDioramaStore((s) => s.rotationSnapDegrees);
  const setRotationSnapDegrees = useDioramaStore((s) => s.setRotationSnapDegrees);
  const cameraApi = useDioramaStore((s) => s.cameraApi);

  const isMultiSelect = selectedObjectIds.length > 1;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
      className="relative z-10 mx-3 mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-[#8b6f52]/10 bg-white/50 px-3 py-2 backdrop-blur-xl sm:mx-6"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="rounded-full p-1.5 text-[#4A3421]/60 transition-colors hover:bg-white/70 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="rounded-full p-1.5 text-[#4A3421]/60 transition-colors hover:bg-white/70 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
        >
          <Redo2 size={15} />
        </button>
      </div>

      <div className="h-4 w-px bg-[#8b6f52]/15" />

      <div className="flex items-center gap-1 rounded-full bg-[#4A3421]/5 p-1">
        {MODES.map(({ mode, label, icon }) => (
          <ToolbarChip
            key={mode}
            active={transformMode === mode}
            onClick={() => setTransformMode(mode)}
            icon={icon}
            label={label}
            title={mode === "rotate" ? "Rotate (E)" : mode === "scale" ? "Scale (R)" : "Move (W)"}
          />
        ))}
      </div>
      {isMultiSelect && (
        <span className="text-[11px] text-[#4A3421]/40">Rotate/Scale need a single object</span>
      )}

      <div className="h-4 w-px bg-[#8b6f52]/15" />

      <div className="flex items-center gap-1.5">
        <ToolbarChip
          active={snapEnabled}
          onClick={() => setSnapEnabled(!snapEnabled)}
          icon={Grid3x3}
          label="Grid Snap"
        />
        <select
          value={gridSize}
          onChange={(event) => setGridSize(Number(event.target.value))}
          className="rounded-full border border-[#8b6f52]/15 bg-white/60 px-2 py-1 text-xs text-[#4A3421] outline-none"
        >
          {GRID_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <ToolbarChip
          active={rotationSnapEnabled}
          onClick={() => setRotationSnapEnabled(!rotationSnapEnabled)}
          icon={Magnet}
          label="Rotate Snap"
        />
        <select
          value={rotationSnapDegrees}
          onChange={(event) => setRotationSnapDegrees(Number(event.target.value))}
          className="rounded-full border border-[#8b6f52]/15 bg-white/60 px-2 py-1 text-xs text-[#4A3421] outline-none"
        >
          {ROTATION_SNAPS.map((deg) => (
            <option key={deg} value={deg}>
              {deg}°
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <CameraIcon size={13} className="text-[#4A3421]/40" />
        {CAMERA_PRESET_ORDER.map((preset: CameraPreset) => (
          <button
            key={preset}
            type="button"
            onClick={() => cameraApi?.setPreset(preset)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#4A3421]/60 transition-colors hover:bg-white/70 cursor-pointer"
          >
            {CAMERA_PRESETS[preset].label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => cameraApi?.resetCamera()}
          title="Reset camera"
          className="rounded-full p-1.5 text-[#4A3421]/60 transition-colors hover:bg-white/70 cursor-pointer"
        >
          <Crosshair size={14} />
        </button>
      </div>
    </motion.div>
  );
}
