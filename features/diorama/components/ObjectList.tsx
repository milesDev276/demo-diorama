"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDioramaStore } from "../store/dioramaStore";
import { objectIcon, objectLabel } from "../assets/assetRegistry";
import { scatterParamsOf } from "../utils/objectParams";
import { groupChildren } from "../utils/sceneGraph";

/** Row backgrounds are opaque, so the action strip laid over a row's end can match it exactly. */
const ROW_SELECTED = "bg-[#F8E6D5]";
const ROW_HOVER = "hover:bg-[#FDFBF8]";

const actionButton =
  "shrink-0 rounded-md p-1 transition-colors focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer";

/**
 * The scene object list: every object in the Diorama, selectable, with
 * visibility/lock/delete controls. Objects attached to a building are
 * listed indented under it. Click a row to select it, shift-click to
 * add/remove it from the current selection. While the list is open, the
 * selected row is scrolled into view, wherever the selection was made.
 *
 * The name takes the whole row; the controls appear over its end while the
 * row is hovered, holds the focus or is selected, and a hidden or locked
 * object keeps a small mark there (plan/Stage-21-Implementation.md D6).
 * The list is one Tab stop: ↑/↓ move between rows, Enter or Space selects,
 * Shift+Enter adds to the selection, Tab reaches the row's controls.
 */
export function ObjectList() {
  const objects = useDioramaStore((s) => s.objects);
  const selectedObjectIds = useDioramaStore((s) => s.selectedObjectIds);
  const selectObject = useDioramaStore((s) => s.selectObject);
  const toggleObjectSelection = useDioramaStore((s) => s.toggleObjectSelection);
  const setObjectVisibility = useDioramaStore((s) => s.setObjectVisibility);
  const setObjectLocked = useDioramaStore((s) => s.setObjectLocked);
  const removeObject = useDioramaStore((s) => s.removeObject);
  const isOpen = useDioramaStore((s) => s.leftTab === "objects");
  const listRef = useRef<HTMLUListElement>(null);
  // The row that holds the list's one Tab stop.
  const [activeId, setActiveId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const childrenByParent = groupChildren(objects);
    return objects
      .filter((object) => !object.parentId)
      .flatMap((object) => [object, ...(childrenByParent.get(object.id) ?? [])]);
  }, [objects]);

  const firstSelected = selectedObjectIds[0];
  // The Tab stop: the row last moved to, while it exists; else the selection; else the first row.
  const tabStopId =
    (activeId && rows.some((o) => o.id === activeId) ? activeId : null) ??
    (firstSelected && rows.some((o) => o.id === firstSelected) ? firstSelected : rows[0]?.id);

  useEffect(() => {
    if (!isOpen || !firstSelected) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-object-id="${CSS.escape(firstSelected)}"]`);
    const panel = row?.closest<HTMLElement>("[role=tabpanel]");
    if (!row || !panel) return;
    const top = row.getBoundingClientRect().top - panel.getBoundingClientRect().top;
    if (top < 0) panel.scrollTop += top;
    else if (top + row.offsetHeight > panel.clientHeight) panel.scrollTop += top + row.offsetHeight - panel.clientHeight;
  }, [isOpen, firstSelected]);

  const focusRow = (index: number) => {
    const object = rows[Math.min(Math.max(index, 0), rows.length - 1)];
    if (!object) return;
    setActiveId(object.id);
    listRef.current?.querySelector<HTMLElement>(`[data-object-id="${CSS.escape(object.id)}"] [data-row-main]`)?.focus();
  };

  const handleRowKeyDown = (event: React.KeyboardEvent, index: number, id: string) => {
    if (event.key === "ArrowDown") focusRow(index + 1);
    else if (event.key === "ArrowUp") focusRow(index - 1);
    else if (event.key === "Home") focusRow(0);
    else if (event.key === "End") focusRow(rows.length - 1);
    else if (event.key === "Enter" && event.shiftKey) toggleObjectSelection(id);
    else return;
    event.preventDefault();
  };

  if (objects.length === 0) return <p className="py-6 text-center text-xs text-[#4A3421]/40">No objects yet.</p>;

  return (
    <ul ref={listRef} aria-label="Objects in the scene" className="flex flex-col gap-1">
      {rows.map((object, index) => {
        const Icon = objectIcon(object);
        const label = objectLabel(object);
        const pieces = scatterParamsOf(object)?.points.length;
        const isSelected = selectedObjectIds.includes(object.id);
        const isTabStop = object.id === tabStopId;
        return (
          <li
            key={object.id}
            data-object-id={object.id}
            className={cn(
              "group relative flex items-center rounded-xl text-sm transition-colors",
              object.parentId && "ml-4",
              isSelected ? `${ROW_SELECTED} text-[#4A3421]` : `text-[#4A3421]/80 ${ROW_HOVER}`
            )}
          >
            <button
              type="button"
              data-row-main
              tabIndex={isTabStop ? 0 : -1}
              aria-pressed={isSelected}
              title={pieces !== undefined ? `${label} (${pieces} pieces)` : label}
              onFocus={() => setActiveId(object.id)}
              onClick={(event) => {
                if (event.shiftKey) toggleObjectSelection(object.id);
                else selectObject(object.id);
              }}
              onKeyDown={(event) => handleRowKeyDown(event, index, object.id)}
              className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl px-2.5 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#F0B27A] cursor-pointer"
            >
              <Icon size={14} className={cn("shrink-0", !object.visible && "opacity-40")} aria-hidden />
              <span className={cn("min-w-0 flex-1 truncate", !object.visible && "italic opacity-50")}>
                {label}
                {pieces !== undefined && <span className="ml-1 text-[11px] tabular-nums text-[#4A3421]/40">{pieces}</span>}
              </span>
              {/* What stays visible without hover: hidden and locked. */}
              {!object.visible && <EyeOff size={11} className="shrink-0 text-[#4A3421]/40" aria-label="Hidden" />}
              {object.locked && <Lock size={11} className="shrink-0 text-[#4A3421]/40" aria-label="Locked" />}
            </button>

            <div
              className={cn(
                "absolute inset-y-0 right-0 flex items-center gap-0.5 rounded-r-xl pl-5 pr-1.5 transition-opacity",
                isSelected
                  ? "bg-[linear-gradient(to_right,transparent,#F8E6D5_1.25rem)] opacity-100"
                  : "bg-[linear-gradient(to_right,transparent,#FDFBF8_1.25rem)] opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
              )}
            >
              <button
                type="button"
                tabIndex={isTabStop ? 0 : -1}
                onClick={() => setObjectVisibility(object.id, !object.visible)}
                className={cn(actionButton, "text-[#4A3421]/50 hover:bg-white hover:text-[#4A3421]")}
                aria-label={object.visible ? `Hide ${label}` : `Show ${label}`}
              >
                {object.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button
                type="button"
                tabIndex={isTabStop ? 0 : -1}
                onClick={() => setObjectLocked(object.id, !object.locked)}
                className={cn(actionButton, "text-[#4A3421]/50 hover:bg-white hover:text-[#4A3421]")}
                aria-label={object.locked ? `Unlock ${label}` : `Lock ${label}`}
              >
                {object.locked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>
              <button
                type="button"
                tabIndex={isTabStop ? 0 : -1}
                onClick={() => removeObject(object.id)}
                className={cn(actionButton, "text-red-400 hover:bg-red-50")}
                aria-label={`Delete ${label}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
