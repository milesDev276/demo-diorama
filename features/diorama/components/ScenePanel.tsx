"use client";

import { useDioramaStore } from "../store/dioramaStore";
import { BASE_ORDER, BASE_TEMPLATES } from "../utils/baseTemplates";
import { SEASON_OPTIONS, timeOfDayOptions } from "../utils/environmentOptions";
import { SegmentedControl } from "./SegmentedControl";

const BASE_OPTIONS = BASE_ORDER.map((value) => ({ value, label: BASE_TEMPLATES[value].label }));
const TIME_OPTIONS = timeOfDayOptions(true);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">{title}</p>
      {children}
    </div>
  );
}

/**
 * Scene-level settings, shown in the inspector while nothing is selected:
 * the light the Diorama is seen in, its season, and the base it stands on.
 */
export function ScenePanel() {
  const { base, timeOfDay, season } = useDioramaStore((s) => s.environment);
  const setBase = useDioramaStore((s) => s.setBase);
  const setTimeOfDay = useDioramaStore((s) => s.setTimeOfDay);
  const setSeason = useDioramaStore((s) => s.setSeason);

  return (
    <div className="flex flex-col gap-5">
      <Section title="Time of day">
        <SegmentedControl label="Time of day" options={TIME_OPTIONS} value={timeOfDay} onChange={setTimeOfDay} />
      </Section>

      <Section title="Season">
        <SegmentedControl label="Season" options={SEASON_OPTIONS} value={season} onChange={setSeason} />
        <p className="text-xs text-[#4A3421]/50">Changes leafy trees, fallen leaves and grass.</p>
      </Section>

      <Section title="Scene base">
        <SegmentedControl label="Scene base" options={BASE_OPTIONS} value={base} onChange={setBase} />
        <p className="text-xs text-[#4A3421]/50">
          {BASE_TEMPLATES[base].description} Switching keeps every object where it is.
        </p>
      </Section>
    </div>
  );
}
