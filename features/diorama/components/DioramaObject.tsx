"use client";

import { useCallback, useRef, useState } from "react";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";
import type { DioramaObject as DioramaObjectData, TransformMode } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { Tree } from "../objects/Tree";
import { House } from "../objects/House";
import { Rock } from "../objects/Rock";
import { SelectionRing } from "./SelectionRing";

const OBJECT_VISUALS: Record<DioramaObjectData["type"], () => React.ReactElement> = {
  tree: Tree,
  house: House,
  rock: Rock,
};

/** Which gizmo handles are shown per mode — rotate is Y-only, scale is uniform (X drives all axes). */
const GIZMO_AXES: Record<TransformMode, { x: boolean; y: boolean; z: boolean }> = {
  translate: { x: true, y: true, z: true },
  rotate: { x: false, y: true, z: false },
  scale: { x: true, y: false, z: false },
};

interface DioramaObjectProps {
  object: DioramaObjectData;
  /** True for the single object that should carry the transform gizmo — the
   *  sole selection, or (in a multi-selection) the one delta-driving the group move. */
  isGizmoOwner: boolean;
}

export function DioramaObject({ object, isGizmoOwner }: DioramaObjectProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const dragOriginRef = useRef(new THREE.Vector3());

  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const transformMode = useDioramaStore((s) => s.transformMode);
  const snapEnabled = useDioramaStore((s) => s.snapEnabled);
  const gridSize = useDioramaStore((s) => s.gridSize);
  const rotationSnapEnabled = useDioramaStore((s) => s.rotationSnapEnabled);
  const rotationSnapDegrees = useDioramaStore((s) => s.rotationSnapDegrees);
  const selectObject = useDioramaStore((s) => s.selectObject);
  const toggleObjectSelection = useDioramaStore((s) => s.toggleObjectSelection);
  const updateObject = useDioramaStore((s) => s.updateObject);
  const translateObjectsBy = useDioramaStore((s) => s.translateObjectsBy);
  const commitTransform = useDioramaStore((s) => s.commitTransform);

  const isSelected = selectedObjectIds.includes(object.id);
  const isMultiSelect = selectedObjectIds.length > 1;
  const showGizmo = isGizmoOwner && !object.locked;

  const Visual = OBJECT_VISUALS[object.type];
  const axes = GIZMO_AXES[isMultiSelect ? "translate" : transformMode];

  const handleMouseDown = useCallback(() => {
    if (group) dragOriginRef.current.copy(group.position);
  }, [group]);

  const handleObjectChange = useCallback(() => {
    if (!group) return;

    if (isMultiSelect) {
      const delta: [number, number, number] = [
        group.position.x - dragOriginRef.current.x,
        group.position.y - dragOriginRef.current.y,
        group.position.z - dragOriginRef.current.z,
      ];
      dragOriginRef.current.copy(group.position);
      if (delta[0] !== 0 || delta[1] !== 0 || delta[2] !== 0) {
        translateObjectsBy(selectedObjectIds, delta);
      }
      return;
    }

    if (transformMode === "scale") {
      // Only the X handle is shown; mirror it onto Y/Z to keep scaling uniform.
      group.scale.set(group.scale.x, group.scale.x, group.scale.x);
    }

    updateObject(object.id, {
      position: [group.position.x, group.position.y, group.position.z],
      rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
      scale: [group.scale.x, group.scale.y, group.scale.z],
    });
  }, [group, isMultiSelect, selectedObjectIds, transformMode, translateObjectsBy, object.id, updateObject]);

  if (!object.visible) return null;

  return (
    <>
      <group
        ref={setGroup}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={(event) => {
          event.stopPropagation();
          if (event.shiftKey) toggleObjectSelection(object.id);
          else selectObject(object.id);
        }}
      >
        <Visual />
        {isSelected && <SelectionRing locked={object.locked} />}
      </group>

      {showGizmo && group && (
        <TransformControls
          object={group}
          mode={isMultiSelect ? "translate" : transformMode}
          showX={axes.x}
          showY={axes.y}
          showZ={axes.z}
          translationSnap={snapEnabled ? gridSize : null}
          rotationSnap={rotationSnapEnabled ? THREE.MathUtils.degToRad(rotationSnapDegrees) : null}
          onMouseDown={handleMouseDown}
          onObjectChange={handleObjectChange}
          onMouseUp={commitTransform}
          size={0.8}
        />
      )}
    </>
  );
}
