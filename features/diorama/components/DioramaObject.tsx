"use client";

import { useEffect, useState } from "react";
import type { Group } from "three";
import type { DioramaObject as DioramaObjectData } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { ASSET_REGISTRY, getFootprintRadius, getRunSpan } from "../assets/assetRegistry";
import { GltfAsset } from "../objects/GltfAsset";
import { ScatterSelection } from "../objects/scatter/ScatterSelection";
import { runPiecesOf, scatterParamsOf } from "../utils/objectParams";
import { runPieceOffsets } from "../utils/runParams";
import { SelectionRing } from "./SelectionRing";

interface AssetVisualProps {
  object: Pick<DioramaObjectData, "type" | "params">;
  /** Scene object id, if other objects may be placed on this one. */
  surfaceId?: string;
}

/** The asset's geometry at its natural size in meters. */
export function AssetVisual({ object, surfaceId }: AssetVisualProps) {
  const asset = ASSET_REGISTRY[object.type];
  if (!("modelUrl" in asset)) {
    const Visual = asset.component;
    return <Visual object={object} surfaceId={surfaceId} />;
  }
  const pieces = runPiecesOf(object);
  if (pieces === 1 || !asset.tile) return <GltfAsset url={asset.modelUrl} footprintRadius={asset.footprintRadius} />;
  // A run: the same model laid end to end along X, centered on the origin.
  return runPieceOffsets(pieces, asset.tile).map((x) => (
    <group key={x} position={[x, 0, 0]}>
      <GltfAsset url={asset.modelUrl} footprintRadius={asset.footprintRadius} />
    </group>
  ));
}

/** A ring under a selected object, stretched along a run; a scatter layer marks each of its pieces instead. */
function SelectionMarker({ object }: { object: DioramaObjectData }) {
  const scatter = scatterParamsOf(object);
  if (scatter) return <ScatterSelection params={scatter} locked={object.locked} />;
  return <SelectionRing locked={object.locked} radius={getFootprintRadius(object)} length={getRunSpan(object)} />;
}

interface DioramaObjectProps {
  object: DioramaObjectData;
  /** Objects attached to this one, keyed by parent id. They render inside its group. */
  childrenByParent: Map<string, DioramaObjectData[]>;
  /** The object that carries the transform gizmo (SceneObjects). */
  gizmoOwnerId: string | null;
  /** Reports the gizmo owner's group, and null when it stops being the owner. */
  onGizmoGroup: (group: Group | null) => void;
}

/**
 * One scene object: its transform group, visual and selection ring, with
 * the objects attached to it nested inside the group so they follow it.
 */
export function DioramaObject({ object, childrenByParent, gizmoOwnerId, onGizmoGroup }: DioramaObjectProps) {
  const [group, setGroup] = useState<Group | null>(null);
  // Preview is for looking and photographing: the selection is not shown there.
  const isSelected = useDioramaStore((s) => !s.isPreviewMode && s.selectedObjectIds.includes(object.id));
  const selectObject = useDioramaStore((s) => s.selectObject);
  const toggleObjectSelection = useDioramaStore((s) => s.toggleObjectSelection);

  const isGizmoOwner = object.id === gizmoOwnerId;
  useEffect(() => {
    if (!isGizmoOwner || !group) return;
    onGizmoGroup(group);
    return () => onGizmoGroup(null);
  }, [isGizmoOwner, group, onGizmoGroup]);

  if (!object.visible) return null;

  return (
    <group
      ref={setGroup}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onClick={(event) => {
        // While a surface is being picked, clicks belong to PlacementLayer; in Preview, to the photo focus.
        const { placement, isPreviewMode } = useDioramaStore.getState();
        if (placement || isPreviewMode) return;
        event.stopPropagation();
        if (event.shiftKey) toggleObjectSelection(object.id);
        else selectObject(object.id);
      }}
    >
      <AssetVisual object={object} surfaceId={object.id} />
      {isSelected && <SelectionMarker object={object} />}
      {childrenByParent.get(object.id)?.map((child) => (
        <DioramaObject
          key={child.id}
          object={child}
          childrenByParent={childrenByParent}
          gizmoOwnerId={gizmoOwnerId}
          onGizmoGroup={onGizmoGroup}
        />
      ))}
    </group>
  );
}
