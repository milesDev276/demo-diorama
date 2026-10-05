"use client";

import { useCallback, useMemo, useState } from "react";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";
import type { DioramaObject as DioramaObjectData, TransformMode } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { groupChildren } from "../utils/sceneGraph";
import { DioramaObject } from "./DioramaObject";
import { SelectionPivot } from "./SelectionPivot";

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
 * The transform gizmo of a single selected object, on that object's group.
 * It lives at the scene root, not inside the object, so an attached
 * object's gizmo is not transformed by its building. The group's transform
 * is local to its parent, which is exactly what the scene data stores.
 */
function TransformGizmo({ group, object }: TransformGizmoProps) {
  const transformMode = useDioramaStore((s) => s.transformMode);
  const snapEnabled = useDioramaStore((s) => s.snapEnabled);
  const gridSize = useDioramaStore((s) => s.gridSize);
  const rotationSnapEnabled = useDioramaStore((s) => s.rotationSnapEnabled);
  const rotationSnapDegrees = useDioramaStore((s) => s.rotationSnapDegrees);
  const updateObject = useDioramaStore((s) => s.updateObject);
  const commitTransform = useDioramaStore((s) => s.commitTransform);

  const axes = GIZMO_AXES[transformMode];

  const handleObjectChange = useCallback(() => {
    if (transformMode === "scale") {
      // Only the X handle is shown; mirror it onto Y/Z to keep scaling uniform.
      group.scale.set(group.scale.x, group.scale.x, group.scale.x);
    }

    updateObject(object.id, {
      position: [group.position.x, group.position.y, group.position.z],
      rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
      scale: [group.scale.x, group.scale.y, group.scale.z],
    });
  }, [group, transformMode, object.id, updateObject]);

  return (
    <TransformControls
      object={group}
      mode={transformMode}
      showX={axes.x}
      showY={axes.y}
      showZ={axes.z}
      translationSnap={snapEnabled ? gridSize : null}
      rotationSnap={rotationSnapEnabled ? THREE.MathUtils.degToRad(rotationSnapDegrees) : null}
      onObjectChange={handleObjectChange}
      onMouseUp={commitTransform}
      size={0.8}
    />
  );
}

/**
 * Every object of the scene, rendered from the store: top-level objects at
 * the scene root, attached objects inside their building, and one transform
 * gizmo for the selection: on the object itself, or on the center of several.
 */
export function SceneObjects() {
  const objects = useDioramaStore((s) => s.objects);
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  // The gizmo would catch the brush's strokes; it comes back when the brush ends.
  const isBrushing = useDioramaStore((s) => s.brush !== null);
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  const [gizmoGroup, setGizmoGroup] = useState<Group | null>(null);

  const childrenByParent = useMemo(() => groupChildren(objects), [objects]);

  const isMultiSelect = selectedObjectIds.length > 1;
  // A sole selection carries the gizmo itself, unless it is locked.
  const gizmoOwner = useMemo(() => {
    if (selectedObjectIds.length !== 1) return null;
    const object = objects.find((o) => o.id === selectedObjectIds[0]);
    return object && !object.locked ? object : null;
  }, [selectedObjectIds, objects]);
  // Several objects share a pivot, as long as one of them can be moved.
  const hasPivot = useMemo(
    () => isMultiSelect && objects.some((o) => selectedObjectIds.includes(o.id) && !o.locked),
    [isMultiSelect, selectedObjectIds, objects]
  );
  const showGizmo = !isBrushing && !isPreviewMode;

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
      {showGizmo && gizmoOwner && gizmoGroup && <TransformGizmo group={gizmoGroup} object={gizmoOwner} />}
      {showGizmo && hasPivot && <SelectionPivot ids={selectedObjectIds} />}
    </>
  );
}
