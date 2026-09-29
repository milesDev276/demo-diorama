"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trees,
  Eye,
  EyeOff,
  FilePlus,
  Upload,
  Download,
  RotateCcw,
  Loader2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useDioramaStore } from "../store/dioramaStore";
import type { SaveStatus } from "../types/diorama.types";

function SaveStatusLabel({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1">
        <Loader2 size={10} className="animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="flex items-center gap-1 text-[#F0B27A]">
        <Circle size={6} className="fill-current" />
        Unsaved changes
      </span>
    );
  }
  return <span>Saved</span>;
}

function ToolbarAction({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: typeof FilePlus;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex items-center gap-1.5 rounded-full border border-[#8b6f52]/20 bg-white/50 px-3 py-2 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white cursor-pointer"
    >
      <Icon size={15} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface EditorToolbarProps {
  isPreview: boolean;
  onTogglePreview: () => void;
  onRequestNewScene: () => void;
  onImportClick: () => void;
}

export function EditorToolbar({
  isPreview,
  onTogglePreview,
  onRequestNewScene,
  onImportClick,
}: EditorToolbarProps) {
  const sceneName = useDioramaStore((s) => s.sceneName);
  const setSceneName = useDioramaStore((s) => s.setSceneName);
  const objectCount = useDioramaStore((s) => s.objects.length);
  const saveStatus = useDioramaStore((s) => s.saveStatus);
  const resetScene = useDioramaStore((s) => s.resetScene);
  const exportScene = useDioramaStore((s) => s.exportScene);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(sceneName);

  const startEditing = () => {
    setDraftName(sceneName);
    setIsEditingName(true);
  };

  const commitName = () => {
    setIsEditingName(false);
    setSceneName(draftName.trim() || sceneName);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative z-20 mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#8b6f52]/15 bg-white/70 px-4 py-3 shadow-[0_8px_32px_rgba(139,111,82,0.12)] backdrop-blur-xl sm:mx-6 sm:mt-6 sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A7C4A0]/40 text-[#4A3421]">
          <Trees size={17} />
        </span>
        <div className="min-w-0 leading-tight">
          {isEditingName ? (
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setDraftName(sceneName);
                  setIsEditingName(false);
                }
              }}
              maxLength={80}
              className="w-44 rounded-md border border-[#F0B27A]/50 bg-white px-1.5 py-0.5 text-sm font-semibold text-[#4A3421] outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              title="Rename scene"
              className="max-w-56 truncate text-left font-semibold text-[#4A3421] transition-colors hover:text-[#8B6F52] cursor-text"
            >
              {sceneName}
            </button>
          )}
          <div className={cn("flex items-center gap-1.5 text-xs text-[#4A3421]/50")}>
            <span>
              {objectCount} {objectCount === 1 ? "object" : "objects"}
            </span>
            <span aria-hidden>·</span>
            <SaveStatusLabel status={saveStatus} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isPreview && (
          <>
            <ToolbarAction onClick={onRequestNewScene} icon={FilePlus} label="New" />
            <ToolbarAction onClick={onImportClick} icon={Upload} label="Import" />
            <ToolbarAction onClick={exportScene} icon={Download} label="Export" />
            <ToolbarAction onClick={resetScene} icon={RotateCcw} label="Reset" />
          </>
        )}
        <button
          type="button"
          onClick={onTogglePreview}
          className="flex items-center gap-1.5 rounded-full bg-[#F0B27A] px-3.5 py-2 text-sm font-medium text-[#4A3421] shadow-[0_4px_16px_rgba(240,178,122,0.4)] transition-colors hover:bg-[#eda868] cursor-pointer"
        >
          {isPreview ? <EyeOff size={15} /> : <Eye size={15} />}
          <span className="hidden sm:inline">{isPreview ? "Exit Preview" : "Preview"}</span>
        </button>
      </div>
    </motion.header>
  );
}
