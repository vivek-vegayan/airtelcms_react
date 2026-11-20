import type { useTabColorTokens } from "../../../style/theme";

type Tokens = ReturnType<typeof useTabColorTokens>;

export type P1Tone = "info" | "success" | "warning" | "danger" | "none";

const RESULT_META: Record<string, { label: string; tone: P1Tone }> = {
  OPEN: { label: "Open", tone: "info" },
  FAILED: { label: "Failed", tone: "danger" },
  RESCHEDULED: { label: "Rescheduled", tone: "warning" },
  DONE: { label: "Done", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "none" },
  REJECTED: { label: "Rejected", tone: "danger" },
  UNKNOWN: { label: "Type not mapped yet", tone: "none" },
};

/** Where a CRQ stands: its result, or for an open CRQ a FAILED / RESCHEDULED current status. */
export function resultMeta(result: string | null | undefined, currentStatus?: string | null) {
  return (result === "OPEN" ? RESULT_META[currentStatus ?? ""] : undefined) ?? RESULT_META[result ?? ""] ?? RESULT_META.UNKNOWN;
}

/** Status colours from the app theme: soft background, text, and a solid edge colour. */
export function toneColors(t: Tokens, tone: P1Tone) {
  return {
    info: { bg: t.infoDim, fg: t.info, edge: t.info },
    success: { bg: t.successDim, fg: t.success, edge: t.success },
    warning: { bg: t.warningDim, fg: t.warning, edge: t.warning },
    danger: { bg: t.dangerDim, fg: t.danger, edge: t.danger },
    none: { bg: t.surface2, fg: t.textSecondary, edge: t.textDim },
  }[tone];
}
