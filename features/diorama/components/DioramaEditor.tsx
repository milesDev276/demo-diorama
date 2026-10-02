"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorSubToolbar } from "./EditorSubToolbar";
import { ObjectLibrary } from "./ObjectLibrary";
import { ObjectList } from "./ObjectList";
import { PropertiesPanel } from "./PropertiesPanel";
import { DioramaCanvas } from "./DioramaCanvas";
import { NewSceneDialog } from "./NewSceneDialog";
import { PhotoBar } from "./PhotoBar";
import { useDioramaStore } from "../store/dioramaStore";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useAutoSave } from "../hooks/useAutoSave";
import { readFileAsText } from "../utils/sceneSerializer";

/**
 * Main page: composes the toolbar, object library + scene list, 3D canvas,
 * and properties panel. Preview mode hides everything but the Diorama and
 * the photo bar.
 */
export function DioramaEditor() {
  const isPreview = useDioramaStore((s) => s.isPreviewMode);
  const setPreviewMode = useDioramaStore((s) => s.setPreviewMode);
  const saveStatus = useDioramaStore((s) => s.saveStatus);
  const newScene = useDioramaStore((s) => s.newScene);
  const newSceneFromTemplate = useDioramaStore((s) => s.newSceneFromTemplate);
  const importScene = useDioramaStore((s) => s.importScene);
  const importError = useDioramaStore((s) => s.importError);
  const clearImportError = useDioramaStore((s) => s.clearImportError);

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEditorShortcuts(!isPreview);
  useAutoSave();

  const exitPreview = useCallback(() => setPreviewMode(false), [setPreviewMode]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-importing the same filename later
    if (!file) return;
    const text = await readFileAsText(file);
    importScene(text);
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
        {importError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 mx-3 mt-2 flex items-center gap-2 rounded-2xl border border-red-300/50 bg-red-50 px-4 py-2.5 text-sm text-red-600 sm:mx-6"
          >
            <AlertTriangle size={15} className="shrink-0" />
            <span className="flex-1">{importError}</span>
            <button
              type="button"
              onClick={clearImportError}
              className="rounded-md p-1 transition-colors hover:bg-red-100 cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main
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
              animate={{ opacity: 1, width: 256 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hidden shrink-0 flex-col gap-3 overflow-hidden md:flex"
            >
              <div className="flex min-h-0 flex-3 flex-col">
                <ObjectLibrary />
              </div>
              <div className="flex min-h-0 flex-2 flex-col">
                <ObjectList />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <DioramaCanvas />
        </div>

        <AnimatePresence>
          {!isPreview && (
            <motion.div
              key="properties"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 288 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hidden shrink-0 overflow-hidden lg:block"
            >
              <PropertiesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isPreview && <PhotoBar onExit={exitPreview} />}

      <NewSceneDialog
        open={newDialogOpen}
        hasUnsavedChanges={saveStatus !== "saved"}
        onCancel={() => setNewDialogOpen(false)}
        onCreate={(base) => {
          setNewDialogOpen(false);
          newScene(base);
        }}
        onCreateFromTemplate={(templateId) => {
          setNewDialogOpen(false);
          newSceneFromTemplate(templateId);
        }}
      />
    </div>
  );
}
