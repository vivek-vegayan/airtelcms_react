import type { Crq } from "../../../types/crqWorkflow.types";
import type { AttributeUpdateCrqContext } from "../types/attributeUpdate.types";

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length ? value : null;

/**
 * Captures the header context for the dialog from the selected CRQ row.
 * Deliberately its own file, decoupled from attributeUpdate.utils.ts (which
 * pulls in the full attribute field catalog): this is the one utils
 * function the eager "Attribute Update" button needs before the dialog
 * itself is lazy-loaded, so it must not drag the catalog into the initial
 * bundle along with it.
 */
export function buildAttributeCrqContext(crq: Crq): AttributeUpdateCrqContext {
  const requester =
    [crq.firstName, crq.lastName].filter(Boolean).join(" ") ||
    asText(crq.managerChange) ||
    "—";

  return {
    crqNo: crq.crqNo,
    crqId: typeof crq.crqId === "number" ? crq.crqId : null,
    requester,
    circle:
      asText(crq["workAreaTerritory"]) ?? asText(crq.locationCodeM6) ?? "—",
    vendor: asText(crq.vendor) ?? "—",
    domain:
      asText(crq.categorizationTier_2) ?? asText(crq.categorizationTier_1) ?? "—",
  };
}
