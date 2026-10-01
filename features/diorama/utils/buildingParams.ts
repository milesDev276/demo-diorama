import { BUILDING_SIDES, FACADE_KINDS, ROOF_KINDS } from "../types/diorama.types";
import type { BuildingFloor, BuildingParams, BuildingSide, FacadeKind, RoofKind } from "../types/diorama.types";

/** The building module grid in meters (roadmap L6). art/blender/lib/facade.py holds the same numbers. */
export const BUILDING_GRID = {
  bay: 1.82,
  groundFloor: 3.2,
  upperFloor: 2.8,
  foundation: 0.4,
  parapet: 1.1,
  wall: 0.15,
} as const;

export const BUILDING_LIMITS = { minBays: 1, maxBays: 6, minFloors: 1, maxFloors: 4 } as const;

const clampInt = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

/** How many bays a side has: front and back follow X, right and left follow Z. */
export function sideBayCount(size: Pick<BuildingParams, "baysX" | "baysZ">, side: BuildingSide): number {
  return side === "front" || side === "back" ? size.baysX : size.baysZ;
}

/** The facade kinds a floor can have. Shopfronts and entrances open onto the street; balconies need a floor below. */
export function facadeOptions(floorIndex: number): FacadeKind[] {
  return floorIndex === 0 ? ["blank", "windows", "shopfront", "entrance"] : ["blank", "windows", "balcony"];
}

function fitKind(kind: unknown, floorIndex: number): FacadeKind {
  if (!(FACADE_KINDS as readonly unknown[]).includes(kind)) return "blank";
  return facadeOptions(floorIndex).includes(kind as FacadeKind) ? (kind as FacadeKind) : "windows";
}

/** Fits a side to `count` bays; added bays repeat the last one. */
function fitBays(bays: unknown, count: number, floorIndex: number): FacadeKind[] {
  const source = Array.isArray(bays) ? bays : [];
  return Array.from({ length: count }, (_, i) =>
    fitKind(source.length ? source[Math.min(i, source.length - 1)] : "blank", floorIndex)
  );
}

function fitFloor(floor: unknown, size: Pick<BuildingParams, "baysX" | "baysZ">, floorIndex: number): BuildingFloor {
  const source = floor && typeof floor === "object" ? (floor as Record<string, unknown>) : {};
  return Object.fromEntries(
    BUILDING_SIDES.map((side) => [side, fitBays(source[side], sideBayCount(size, side), floorIndex)])
  ) as BuildingFloor;
}

/** A floor with one facade kind per side. */
export function uniformFloor(
  size: Pick<BuildingParams, "baysX" | "baysZ">,
  kinds: Record<BuildingSide, FacadeKind>
): BuildingFloor {
  return Object.fromEntries(
    BUILDING_SIDES.map((side) => [side, Array<FacadeKind>(sideBayCount(size, side)).fill(kinds[side])])
  ) as BuildingFloor;
}

/**
 * Turns anything into valid building params: bay and floor counts clamped,
 * every side resized to its bay count, unknown or misplaced facade kinds
 * replaced. Returns null if `raw` is not an object at all.
 */
export function normalizeBuildingParams(raw: unknown): BuildingParams | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const { minBays, maxBays, minFloors, maxFloors } = BUILDING_LIMITS;
  const size = { baysX: clampInt(r.baysX, minBays, maxBays, 3), baysZ: clampInt(r.baysZ, minBays, maxBays, 2) };
  const rawFloors = Array.isArray(r.floors) ? r.floors.slice(0, maxFloors) : [];
  const count = Math.max(minFloors, rawFloors.length);
  const floors = Array.from({ length: count }, (_, i) => fitFloor(rawFloors[i], size, i));
  const roof = (ROOF_KINDS as readonly unknown[]).includes(r.roof) ? (r.roof as RoofKind) : "flat-rooftop";
  return { ...size, floors, roof };
}

/** Changes the bay or floor counts. A new floor repeats the one below it. */
export function resizeBuilding(
  params: BuildingParams,
  next: Partial<{ baysX: number; baysZ: number; floors: number }>
): BuildingParams {
  const { minFloors, maxFloors } = BUILDING_LIMITS;
  const count = clampInt(next.floors ?? params.floors.length, minFloors, maxFloors, params.floors.length);
  const floors = Array.from({ length: count }, (_, i) => params.floors[Math.min(i, params.floors.length - 1)]);
  return normalizeBuildingParams({ ...params, ...next, floors }) ?? params;
}

/** Sets every bay of one side of one floor. */
export function setSideFacade(
  params: BuildingParams,
  floorIndex: number,
  side: BuildingSide,
  kind: FacadeKind
): BuildingParams {
  const floors = params.floors.map((floor, i) =>
    i === floorIndex ? { ...floor, [side]: Array<FacadeKind>(floor[side].length).fill(kind) } : floor
  );
  return { ...params, floors };
}

/** The facade kind of a whole side, or "mixed" if its bays differ. */
export function sideFacade(floor: BuildingFloor, side: BuildingSide): FacadeKind | "mixed" {
  const bays = floor[side];
  return bays.every((kind) => kind === bays[0]) ? bays[0] : "mixed";
}

/** Footprint and heights in meters. `wallHeight` is where the roof starts. */
export function buildingSize(params: BuildingParams): { width: number; depth: number; wallHeight: number } {
  return {
    width: params.baysX * BUILDING_GRID.bay,
    depth: params.baysZ * BUILDING_GRID.bay,
    wallHeight: BUILDING_GRID.groundFloor + (params.floors.length - 1) * BUILDING_GRID.upperFloor,
  };
}
