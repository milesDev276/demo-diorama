"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";
import type { DioramaObject as DioramaObjectData, TransformMode, Vector3Tuple } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { getTopLevelIds, groupChildren } from "../utils/sceneGraph";
import { DioramaObject } from "./DioramaObject";

/** Which gizmo handles are shown per mode — rotate is Y-only, scale is uniform (X drives all axes). */
const GIZMO_AXES: Record<TransformMode, { x: boolean; y: boolean; z: boolean }> = {
  translate: { x: true, y: true, z: true },
  rotate: { x: false, y: true, z: false },
  scale: { x: true, y: false, z: false },
};

interface TransformGizmoProps {
  group: Group;
  object: DioramaObjectData;
}

/**
 * The transform gizmo on the gizmo owner's group. It lives at the scene
 * root, not inside the object, so an attached object's gizmo is not
 * transformed by its building. The group's transform is local to its
 * parent, which is exactly what the scene data stores.
 */
function TransformGizmo({ group, object }: TransformGizmoProps) {
  const dragOriginRef = useRef(new THREE.Vector3());
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const transformMode = useDioramaStore((s) => s.transformMode);
  const snapEnabled = useDioramaStore((s) => s.snapEnabled);
  const gridSize = useDioramaStore((s) => s.gridSize);
  const rotationSnapEnabled = useDioramaStore((s) => s.rotationSnapEnabled);
  const rotationSnapDegrees = useDioramaStore((s) => s.rotationSnapDegrees);
  const updateObject = useDioramaStore((s) => s.updateObject);
  const translateObjectsBy = useDioramaStore((s) => s.translateObjectsBy);
  const commitTransform = useDioramaStore((s) => s.commitTransform);

  const isMultiSelect = selectedObjectIds.length > 1;
  const mode = isMultiSelect ? "translate" : transformMode;
  const axes = GIZMO_AXES[mode];

  const handleMouseDown = useCallback(() => {
    group.getWorldPosition(dragOriginRef.current);
  }, [group]);

  const handleObjectChange = useCallback(() => {
    if (isMultiSelect) {
      // The whole selection moves by the owner's world-space step.
      const position = group.getWorldPosition(new THREE.Vector3());
      const delta = position.clone().sub(dragOriginRef.current).toArray() as Vector3Tuple;
      dragOriginRef.current.copy(position);
      if (delta[0] !== 0 || delta[1] !== 0 || delta[2] !== 0) translateObjectsBy(selectedObjectIds, delta);
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

  return (
    <TransformControls
      object={group}
      mode={mode}
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
  );
}

/**
 * Every object of the scene, rendered from the store: top-level objects at
 * the scene root, attached objects inside their building, and one transform
 * gizmo for the selection.
 */
export function SceneObjects() {
  const objects = useDioramaStore((s) => s.objects);
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  // The gizmo would catch the brush's strokes; it comes back when the brush ends.
  const isBrushing = useDioramaStore((s) => s.brush !== null);
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  const [gizmoGroup, setGizmoGroup] = useState<Group | null>(null);

  const childrenByParent = useMemo(() => groupChildren(objects), [objects]);

  // The gizmo attaches to the sole selection, or — in a multi-selection — the
  // most recently selected object that can drag the group: not locked, and
  // not attached to a building that is itself selected (it follows that).
  const gizmoOwner = useMemo(() => {
    const candidates = getTopLevelIds(objects, selectedObjectIds);
    for (let i = candidates.length - 1; i >= 0; i--) {
      const object = objects.find((o) => o.id === candidates[i]);
      if (object && !object.locked) return object;
    }
    return null;
  }, [selectedObjectIds, objects]);

  return (
    <>
      {objects.map((object) =>
        object.parentId ? null : (
          <DioramaObject
            key={object.id}
            object={object}
            childrenByParent={childrenByParent}
            gizmoOwnerId={gizmoOwner?.id ?? null}
            onGizmoGroup={setGizmoGroup}
          />
        )
      )}
      {gizmoOwner && gizmoGroup && !isBrushing && !isPreviewMode && <TransformGizmo group={gizmoGroup} object={gizmoOwner} />}
    </>
  );
}
