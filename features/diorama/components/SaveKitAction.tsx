"use client";

import { useState } from "react";
import { Check, PackagePlus } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { useKitStore } from "../store/kitStore";
import { createKit, KIT_NAME_MAX } from "../utils/kits";

const BUTTON_CLASS =
  "flex items-center justify-center gap-2 rounded-xl border border-[#8b6f52]/15 bg-white/50 px-3 py-2.5 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white cursor-pointer";

/**
 * "Save as kit" for the current selection: asks for a name inline, then
 * stores the selection (with the attachments of selected buildings) in the
 * library's Kits group.
 */
export function SaveKitAction({ ids }: { ids: string[] }) {
  const addKit = useKitStore((s) => s.addKit);
  const [name, setName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => {
    const kit = createKit(useDioramaStore.getState().objects, ids, name ?? "");
    if (kit) addKit(kit);
    setName(null);
    setSaved(true);
  };

  if (name === null) {
    return (
      <button type="button" onClick={() => { setName(""); setSaved(false); }} className={BUTTON_CLASS}>
        {saved ? <Check size={15} /> : <PackagePlus size={15} />}
        {saved ? "Saved to Kits" : "Save as kit"}
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-1.5 rounded-xl border border-[#8b6f52]/15 bg-white/50 p-2"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <label className="text-xs font-medium text-[#4A3421]/60" htmlFor="kit-name">
        Kit name
      </label>
      <input
        id="kit-name"
        autoFocus
        value={name}
        maxLength={KIT_NAME_MAX}
        placeholder="My kit"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setName(null);
        }}
        className="rounded-lg border border-[#8b6f52]/15 bg-white/70 px-2.5 py-1.5 text-sm text-[#4A3421] outline-none focus:border-[#F0B27A] focus:bg-white"
      />
      <div className="flex gap-1.5">
        <button type="submit" className="flex-1 rounded-lg bg-[#4A3421] px-2 py-1.5 text-xs font-medium text-white hover:bg-[#4A3421]/85 cursor-pointer">
          Save
        </button>
        <button type="button" onClick={() => setName(null)} className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#4A3421]/60 hover:bg-white cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}
