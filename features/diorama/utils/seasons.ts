import type { ScatterKind, Season, Vector3Tuple } from "../types/diorama.types";

/**
 * What a season changes. Assets are modeled in autumn, so autumn changes
 * nothing; the other seasons recolor deciduous crowns (the `foliage`
 * material slot), tint scatter pieces and decide whether fallen leaves lie
 * around. Evergreens — hedges, potted plants — are left alone.
 */
export interface SeasonLook {
  label: string;
  /** Deciduous crowns: recolored toward `color` by `amount`, or bare branches when null. */
  foliage: { color: string; amount: number } | null;
  /** Multiplier on a scatter kind's colors (linear RGB); a kind set to null is not drawn. */
  scatter: Record<ScatterKind, Vector3Tuple | null>;
}

const UNCHANGED: Vector3Tuple = [1, 1, 1];

export const SEASON_LOOKS: Record<Season, SeasonLook> = {
  spring: {
    label: "Spring",
    foliage: { color: "#9cc46a", amount: 1 },
    scatter: { leaves: null, grass: [1.06, 1.1, 0.82], pebbles: UNCHANGED, weeds: [1.04, 1.08, 0.9] },
  },
  summer: {
    label: "Summer",
    foliage: { color: "#5f8f4a", amount: 1 },
    scatter: { leaves: null, grass: UNCHANGED, pebbles: UNCHANGED, weeds: UNCHANGED },
  },
  autumn: {
    label: "Autumn",
    foliage: { color: "#ffffff", amount: 0 },
    scatter: { leaves: UNCHANGED, grass: UNCHANGED, pebbles: UNCHANGED, weeds: UNCHANGED },
  },
  winter: {
    label: "Winter",
    foliage: null,
    // Leaves that are still around have gone brown; grass and weeds are dry straw.
    scatter: { leaves: [0.62, 0.52, 0.46], grass: [1.5, 1.02, 0.62], pebbles: UNCHANGED, weeds: [1.3, 0.98, 0.7] },
  },
};

export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];
