"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { Material, Mesh, Object3D } from "three";
import { DEFAULT_BUILDING_PARAMS } from "../../assets/buildingPresets";
import type { AssetComponentProps, BuildingParams } from "../../types/diorama.types";
import { buildingParamsOf } from "../../utils/objectParams";
import { buildingSize } from "../../utils/buildingParams";
import { DIORAMA_COLORS } from "../../utils/palette";
import { BASE_SURFACE } from "../../utils/surfaceSnap";
import { ModelErrorBoundary } from "../GltfAsset";
import { castsShadow, getSlotMaterial, GLASS_RENDER_ORDER } from "../materials";
import {
  BUILDING_SLOTS,
  buildBuildingGeometry,
  type BuildingSlot,
  type ModuleGeometries,
  type SlotGeometries,
} from "./buildingGeometry";
import { BUILDING_MODULE_NAMES, BUILDING_MODULES } from "./buildingLayout";

const MODULE_URLS = BUILDING_MODULE_NAMES.map((name) => BUILDING_MODULES[name]);

/** One geometry per material slot of a loaded module GLB. */
function slotGeometries(scene: Object3D): SlotGeometries {
  const slots: SlotGeometries = {};
  scene.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh) slots[(mesh.material as Material).name as BuildingSlot] = mesh.geometry;
  });
  return slots;
}

interface BuildingProps {
  params?: BuildingParams;
  /** Id of the scene object, if props can be placed on this building. Ghosts have none. */
  surfaceId?: string;
}

function BuildingMesh({ params, surfaceId }: Required<Pick<BuildingProps, "params">> & Pick<BuildingProps, "surfaceId">) {
  const gltfs = useGLTF(MODULE_URLS);
  const modules = useMemo(
    () => Object.fromEntries(BUILDING_MODULE_NAMES.map((name, i) => [name, slotGeometries(gltfs[i].scene)])) as ModuleGeometries,
    [gltfs]
  );
  // The params object changes identity on every edit and undo; its content is the key.
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometries = useMemo(() => buildBuildingGeometry(params, modules), [paramsKey, modules]);

  useEffect(
    () => () => {
      for (const slot of BUILDING_SLOTS) geometries[slot]?.dispose();
    },
    [geometries]
  );

  const userData = useMemo(() => (surfaceId ? { ...BASE_SURFACE, objectId: surfaceId } : {}), [surfaceId]);

  return (
    <>
      {BUILDING_SLOTS.map((slot) =>
        geometries[slot] ? (
          <mesh
            key={slot}
            geometry={geometries[slot]}
            material={getSlotMaterial(slot)}
            userData={userData}
            castShadow={castsShadow(slot)}
            receiveShadow
            renderOrder={slot === "glass" ? GLASS_RENDER_ORDER : 0}
          />
        ) : null
      )}
    </>
  );
}

/** Faint box the size of the building, while its modules load or if they failed to. */
function BuildingGhost({ params, failed = false }: { params: BuildingParams; failed?: boolean }) {
  const { width, depth, wallHeight } = buildingSize(params);
  return (
    <mesh position={[0, wallHeight / 2, 0]}>
      <boxGeometry args={[width, wallHeight, depth]} />
      <meshBasicMaterial
        color={failed ? DIORAMA_COLORS.signRed : DIORAMA_COLORS.sidewalkJoint}
        transparent
        opacity={failed ? 0.45 : 0.3}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * A modular building (meters, origin at the center of its footprint on the
 * ground, front toward +Z), assembled from Blender facade modules on the
 * 1.82 m bay grid according to `params` and rendered as one mesh per
 * material slot — at most four draw calls however large it is.
 */
export function Building({ params = DEFAULT_BUILDING_PARAMS, surfaceId }: BuildingProps) {
  return (
    <ModelErrorBoundary url="building modules" fallback={<BuildingGhost params={params} failed />}>
      <Suspense fallback={<BuildingGhost params={params} />}>
        <BuildingMesh params={params} surfaceId={surfaceId} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

/** The registry's component for `building` objects: reads the object's params. */
export function BuildingAsset({ object, surfaceId }: AssetComponentProps) {
  return <Building params={buildingParamsOf(object)} surfaceId={surfaceId} />;
}
