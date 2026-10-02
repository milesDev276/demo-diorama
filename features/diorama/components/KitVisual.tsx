"use client";

import { useMemo } from "react";
import type { DioramaObject, Kit } from "../types/diorama.types";
import { groupChildren } from "../utils/sceneGraph";
import { AssetVisual } from "./DioramaObject";

function KitObject({ object, childrenByParent }: { object: DioramaObject; childrenByParent: Map<string, DioramaObject[]> }) {
  if (!object.visible) return null;
  return (
    <group position={object.position} rotation={object.rotation} scale={object.scale}>
      <AssetVisual object={object} />
      {childrenByParent.get(object.id)?.map((child) => (
        <KitObject key={child.id} object={child} childrenByParent={childrenByParent} />
      ))}
    </group>
  );
}

/** Every object of a kit at its place in the kit's frame, attachments inside their building. Not selectable. */
export function KitVisual({ kit }: { kit: Kit }) {
  const childrenByParent = useMemo(() => groupChildren(kit.objects), [kit]);
  return (
    <>
      {kit.objects.map((object) =>
        object.parentId ? null : <KitObject key={object.id} object={object} childrenByParent={childrenByParent} />
      )}
    </>
  );
}
