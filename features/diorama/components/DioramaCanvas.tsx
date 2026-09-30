"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrthographicCamera } from "@react-three/drei";
import { Trees } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { Ground } from "./Ground";
import { SceneLighting } from "./SceneLighting";
import { DioramaObject } from "./DioramaObject";
import { CameraControls } from "./CameraControls";
import { HeroBlockout } from "./dev/HeroBlockout";
import { STREET_PLOT } from "../utils/worldScale";

/** `/diorama?dev=blockout` swaps the scene for the hero blockout (dev reference only). */
function isBlockoutView(): boolean {
  return new URLSearchParams(window.location.search).get("dev") === "blockout";
}

/**
 * Owns the R3F Canvas: camera, controls, lighting, ground, grid, and every
 * object rendered from the Zustand store. Clicking empty space deselects.
 */
export function DioramaCanvas() {
  const objects = useDioramaStore((s) => s.objects);
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const gridSize = useDioramaStore((s) => s.gridSize);
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  const clearSelection = useDioramaStore((s) => s.clearSelection);
  const [showBlockout] = useState(isBlockoutView);

  // The gizmo attaches to the sole selection, or — in a multi-selection — the
  // most-recently-selected object that isn't locked (locked objects can't drag the group).
  const gizmoOwnerId = useMemo(() => {
    for (let i = selectedObjectIds.length - 1; i >= 0; i--) {
      const id = selectedObjectIds[i];
      const object = objects.find((o) => o.id === id);
      if (object && !object.locked) return id;
    }
    return null;
  }, [selectedObjectIds, objects]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-[#bfe3ff] via-[#e3f0dd] to-[#ecdfc2]">
      <Canvas shadows onPointerMissed={() => clearSelection()} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault position={[48, 42, 48]} zoom={12} near={0.6} far={600} />
        <CameraControls />
        <fog attach="fog" args={["#e3f0dd", 90, 162]} />

        <SceneLighting />
        {showBlockout ? (
          <Suspense fallback={null}>
            <HeroBlockout />
          </Suspense>
        ) : (
          <Ground />
        )}

        {!isPreviewMode && !showBlockout && (
          <Grid
            position={[0, 0.072, 0]}
            args={[STREET_PLOT.width, STREET_PLOT.depth]}
            cellSize={gridSize}
            cellThickness={0.5}
            cellColor="#8b6f52"
            sectionSize={gridSize * 4}
            sectionThickness={0.9}
            sectionColor="#8b6f52"
            fadeFrom={0}
            fadeDistance={STREET_PLOT.width * 0.75}
            fadeStrength={1.5}
            followCamera={false}
            infiniteGrid={false}
            renderOrder={-1}
          />
        )}

        {!showBlockout &&
          objects.map((object) => (
            <DioramaObject key={object.id} object={object} isGizmoOwner={object.id === gizmoOwnerId} />
          ))}
      </Canvas>

      {objects.length === 0 && !isPreviewMode && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-[#8B6F52] shadow-[0_8px_24px_rgba(139,111,82,0.15)] backdrop-blur">
            <Trees size={26} />
          </span>
          <p className="text-base font-semibold text-[#4A3421]">Your Diorama is empty.</p>
          <p className="max-w-55 text-sm text-[#4A3421]/60">
            Add an object from the library to start building your world.
          </p>
        </div>
      )}
    </div>
  );
}
