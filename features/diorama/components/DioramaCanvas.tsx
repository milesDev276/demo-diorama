"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, useGLTF } from "@react-three/drei";
import { NeutralToneMapping } from "three";
import { Trees } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { SceneEnvironmentContext } from "../hooks/useSceneEnvironment";
import { EnvironmentDriver } from "./EnvironmentDriver";
import { Ground } from "./Ground";
import { SceneGlowLights } from "./SceneGlowLights";
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
import { PHOTO_ASPECT_RATIOS } from "../utils/photo";
import { skyGradient, TIME_OF_DAY_LOOKS } from "../utils/timeOfDay";

/** The mat around a photo frame. Its padding keeps the frame clear of the photo bar. */
const MAT_STYLE = { background: "#26201c", containerType: "size" } as const;

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
  const environment = useDioramaStore((s) => s.environment);
  const base = environment.base;
  const template = BASE_TEMPLATES[base];
  // In Preview a photo frame gives the canvas itself its shape, so what is framed is what is exported.
  const frameRatio = useDioramaStore((s) => (s.isPreviewMode ? PHOTO_ASPECT_RATIOS[s.photo.aspect] : null));
  // Inline because the stops come from the time of day, which SkyBackdrop in Preview also uses.
  const skyStyle = { background: skyGradient(TIME_OF_DAY_LOOKS[environment.timeOfDay]) };
  const clearSelection = useDioramaStore((s) => s.clearSelection);
  const [devFlag] = useState(getDevFlag);
  const showBlockout = devFlag === "blockout";

  // Fetch every model up front, so adding one from the library never shows a placeholder.
  useEffect(() => {
    for (const url of MODEL_URLS) useGLTF.preload(url);
  }, []);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl",
        (placement || isBrushing) && "cursor-crosshair",
        frameRatio !== null && "flex items-center justify-center px-6 pb-36 pt-6"
      )}
      style={frameRatio ? MAT_STYLE : skyStyle}
    >
      <div
        className={frameRatio ? "overflow-hidden rounded-md shadow-[0_12px_48px_rgba(0,0,0,0.45)]" : "h-full w-full"}
        style={
          frameRatio
            ? { ...skyStyle, width: `min(100cqw, 100cqh * ${frameRatio})`, height: `min(100cqh, 100cqw / ${frameRatio})` }
            : undefined
        }
      >
        <Canvas
          shadows="percentage"
          onPointerMissed={() => {
            // While a surface is being picked, clicks belong to PlacementLayer; in Preview, to the photo focus.
            const { placement, isPreviewMode } = useDioramaStore.getState();
            if (!placement && !isPreviewMode) clearSelection();
          }}
          gl={{ antialias: true, toneMapping: NeutralToneMapping }}
        >
          {/* Everything in the canvas is drawn in the scene's time of day and season. */}
          <SceneEnvironmentContext.Provider value={environment}>
            <CameraControls />
            <SceneFog />
            {devFlag === "stats" && <DevRendererHandle />}

            <EnvironmentDriver />
            <SceneLighting />
            {!showBlockout && <SceneGlowLights />}
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
          </SceneEnvironmentContext.Provider>
        </Canvas>
      </div>

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
