"use client";

import { useDioramaStore } from "../store/dioramaStore";
import { CornerBase } from "../objects/ground/CornerBase";
import { PlotBase } from "../objects/ground/PlotBase";
import { StreetBase } from "../objects/ground/StreetBase";

/**
 * The diorama's miniature base, chosen per scene (`environment.base`), on
 * the scene's platform. It reads the scene itself, so painting the ground
 * re-renders this component and nothing else in the canvas.
 * `blockout` forces the plain corner base under the dev blockout.
 */
export function Ground({ blockout = false }: { blockout?: boolean }) {
  const base = useDioramaStore((s) => s.environment.base);
  const surface = useDioramaStore((s) => s.environment.surface);
  const plinth = useDioramaStore((s) => s.environment.plinth);
  if (blockout) return <CornerBase />;
  if (base === "plot" && surface) return <PlotBase surface={surface} plinth={plinth} />;
  return base === "corner" ? <CornerBase plinth={plinth} /> : <StreetBase />;
}
