import type { BuildingParams, DioramaObject, ScatterParams } from "../types/diorama.types";

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
