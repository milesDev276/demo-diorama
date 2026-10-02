import { Flower2, Gem, Leaf, Sprout, type LucideIcon } from "lucide-react";
import type { ScatterKind } from "../types/diorama.types";

/** "What is this scatter?" — shared by every layer of a kind. */
export interface ScatterKindSpec {
  kind: ScatterKind;
  label: string;
  icon: LucideIcon;
  /** One piece, built by art/blender (meters, origin on the ground). */
  modelUrl: string;
  /** Closest distance between two pieces at full brush density, in meters. */
  spacing: number;
  /** Per-piece size range, as a factor of the modeled size. */
  scale: [number, number];
  /** Flat pieces gain nothing from casting shadows; upright ones do. */
  castShadow: boolean;
  tags: string[];
}

export const SCATTER_KIND_SPECS: Record<ScatterKind, ScatterKindSpec> = {
  leaves: {
    kind: "leaves",
    label: "Fallen Leaves",
    icon: Leaf,
    modelUrl: "/models/nature/nature_scatter_leaves_01.glb",
    spacing: 0.22,
    scale: [0.8, 1.2],
    castShadow: false,
    tags: ["leaves", "autumn", "ochiba", "ginkgo", "scatter", "brush"],
  },
  grass: {
    kind: "grass",
    label: "Grass Tufts",
    icon: Sprout,
    modelUrl: "/models/nature/nature_scatter_grass_01.glb",
    spacing: 0.24,
    scale: [0.75, 1.25],
    castShadow: true,
    tags: ["grass", "tuft", "green", "scatter", "brush"],
  },
  pebbles: {
    kind: "pebbles",
    label: "Pebbles",
    icon: Gem,
    modelUrl: "/models/nature/nature_scatter_pebbles_01.glb",
    spacing: 0.26,
    scale: [0.75, 1.25],
    castShadow: true,
    tags: ["pebbles", "stones", "gravel", "scatter", "brush"],
  },
  weeds: {
    kind: "weeds",
    label: "Weeds",
    icon: Flower2,
    modelUrl: "/models/nature/nature_scatter_weeds_01.glb",
    spacing: 0.3,
    scale: [0.8, 1.25],
    castShadow: true,
    tags: ["weeds", "zasso", "dandelion", "plants", "scatter", "brush"],
  },
};
