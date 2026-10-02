"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, useGLTF } from "@react-three/drei";
import { NeutralToneMapping } from "three";
import { Trees } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { Ground } from "./Ground";
import { SceneLighting } from "./SceneLighting";
import { SceneObjects } from "./SceneObjects";
import { PlacementLayer } from "./PlacementLayer";
import { BrushLayer } from "./BrushLayer";
import { BrushBar } from "./BrushBar";
import { CameraControls } from "./CameraControls";
import { PostEffects } from "./PostEffects";
import { SceneFog } from "./SceneFog";
import { HeroBlockout } from "./dev/HeroBlockout";
import { DevRendererHandle } from "./dev/DevRendererHandle";
import { cn } from "@/lib/cn";
import { ASSET_REGISTRY, MODEL_URLS } from "../assets/assetRegistry";
import { BASE_TEMPLATES } from "../utils/baseTemplates";
import { DIORAMA_COLORS } from "../utils/palette";

/** Inline because the stops come from the palette, which SkyBackdrop in Preview also uses. */
const SKY_BACKDROP_STYLE = {
  background: `linear-gradient(to bottom, ${DIORAMA_COLORS.skyTop}, ${DIORAMA_COLORS.skyMiddle}, ${DIORAMA_COLORS.skyBottom})`,
};

/**
 * `/diorama?dev=<flag>` dev aids: `blockout` swaps the scene for the hero
 * blockout (a reference only); `stats` exposes the renderer to the
 * measurement scripts.
 */
function getDevFlag(): string | null {
  return new URLSearchParams(window.location.search).get("dev");
}

/**
 * Owns the R3F Canvas: camera, controls, lighting, ground, grid, and every
 * object rendered from the Zustand store. Clicking empty space deselects.
 */
export function DioramaCanvas() {
  const isEmpty = useDioramaStore((s) => s.objects.length === 0);
  const placement = useDioramaStore((s) => s.placement);
  const isBrushing = useDioramaStore((s) => s.brush !== null);
  const gridSize = useDioramaStore((s) => s.gridSize);
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  const base = useDioramaStore((s) => s.environment.base);
  const template = BASE_TEMPLATES[base];
  const clearSelection = useDioramaStore((s) => s.clearSelection);
  const [devFlag] = useState(getDevFlag);
  const showBlockout = devFlag === "blockout";

  // Fetch every model up front, so adding one from the library never shows a placeholder.
  useEffect(() => {
    for (const url of MODEL_URLS) useGLTF.preload(url);
  }, []);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden rounded-3xl", (placement || isBrushing) && "cursor-crosshair")}
      style={SKY_BACKDROP_STYLE}
    >
      <Canvas
        shadows="percentage"
        onPointerMissed={() => {
          // While a surface is being picked, clicks belong to PlacementLayer.
          if (!useDioramaStore.getState().placement) clearSelection();
        }}
        gl={{ antialias: true, toneMapping: NeutralToneMapping }}
      >
        <CameraControls />
        <SceneFog />
        {devFlag === "stats" && <DevRendererHandle />}

        <SceneLighting />
        {/* The blockout is the hero scene, so it always stands on the corner base. */}
        <Ground base={showBlockout ? "corner" : base} />
        {showBlockout && (
          <Suspense fallback={null}>
            <HeroBlockout />
          </Suspense>
        )}

        {!isPreviewMode && !showBlockout && (
          <Grid
            position={[0, template.gridY, 0]}
            args={[template.width, template.depth]}
            cellSize={gridSize}
            cellThickness={0.5}
            cellColor="#8b6f52"
            sectionSize={gridSize * 4}
            sectionThickness={0.9}
            sectionColor="#8b6f52"
            fadeFrom={0}
            fadeDistance={template.width * 0.75}
            fadeStrength={1.5}
            followCamera={false}
            infiniteGrid={false}
            renderOrder={-1}
          />
        )}

        {!showBlockout && <SceneObjects />}
        {!showBlockout && !isPreviewMode && <PlacementLayer />}
        {!showBlockout && !isPreviewMode && <BrushLayer />}

        {isPreviewMode && <PostEffects />}
      </Canvas>

      {placement && (
        <p className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-[#4A3421] shadow-[0_8px_24px_rgba(139,111,82,0.15)] backdrop-blur">
          {"kit" in placement ? placement.kit.name : ASSET_REGISTRY[placement.type].label}: click a surface to place it ·
          R to turn · Shift+click to place several · Esc to cancel
        </p>
      )}

      {isBrushing && !isPreviewMode && <BrushBar />}

      {isEmpty && !isPreviewMode && !placement && !isBrushing && (
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
