"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Copy, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface DioramaCardMenuProps {
  name: string;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const ITEM =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-[#4A3421] transition-colors hover:bg-[#4A3421]/5 focus-visible:bg-[#4A3421]/5 focus-visible:outline-none cursor-pointer";

/** The "…" menu of a diorama card. Arrow keys move through it, Esc closes it. */
export function DioramaCardMenu({ name, onRename, onDuplicate, onExport, onDelete }: DioramaCardMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`More actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-1.5 text-[#4A3421]/60 transition-colors hover:bg-[#4A3421]/5 hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#8B6F52] cursor-pointer"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Actions for ${name}`}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-[#8b6f52]/15 bg-[#FDF6EC] p-1 shadow-[0_12px_32px_rgba(74,52,33,0.18)]"
        >
          <button type="button" role="menuitem" className={ITEM} onClick={choose(onRename)}>
            <Pencil size={14} /> Rename
          </button>
          <button type="button" role="menuitem" className={ITEM} onClick={choose(onDuplicate)}>
            <Copy size={14} /> Duplicate
          </button>
          <button type="button" role="menuitem" className={ITEM} onClick={choose(onExport)}>
            <Download size={14} /> Export file
          </button>
          <button type="button" role="menuitem" className={cn(ITEM, "text-red-600")} onClick={choose(onDelete)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
