"use client";

import { Minus, Plus } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { BUILDING_SIDES, ROOF_KINDS } from "../types/diorama.types";
import type { BuildingParams, DioramaObject, FacadeKind, RoofKind } from "../types/diorama.types";
import { DEFAULT_BUILDING_PARAMS } from "../assets/buildingPresets";
import {
  BUILDING_LIMITS,
  buildingSize,
  facadeOptions,
  resizeBuilding,
  setSideFacade,
  sideFacade,
} from "../utils/buildingParams";
import { buildingParamsOf } from "../utils/objectParams";

const FACADE_LABELS: Record<FacadeKind, string> = {
  blank: "Wall",
  windows: "Windows",
  shopfront: "Shopfront",
  balcony: "Balcony",
  entrance: "Entrance",
};

const ROOF_LABELS: Record<RoofKind, string> = {
  "flat-rooftop": "Flat rooftop",
  "hipped-tile": "Tiled, hipped",
  shed: "Single slope",
};

const SELECT_CLASS =
  "w-full rounded-lg border border-[#8b6f52]/15 bg-white/60 px-2 py-1.5 text-xs text-[#4A3421] outline-none transition-colors focus:border-[#F0B27A] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50";

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onStep: (step: 1 | -1) => void;
}

function Stepper({ label, value, min, max, disabled, onStep }: StepperProps) {
  const button = (delta: 1 | -1, Icon: typeof Plus, name: string) => (
    <button
      type="button"
      aria-label={`${name} ${label.toLowerCase()}`}
      disabled={disabled || value + delta < min || value + delta > max}
      onClick={() => onStep(delta)}
      className="rounded-md p-1 text-[#4A3421]/70 transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
    >
      <Icon size={13} />
    </button>
  );
  return (
    <div className="flex items-center justify-between text-sm text-[#4A3421]">
      <span className="text-xs font-medium">{label}</span>
      <div className="flex items-center gap-1 rounded-lg bg-[#4A3421]/5 p-0.5">
        {button(-1, Minus, "Fewer")}
        <span className="w-5 text-center text-xs font-semibold tabular-nums">{value}</span>
        {button(1, Plus, "More")}
      </div>
    </div>
  );
}

/**
 * Inspector section for a building: bays, floors, the facade of each side
 * per floor, and the roof. Every change is one undo step. A side whose bays
 * differ (as in a preset) shows "Mixed" until one kind is chosen for it.
 */
export function BuildingPanel({ object }: { object: DioramaObject }) {
  const setBuildingParams = useDioramaStore((s) => s.setBuildingParams);
  const params = buildingParamsOf(object) ?? DEFAULT_BUILDING_PARAMS;
  const { width, depth, wallHeight } = buildingSize(params);
  const { minBays, maxBays, minFloors, maxFloors } = BUILDING_LIMITS;
  const disabled = object.locked;
  // Updates are functions of the stored params, so two quick clicks never build on a stale render.
  const apply = (update: (current: BuildingParams) => BuildingParams) => setBuildingParams(object.id, update);

  return (
    <div className="flex flex-col gap-3 border-t border-[#8b6f52]/10 pt-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">Building</p>
        <p className="text-[11px] text-[#4A3421]/40">
          {width.toFixed(1)} × {depth.toFixed(1)} × {wallHeight.toFixed(1)} m
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Stepper
          label="Bays wide"
          value={params.baysX}
          min={minBays}
          max={maxBays}
          disabled={disabled}
          onStep={(step) => apply((p) => resizeBuilding(p, { baysX: p.baysX + step }))}
        />
        <Stepper
          label="Bays deep"
          value={params.baysZ}
          min={minBays}
          max={maxBays}
          disabled={disabled}
          onStep={(step) => apply((p) => resizeBuilding(p, { baysZ: p.baysZ + step }))}
        />
        <Stepper
          label="Floors"
          value={params.floors.length}
          min={minFloors}
          max={maxFloors}
          disabled={disabled}
          onStep={(step) => apply((p) => resizeBuilding(p, { floors: p.floors.length + step }))}
        />
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-[#4A3421]">
        Roof
        <select
          value={params.roof}
          disabled={disabled}
          onChange={(event) => {
            const roof = event.target.value as RoofKind;
            apply((p) => ({ ...p, roof }));
          }}
          className={SELECT_CLASS}
        >
          {ROOF_KINDS.map((roof) => (
            <option key={roof} value={roof}>
              {ROOF_LABELS[roof]}
            </option>
          ))}
        </select>
      </label>

      {/* Top floor first, like the building itself */}
      {params.floors
        .map((floor, floorIndex) => (
          <fieldset key={floorIndex} className="flex flex-col gap-1.5">
            <legend className="mb-1 text-xs font-medium text-[#4A3421]">Floor {floorIndex + 1}</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {BUILDING_SIDES.map((side) => {
                const current = sideFacade(floor, side);
                return (
                  <label key={side} className="flex flex-col gap-0.5 text-[11px] capitalize text-[#4A3421]/50">
                    {side}
                    <select
                      value={current}
                      disabled={disabled}
                      onChange={(event) => {
                        const kind = event.target.value as FacadeKind;
                        apply((p) => setSideFacade(p, floorIndex, side, kind));
                      }}
                      className={SELECT_CLASS}
                    >
                      {current === "mixed" && (
                        <option value="mixed" disabled>
                          Mixed
                        </option>
                      )}
                      {facadeOptions(floorIndex).map((kind) => (
                        <option key={kind} value={kind}>
                          {FACADE_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))
        .reverse()}
    </div>
  );
}
