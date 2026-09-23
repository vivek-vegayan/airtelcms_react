import { format, parseISO } from "date-fns";
import {
  STAGE_ENUM_TO_ID,
  WORKFLOW_STAGES,
} from "../../constants/workflowStages";

/**
 * Display helpers for the Cancelled CRQ registry.
 *
 * Stage labels come from WORKFLOW_STAGES via STAGE_ENUM_TO_ID rather than a
 * local map, so this screen names a stage exactly as the workflow cockpit
 * does and cannot drift from it when a stage is relabelled.
 */

/** "MOP_VALIDATION" -> "MOP Validate". Unknown values are humanised, not dropped. */
export const stageLabel = (stageEnum: string | null | undefined): string => {
  if (!stageEnum) return "—";
  const id = STAGE_ENUM_TO_ID[stageEnum];
  const descriptor = id && WORKFLOW_STAGES.find((s) => s.id === id);
  if (descriptor) return descriptor.label;
  return stageEnum
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/** Backend LocalDateTime strings are ISO without a zone; render them as local wall time. */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy, HH:mm");
  } catch {
    return value;
  }
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
};

/** Blank-safe text for a read-only field. */
export const orDash = (value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? "—" : String(value);

/**
 * A window as one line. Both ends missing reads as a single dash rather than
 * "— → —", which looks like a rendering fault on a page full of them.
 */
export const formatWindow = (
  start: string | null | undefined,
  end: string | null | undefined,
): string => {
  if (!start && !end) return "—";
  return `${formatDateTime(start)}  →  ${formatDateTime(end)}`;
};
