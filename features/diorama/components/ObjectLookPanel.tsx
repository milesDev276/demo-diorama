"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { ASSET_REGISTRY } from "../assets/assetRegistry";
import { swatchHex } from "../assets/paintSwatches";
import { SIGN_TEXTS } from "../objects/textures/graphicsAtlas";
import { useDioramaStore } from "../store/dioramaStore";
import type { DioramaObject } from "../types/diorama.types";
import { paintOf } from "../utils/objectLook";

const SECTION_TITLE = "text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40";

/** Arrow keys that move through the swatches, and which way. */
const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** The paint region's swatches: a radio group, the modeled color first. One undo step per pick. */
function ColorSection({ object }: { object: DioramaObject }) {
  const setObjectColor = useDioramaStore((s) => s.setObjectColor);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const paint = ASSET_REGISTRY[object.type].paint;
  if (!paint) return null;
  const current = paintOf(object);
  // -1 for a color that is no swatch (a file may hold any hex): then none is checked.
  const selected = paint.swatches.findIndex((swatch) => swatchHex(swatch) === current);

  const pick = (index: number) => setObjectColor(object.id, index === 0 ? null : swatchHex(paint.swatches[index]));

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + paint.swatches.length) % paint.swatches.length;
    pick(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-2 border-t border-[#8b6f52]/10 pt-4">
      <div className="flex items-baseline justify-between">
        <p className={SECTION_TITLE}>{paint.label}</p>
        <p className="text-[11px] text-[#4A3421]/45">
          {selected < 0 ? "Custom" : paint.swatches[selected].name}
          {selected === 0 && " · Default"}
        </p>
      </div>
      <div role="radiogroup" aria-label={paint.label} className="flex flex-wrap gap-2">
        {paint.swatches.map((swatch, i) => {
          const hex = swatchHex(swatch);
          const checked = i === selected;
          return (
            <button
              key={swatch.key}
              ref={(button) => {
                buttons.current[i] = button;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={i === 0 ? `${swatch.name} (default)` : swatch.name}
              title={i === 0 ? `${swatch.name} (default)` : swatch.name}
              tabIndex={checked || (selected < 0 && i === 0) ? 0 : -1}
              onClick={() => pick(i)}
              onKeyDown={(event) => onKeyDown(event, i)}
              className={cn(
                "relative flex size-7 items-center justify-center rounded-full border border-[#4A3421]/15 shadow-inner transition-shadow cursor-pointer",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0B27A]",
                checked && "ring-2 ring-[#4A3421]/60 ring-offset-2 ring-offset-[#FDF6EC]"
              )}
              style={{ backgroundColor: hex }}
            >
              {checked && <Check size={13} strokeWidth={3} aria-hidden className={isLight(hex) ? "text-[#4A3421]/70" : "text-white/85"} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Whether dark marks read better than light ones on `hex`. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}

/** The sign's text: applied on Enter or when the field loses focus, never in the middle of IME composition. */
function SignSection({ object }: { object: DioramaObject }) {
  const setObjectText = useDioramaStore((s) => s.setObjectText);
  const sign = ASSET_REGISTRY[object.type].sign;
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(object.text ?? "");
  // A new text from elsewhere (undo, Reset, a commit) starts a fresh draft. Adjusted
  // during render rather than by remounting, so the field keeps focus after Enter.
  const [shown, setShown] = useState(object.text);
  if (object.text !== shown) {
    setShown(object.text);
    setDraft(object.text ?? "");
  }
  if (!sign) return null;
  const fallback = SIGN_TEXTS[sign.cell];
  const id = `sign-text-${object.id}`;

  const apply = () => {
    if (draft.trim() !== (object.text ?? "")) setObjectText(object.id, draft);
  };
  // The limit counts characters (code points), like the counter and the stored text,
  // not UTF-16 units as the input's maxLength would. Not cut mid-composition.
  const clip = (value: string) => Array.from(value).slice(0, sign.maxLength).join("");

  return (
    <div className="flex flex-col gap-2 border-t border-[#8b6f52]/10 pt-4">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className={SECTION_TITLE}>
          {sign.label}
        </label>
        <p className="text-[11px] tabular-nums text-[#4A3421]/40" aria-live="polite">
          {Array.from(draft).length}/{sign.maxLength}
        </p>
      </div>
      <input
        ref={input}
        id={id}
        type="text"
        value={draft}
        placeholder={fallback}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          const value = event.target.value;
          setDraft((event.nativeEvent as InputEvent).isComposing ? value : clip(value));
        }}
        onCompositionEnd={(event) => setDraft(clip(event.currentTarget.value))}
        onBlur={apply}
        onKeyDown={(event) => {
          // Enter also ends an IME composition; that one only confirms the characters.
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          event.preventDefault();
          apply();
        }}
        className="w-full rounded-lg border border-[#8b6f52]/15 bg-white/60 px-2.5 py-1.5 text-sm text-[#4A3421] outline-none transition-colors placeholder:text-[#4A3421]/35 focus:border-[#F0B27A] focus:bg-white"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-[#4A3421]/45">Enter to apply. Empty shows the default.</p>
        {object.text && (
          <button
            type="button"
            onClick={() => {
              setObjectText(object.id, null);
              // The button goes away with the custom text; keep the keyboard in the field.
              input.current?.focus();
            }}
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#4A3421]/60 transition-colors hover:bg-white hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
          >
            <RotateCcw size={11} aria-hidden />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inspector sections for what makes one placed object look different from
 * another of its kind: the color of its paint region and the text of its
 * sign (registry `paint`, `sign`). Lock does not apply: it only stops moving,
 * turning and scaling.
 */
export function ObjectLookPanel({ object }: { object: DioramaObject }) {
  return (
    <>
      <ColorSection object={object} />
      {/* Another object starts a fresh field. */}
      <SignSection key={object.id} object={object} />
    </>
  );
}
