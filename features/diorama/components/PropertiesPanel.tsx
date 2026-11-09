"use client";

import { Lock, Mountain, SlidersHorizontal } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import type { RightPanelTab } from "../types/diorama.types";
import { objectLabel } from "../assets/assetRegistry";
import { EditorSidePanel, type SidePanelTab } from "./EditorSidePanel";
import { ScenePanel } from "./ScenePanel";
import { SelectionPanel } from "./SelectionPanel";


/** Names what the open tab shows: the selected object, the size of a multi-selection, or the diorama. */
function InspectorHeading({ tab }: { tab: RightPanelTab }) {
  const sceneName = useDioramaStore((s) => s.sceneName);
  const selected = useDioramaStore((s) =>
    s.selectedObjectIds.length === 1 ? s.objects.find((o) => o.id === s.selectedObjectIds[0]) : undefined
  );
  const count = useDioramaStore((s) => s.selectedObjectIds.length);

  let text = sceneName;
  if (tab === "object") text = selected ? objectLabel(selected) : count > 1 ? `${count} objects` : "Nothing selected";

  return (
    <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-[#4A3421]">
      {tab === "object" && selected?.locked && <Lock size={12} className="shrink-0" aria-label="Locked" />}
      <span className="truncate">{text}</span>
    </h2>
  );
}

/**
 * Right column, the inspector: the Object tab edits the selection, the
 * Scene tab holds the scene settings. Selecting something opens Object,
 * clearing the selection opens Scene (dioramaStore), and either tab can be
 * chosen by hand at any time. Only the open tab renders: the Object form
 * would otherwise re-render on every frame of a drag while Scene is open.
 */
export function PropertiesPanel() {
  const tab = useDioramaStore((s) => s.rightTab);
  const setTab = useDioramaStore((s) => s.setRightTab);
  const folded = useDioramaStore((s) => s.panels.right.folded);
  const setPanelLayout = useDioramaStore((s) => s.setPanelLayout);
  const hasSelection = useDioramaStore((s) => s.selectedObjectIds.length > 0);
  // On the folded rail, a dot on Object says there is a selection to inspect (Stage 21 D4).
  const tabs: SidePanelTab<RightPanelTab>[] = [
    { id: "object", label: "Object", icon: SlidersHorizontal, dot: hasSelection },
    { id: "scene", label: "Scene", icon: Mountain },
  ];

  return (
    <EditorSidePanel
      label="Inspector"
      side="right"
      name="inspector"
      folded={folded}
      onFoldedChange={(next) => setPanelLayout("right", { folded: next })}
      tabs={tabs}
      value={tab}
      onChange={setTab}
      heading={<InspectorHeading tab={tab} />}
      panels={{
        object: tab === "object" && <SelectionPanel />,
        scene: tab === "scene" && <ScenePanel />,
      }}
    />
  );
}
