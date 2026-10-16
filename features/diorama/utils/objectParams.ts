import type { BuildingParams, DioramaObject, RunParams, ScatterParams } from "../types/diorama.types";
import { isRunType } from "./runParams";

/**
 * Typed readers for `DioramaObject.params`, whose shape depends on the
 * object's type. Code reads params through these instead of casting.
 */

type WithParams = Pick<DioramaObject, "type" | "params">;

/** The params of a `building`, or undefined for anything else. */
export function buildingParamsOf(object: WithParams): BuildingParams | undefined {
  return object.type === "building" ? (object.params as BuildingParams | undefined) : undefined;
}

/** The params of a `scatter` layer, or undefined for anything else. */
export function scatterParamsOf(object: WithParams): ScatterParams | undefined {
  return object.type === "scatter" ? (object.params as ScatterParams | undefined) : undefined;
}

/** The params of a run (a wall, a fence, a rail, a hedge), or undefined for anything else. */
export function runParamsOf(object: WithParams): RunParams | undefined {
  return isRunType(object.type) ? (object.params as RunParams | undefined) : undefined;
}

/** How many pieces an object is: a run's count, 1 for everything else. */
export function runPiecesOf(object: WithParams): number {
  return runParamsOf(object)?.pieces ?? 1;
}
