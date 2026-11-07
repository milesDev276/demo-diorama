"use client";

import { Lock, MousePointerClick } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import type { RightPanelTab } from "../types/diorama.types";
import { objectLabel } from "../assets/assetRegistry";
import { EditorSidePanel, type SidePanelTab } from "./EditorSidePanel";
import { ScenePanel } from "./ScenePanel";
import { SelectionPanel } from "./SelectionPanel";

const TABS: SidePanelTab<RightPanelTab>[] = [
  { id: "object", label: "Object" },
  { id: "scene", label: "Scene" },
];

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

function NothingSelected() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-[#4A3421]/45">
      <MousePointerClick size={22} />
      <p className="text-xs">Select something in the scene, or pick an item from the library.</p>
    </div>
  );
}

/**
 * Right column, the inspector: the Object tab edits the selection, the
 * Scene tab holds the scene settings. Selecting something opens Object,
 * clearing the selection opens Scene (dioramaStore), and either tab can be
 * chosen by hand at any time.
 */
export function PropertiesPanel() {
  const tab = useDioramaStore((s) => s.rightTab);
  const setTab = useDioramaStore((s) => s.setRightTab);
  const hasSelection = useDioramaStore((s) => s.selectedObjectIds.length > 0);

  return (
    <EditorSidePanel
      label="Inspector"
      side="right"
      tabs={TABS}
      value={tab}
      onChange={setTab}
      heading={<InspectorHeading tab={tab} />}
      panels={{
        object: hasSelection ? <SelectionPanel /> : <NothingSelected />,
        scene: <ScenePanel />,
      }}
    />
  );
}
