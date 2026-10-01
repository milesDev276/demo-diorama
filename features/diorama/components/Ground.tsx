import type { DioramaBase } from "../types/diorama.types";
import { CornerBase } from "../objects/ground/CornerBase";
import { StreetBase } from "../objects/ground/StreetBase";

/** The diorama's miniature base, chosen per scene (`environment.base`). */
export function Ground({ base }: { base: DioramaBase }) {
  return base === "corner" ? <CornerBase /> : <StreetBase />;
}
