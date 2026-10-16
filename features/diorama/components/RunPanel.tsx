"use client";

import { useDioramaStore } from "../store/dioramaStore";
import type { DioramaObject } from "../types/diorama.types";
import { ASSET_REGISTRY } from "../assets/assetRegistry";
import { runPiecesOf } from "../utils/objectParams";
import { isRunType, MAX_RUN_PIECES } from "../utils/runParams";
import { Stepper } from "./Stepper";

/** Inspector section for a wall, fence, rail or hedge: how many pieces long it is. One undo step per click. */
export function RunPanel({ object }: { object: DioramaObject }) {
  const setRunPieces = useDioramaStore((s) => s.setRunPieces);
  const tile = ASSET_REGISTRY[object.type].tile;
  if (!tile || !isRunType(object.type)) return null;
  const pieces = runPiecesOf(object);

  return (
    <div className="flex flex-col gap-2 border-t border-[#8b6f52]/10 pt-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">Length</p>
        <p className="text-[11px] tabular-nums text-[#4A3421]/40">{(pieces * tile * object.scale[0]).toFixed(1)} m</p>
      </div>
      <Stepper
        label="Pieces"
        value={pieces}
        min={1}
        max={MAX_RUN_PIECES}
        disabled={object.locked}
        onStep={(step) => setRunPieces(object.id, runPiecesOf(useDioramaStore.getState().objects.find((o) => o.id === object.id) ?? object) + step)}
      />
      <p className="text-[11px] text-[#4A3421]/45">The left end stays where it is.</p>
    </div>
  );
}
