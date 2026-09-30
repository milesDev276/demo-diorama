"use client";

import { Eye, EyeOff, Lock, Unlock, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDioramaStore } from "../store/dioramaStore";
import { ASSET_REGISTRY } from "../assets/assetRegistry";

/**
 * The scene object list: every object in the Diorama, selectable, with
 * inline visibility/lock/delete controls. Click a row to select it,
 * shift-click to add/remove it from the current selection.
 */
export function ObjectList() {
  const objects = useDioramaStore((s) => s.objects);
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const selectObject = useDioramaStore((s) => s.selectObject);
  const toggleObjectSelection = useDioramaStore((s) => s.toggleObjectSelection);
  const setObjectVisibility = useDioramaStore((s) => s.setObjectVisibility);
  const setObjectLocked = useDioramaStore((s) => s.setObjectLocked);
  const removeObject = useDioramaStore((s) => s.removeObject);

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden rounded-3xl border border-[#8b6f52]/15 bg-white/70 p-4 shadow-[0_8px_32px_rgba(139,111,82,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#4A3421]">Scene</h2>
        <span className="rounded-full bg-[#4A3421]/5 px-2 py-0.5 text-[11px] font-medium text-[#4A3421]/50">
          {objects.length} {objects.length === 1 ? "object" : "objects"}
        </span>
      </div>

      {objects.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#4A3421]/40">No objects yet.</p>
      ) : (
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {objects.map((object) => {
            const Icon = ASSET_REGISTRY[object.type].icon;
            const isSelected = selectedObjectIds.includes(object.id);
            return (
              <div
                key={object.id}
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  if (event.shiftKey) toggleObjectSelection(object.id);
                  else selectObject(object.id);
                }}
                className={cn(
                  "group flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm transition-colors cursor-pointer",
                  isSelected ? "bg-[#F0B27A]/25 text-[#4A3421]" : "text-[#4A3421]/80 hover:bg-white/60"
                )}
              >
                <Icon size={14} className={cn("shrink-0", !object.visible && "opacity-40")} />
                <span className={cn("flex-1 truncate", !object.visible && "italic opacity-50")}>
                  {ASSET_REGISTRY[object.type].label}
                </span>
                {object.locked && <Lock size={11} className="shrink-0 text-[#4A3421]/40" />}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setObjectVisibility(object.id, !object.visible);
                  }}
                  className="shrink-0 rounded-md p-1 text-[#4A3421]/50 transition-colors hover:bg-white hover:text-[#4A3421] cursor-pointer"
                  aria-label={object.visible ? "Hide object" : "Show object"}
                >
                  {object.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setObjectLocked(object.id, !object.locked);
                  }}
                  className="shrink-0 rounded-md p-1 text-[#4A3421]/50 opacity-0 transition-opacity hover:bg-white hover:text-[#4A3421] group-hover:opacity-100 cursor-pointer"
                  aria-label={object.locked ? "Unlock object" : "Lock object"}
                >
                  {object.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeObject(object.id);
                  }}
                  className="shrink-0 rounded-md p-1 text-red-400 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 cursor-pointer"
                  aria-label="Delete object"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
