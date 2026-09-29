"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorSubToolbar } from "./EditorSubToolbar";
import { ObjectLibrary } from "./ObjectLibrary";
import { ObjectList } from "./ObjectList";
import { PropertiesPanel } from "./PropertiesPanel";
import { DioramaCanvas } from "./DioramaCanvas";
import { ConfirmDialog } from "./ConfirmDialog";
import { useDioramaStore } from "../store/dioramaStore";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useAutoSave } from "../hooks/useAutoSave";
import { readFileAsText } from "../utils/sceneSerializer";

/**
 * Main page: composes the toolbar, object library + scene list, 3D canvas,
 * and properties panel. Preview mode hides everything but the Diorama itself.
 */
export function DioramaEditor() {
  const isPreview = useDioramaStore((s) => s.isPreviewMode);
  const setPreviewMode = useDioramaStore((s) => s.setPreviewMode);
  const saveStatus = useDioramaStore((s) => s.saveStatus);
  const newScene = useDioramaStore((s) => s.newScene);
  const importScene = useDioramaStore((s) => s.importScene);
  const importError = useDioramaStore((s) => s.importError);
  const clearImportError = useDioramaStore((s) => s.clearImportError);

  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEditorShortcuts(!isPreview);
  useAutoSave();

  const handleRequestNewScene = () => {
    if (saveStatus !== "saved") setConfirmNewOpen(true);
    else newScene();
  };

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
            onRequestNewScene={handleRequestNewScene}
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

      {isPreview && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          type="button"
          onClick={() => setPreviewMode(false)}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/80 px-5 py-2.5 text-sm font-medium text-[#4A3421] shadow-[0_8px_32px_rgba(139,111,82,0.2)] backdrop-blur-xl transition-colors hover:bg-white cursor-pointer"
        >
          ← Exit Preview
        </motion.button>
      )}

      <ConfirmDialog
        open={confirmNewOpen}
        title="You have unsaved changes."
        message="Starting a new Diorama will discard them."
        confirmLabel="Discard"
        cancelLabel="Cancel"
        danger
        onCancel={() => setConfirmNewOpen(false)}
        onConfirm={() => {
          setConfirmNewOpen(false);
          newScene();
        }}
      />
    </div>
  );
}
