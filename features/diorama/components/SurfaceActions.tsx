"use client";

import { MousePointerClick, Unlink } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import type { DioramaObject } from "../types/diorama.types";
import { ASSET_REGISTRY } from "../assets/assetRegistry";

const BUTTON_CLASS =
  "flex items-center justify-center gap-2 rounded-xl border border-[#8b6f52]/15 bg-white/50 px-3 py-2.5 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

/**
 * Inspector actions about where an object sits: put it on another surface
 * (which attaches it to a building, or frees it on the ground), or detach
 * it from its building without moving it.
 */
export function SurfaceActions({ object }: { object: DioramaObject }) {
  const parentType = useDioramaStore((s) => s.objects.find((o) => o.id === object.parentId)?.type);
  const isMoving = useDioramaStore((s) => s.placement?.movingId === object.id);
  const startPlacement = useDioramaStore((s) => s.startPlacement);
  const cancelPlacement = useDioramaStore((s) => s.cancelPlacement);
  const detachObject = useDioramaStore((s) => s.detachObject);

  return (
    <div className="flex flex-col gap-1.5 border-t border-[#8b6f52]/10 pt-4">
      {parentType && (
        <p className="text-xs text-[#4A3421]/50">
          Attached to a {ASSET_REGISTRY[parentType].label.toLowerCase()}: it moves with it, and its position is
          measured from the building.
        </p>
      )}
      <button
        type="button"
        disabled={object.locked}
        aria-pressed={isMoving}
        onClick={() =>
          isMoving
            ? cancelPlacement()
            : startPlacement({ type: object.type, params: object.params, movingId: object.id })
        }
        className={BUTTON_CLASS}
      >
        <MousePointerClick size={15} />
        {isMoving ? "Click a surface… (cancel)" : "Move to a surface"}
      </button>
      {parentType && (
        <button type="button" disabled={object.locked} onClick={() => detachObject(object.id)} className={BUTTON_CLASS}>
          <Unlink size={15} />
          Detach
        </button>
      )}
    </div>
  );
}
