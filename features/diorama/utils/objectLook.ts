import { ASSET_REGISTRY } from "../assets/assetRegistry";
import { swatchHex } from "../assets/paintSwatches";
import { SIGN_TEXTS, type SignCell } from "../objects/textures/graphicsAtlas";
import type { DioramaObject, DioramaObjectType } from "../types/diorama.types";

const HEX_COLOR = /^#[0-9a-f]{6}$/;
// Control characters, line breaks included: a sign is one line.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

/** The color an asset's paint region was modeled in, or undefined if it has none. */
export function defaultPaintOf(type: DioramaObjectType): string | undefined {
  const paint = ASSET_REGISTRY[type].paint;
  return paint && swatchHex(paint.swatches[0]);
}

/**
 * `raw` as the `color` of an object of `type`: a "#rrggbb" on an asset with a
 * paint region, other than the color it was modeled in. Anything else is
 * undefined, which means that default.
 */
export function normalizeObjectColor(type: DioramaObjectType, raw: unknown): string | undefined {
  const fallback = defaultPaintOf(type);
  if (!fallback || typeof raw !== "string") return undefined;
  const hex = raw.trim().toLowerCase();
  return HEX_COLOR.test(hex) && hex !== fallback ? hex : undefined;
}

/**
 * `raw` as the `text` of an object of `type`: one line, trimmed, at most the
 * sign's `maxLength` characters, on an asset with a sign. Empty text and the
 * sign's own text are undefined, which means that default.
 */
export function normalizeObjectText(type: DioramaObjectType, raw: unknown): string | undefined {
  const sign = ASSET_REGISTRY[type].sign;
  if (!sign || typeof raw !== "string") return undefined;
  const text = Array.from(raw.replace(CONTROL_CHARACTERS, "").trim()).slice(0, sign.maxLength).join("").trim();
  return text && text !== SIGN_TEXTS[sign.cell] ? text : undefined;
}

/** The color to draw an object's paint region in; undefined for assets without one. */
export function paintOf(object: Pick<DioramaObject, "type" | "color">): string | undefined {
  return defaultPaintOf(object.type) && (object.color ?? defaultPaintOf(object.type));
}

/** What an object's sign says, when that is not the sign's own text. */
export function customSignOf(object: Pick<DioramaObject, "type" | "text">): { cell: SignCell; text: string } | undefined {
  const sign = ASSET_REGISTRY[object.type].sign;
  return sign && object.text ? { cell: sign.cell, text: object.text } : undefined;
}
