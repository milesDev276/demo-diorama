"use client";

import { PLINTH_STYLES, type PlinthStyle } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { PLOT_SIZES, SURFACE_LAYOUT_ORDER, surfaceLayoutLabel } from "../utils/surfaceMap";
import { SegmentedControl } from "./SegmentedControl";

const PLINTH_LABELS: Record<PlinthStyle, string> = { dark: "Dark", wood: "Wood", earth: "Earth" };
const PLINTH_OPTIONS = PLINTH_STYLES.map((value) => ({ value, label: PLINTH_LABELS[value] }));
const SIZE_OPTIONS = PLOT_SIZES.map(({ id, label }) => ({ value: id, label }));

const TITLE = "text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40";
const HINT = "text-xs text-[#4A3421]/50";

/**
 * What the diorama stands on, below the base switch of the Scene panel: on
 * a plot its size and a starting layout for the ground; on a plot and on
 * the corner the finish of the platform. The street strip has neither.
 */
export function GroundPanel() {
  const base = useDioramaStore((s) => s.environment.base);
  const plinth = useDioramaStore((s) => s.environment.plinth);
  const surface = useDioramaStore((s) => s.environment.surface);
  const setPlinth = useDioramaStore((s) => s.setPlinth);
  const resizePlot = useDioramaStore((s) => s.resizePlot);
  const applySurfaceLayout = useDioramaStore((s) => s.applySurfaceLayout);
  if (base === "street") return null;

  const size = surface && PLOT_SIZES.find((option) => option.cols === surface.cols && option.rows === surface.rows.length);

  return (
    <>
      {base === "plot" && surface && (
        <div className="flex flex-col gap-2">
          <p className={TITLE}>Ground</p>
          <SegmentedControl
            label="Plot size"
            options={SIZE_OPTIONS}
            value={size?.id ?? ""}
            onChange={(id) => {
              const next = PLOT_SIZES.find((option) => option.id === id);
              if (next) resizePlot(next.cols, next.rows);
            }}
          />
          <div className="grid grid-cols-2 gap-1.5">
            {SURFACE_LAYOUT_ORDER.map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => applySurfaceLayout(layout)}
                className="rounded-xl border border-[#8b6f52]/15 bg-white/50 px-2 py-1.5 text-xs font-medium text-[#4A3421] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
              >
                {surfaceLayoutLabel(layout)}
              </button>
            ))}
          </div>
          <p className={HINT}>
            A layout replaces the whole ground (Ctrl+Z brings it back). To paint, pick a ground material in the library.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className={TITLE}>Platform</p>
        <SegmentedControl label="Platform" options={PLINTH_OPTIONS} value={plinth} onChange={setPlinth} />
        {plinth === "wood" && <p className={HINT}>The brass plate shows the Diorama&apos;s name.</p>}
      </div>
    </>
  );
}
