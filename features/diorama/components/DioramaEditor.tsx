"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, LayoutGrid, ListTree, X } from "lucide-react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorSubToolbar } from "./EditorSubToolbar";
import { EditorSidePanel, type SidePanelTab } from "./EditorSidePanel";
import { ObjectLibrary } from "./ObjectLibrary";
import { ObjectList } from "./ObjectList";
import { PropertiesPanel } from "./PropertiesPanel";
import { DioramaCanvas } from "./DioramaCanvas";
import { NewSceneDialog } from "./NewSceneDialog";
import { PhotoBar } from "./PhotoBar";
import { PreviewOverlay } from "./PreviewOverlay";
import { PanelResizeHandle } from "./PanelResizeHandle";
import { EditorLoadingScreen, EditorMessageScreen } from "./EditorScreens";
import { useDioramaStore } from "../store/dioramaStore";
import type { LeftPanelTab } from "../types/diorama.types";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useAutoSave } from "../hooks/useAutoSave";
import { useEditorLayout } from "../hooks/useEditorLayout";
import { fitColumnWidths, PANEL_WIDTH_RANGE, RAIL_WIDTH } from "../utils/editorLayout";
import { useOpenDiorama } from "@/features/dioramas/hooks/useOpenDiorama";
import { useDioramaLauncher } from "@/features/dioramas/hooks/useDioramaLauncher";

/** The editor for one diorama of the collection: it opens the diorama, then shows the workspace. */
export function DioramaEditor({ dioramaId }: { dioramaId: string }) {
  const status = useOpenDiorama(dioramaId);
  if (status.state === "loading") return <EditorLoadingScreen />;
  if (status.state === "missing") {
    return (
      <EditorMessageScreen
        title="This diorama isn't here"
        message="It may have been deleted. Dioramas are kept in the browser they were made in, so a link from another browser or computer does not open here."
      />
    );
  }
  if (status.state === "error") return <EditorMessageScreen title="This diorama can't be opened" message={status.message} />;
  return <EditorWorkspace />;
}

/** Left column: the library, and the list of what is in the scene. */
function LibraryPanel() {
  const tab = useDioramaStore((s) => s.leftTab);
  const setTab = useDioramaStore((s) => s.setLeftTab);
  const objectCount = useDioramaStore((s) => s.objects.length);
  const folded = useDioramaStore((s) => s.panels.left.folded);
  const setPanelLayout = useDioramaStore((s) => s.setPanelLayout);
  const tabs: SidePanelTab<LeftPanelTab>[] = [
    { id: "library", label: "Library", icon: LayoutGrid },
    { id: "objects", label: "Objects", icon: ListTree, count: objectCount },
  ];
  return (
    <EditorSidePanel
      label="Library and objects"
      side="left"
      name="library"
      folded={folded}
      onFoldedChange={(next) => setPanelLayout("left", { folded: next })}
      tabs={tabs}
      value={tab}
      onChange={setTab}
      panels={{ library: <ObjectLibrary />, objects: <ObjectList /> }}
    />
  );
}

/**
 * Composes the toolbar, library + object list, 3D canvas, and
 * properties panel. Preview mode hides everything but the Diorama, the
 * photo bar and the Preview overlay (the way back, help, the focus marker).
 * The side columns fold into rails and can be dragged wider (Stage 21 D4, D5).
 */
function EditorWorkspace() {
  const isPreview = useDioramaStore((s) => s.isPreviewMode);
  const setPreviewMode = useDioramaStore((s) => s.setPreviewMode);
  const launcher = useDioramaLauncher();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasColumnRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const panels = useDioramaStore((s) => s.panels);
  // While an edge is dragged, its column follows the pointer instead of animating to each width.
  const [dragging, setDragging] = useState(false);
  const getCanvasWidth = useCallback(() => canvasColumnRef.current?.clientWidth ?? 0, []);
  // The main row's width and the window's, so stored widths never crowd the canvas under its minimum (D5).
  const [row, setRow] = useState({ width: 0, window: 0 });
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => setRow({ width: main.clientWidth, window: window.innerWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    return () => observer.disconnect();
  }, []);
  // The breakpoints at which the columns show at all (Tailwind md and lg, below).
  const columnSpec = (side: "left" | "right", shown: boolean) =>
    panels[side].folded
      ? { width: RAIL_WIDTH, min: RAIL_WIDTH, shown }
      : { width: panels[side].width, min: PANEL_WIDTH_RANGE[side].min, shown };
  const columnWidths = fitColumnWidths(row.width, columnSpec("left", row.window >= 768), columnSpec("right", row.window >= 1024));
  const columnTransition = { duration: dragging ? 0 : 0.25, ease: "easeOut" } as const;

  useEditorShortcuts(!isPreview);
  useAutoSave();
  useEditorLayout();

  const exitPreview = useCallback(() => setPreviewMode(false), [setPreviewMode]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-importing the same filename later
    if (!file) return;
    await launcher.importFile(file);
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-[#FDF6EC] to-[#EAD9C2]">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {!isPreview && (
          <EditorToolbar
            isPreview={isPreview}
            onTogglePreview={() => setPreviewMode(true)}
            onRequestNewScene={() => setNewDialogOpen(true)}
            onImportClick={handleImportClick}
          />
        )}
      </AnimatePresence>

      {!isPreview && <EditorSubToolbar />}

      <AnimatePresence>
        {launcher.error && !newDialogOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 mx-3 mt-2 flex items-center gap-2 rounded-2xl border border-red-300/50 bg-red-50 px-4 py-2.5 text-sm text-red-600 sm:mx-6"
          >
            <AlertTriangle size={15} className="shrink-0" />
            <span className="flex-1">{launcher.error}</span>
            <button
              type="button"
              onClick={launcher.clearError}
              className="rounded-md p-1 transition-colors hover:bg-red-100 cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        ref={mainRef}
        className={
          isPreview
            ? "flex flex-1 overflow-hidden p-0"
            : "flex flex-1 gap-3 overflow-hidden p-3 sm:gap-4 sm:p-6"
        }
      >
        <AnimatePresence>
          {!isPreview && (
            <motion.div
              key="library"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: columnWidths.left }}
              exit={{ opacity: 0, width: 0 }}
              transition={columnTransition}
              className="hidden shrink-0 overflow-hidden md:block"
            >
              <LibraryPanel />
            </motion.div>
          )}
        </AnimatePresence>
        {!isPreview && !panels.left.folded && (
          <PanelResizeHandle side="left" label="Library" width={columnWidths.left} getCanvasWidth={getCanvasWidth} onDraggingChange={setDragging} />
        )}

        <div ref={canvasColumnRef} className="min-w-0 flex-1">
          <DioramaCanvas />
        </div>

        {!isPreview && !panels.right.folded && (
          <PanelResizeHandle side="right" label="Inspector" width={columnWidths.right} getCanvasWidth={getCanvasWidth} onDraggingChange={setDragging} />
        )}

        <AnimatePresence>
          {!isPreview && (
            <motion.div
              key="properties"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: columnWidths.right }}
              exit={{ opacity: 0, width: 0 }}
              transition={columnTransition}
              className="hidden shrink-0 overflow-hidden lg:block"
            >
              <PropertiesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isPreview && <PhotoBar onExit={exitPreview} />}
      {isPreview && <PreviewOverlay onExit={exitPreview} />}

      <NewSceneDialog
        open={newDialogOpen}
        busy={launcher.busy}
        error={launcher.error}
        onCancel={() => {
          setNewDialogOpen(false);
          launcher.clearError();
        }}
        onCreate={(base) => void launcher.createEmpty(base)}
        onCreateFromTemplate={(templateId) => void launcher.createFromStarter(templateId)}
      />
    </div>
  );
}
