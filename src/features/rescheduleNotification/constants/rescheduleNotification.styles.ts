import type { Colors } from "../types/colorTypes";
import type { ActionStatus, TimeShiftDirection } from "../types/rescheduleNotification.types";

/** Card surface + border derived from the active theme (light/dark aware). */
export const getSurfaceSx = (c: Colors) => ({
  border: `1.5px solid ${c.border}`,
  borderRadius: c.radiusL,
  boxShadow: c.isDark ? "0 2px 14px rgba(0,0,0,.4)" : "0 2px 12px rgba(60,60,140,.06)",
  background: c.surface,
});

export const getHoverShadow = (c: Colors) =>
  c.isDark ? "0 8px 26px rgba(0,0,0,.5)" : "0 8px 28px rgba(60,60,140,.11)";

interface StatusVisual {
  label: string;
  bg: string;
  color: string;
  border: string;
}

/** Action-status → colour mapping, sourced from theme warning/success/danger tokens. */
export const getActionStatusStyles = (c: Colors): Record<ActionStatus, StatusVisual> => ({
  PENDING: { label: "Pending", bg: c.warningDim, color: c.warning, border: c.warningBorder },
  APPROVED: { label: "Approved", bg: c.successDim, color: c.success, border: c.successBorder },
  REJECTED: { label: "Rejected", bg: c.dangerDim, color: c.danger, border: c.dangerBorder },
});

/** Time-shift direction → colour mapping (later = warning, earlier = success, same = neutral). */
export const getDirectionStyles = (
  c: Colors,
): Record<TimeShiftDirection, { color: string; bg: string }> => ({
  LATER: { color: c.warning, bg: c.warningDim },
  EARLIER: { color: c.success, bg: c.successDim },
  SAME: { color: c.textSecondary, bg: c.surface2 },
});

/** Summary-tile accent per metric, all derived from theme tokens. */
export const getSummaryTileAccents = (c: Colors): Record<string, { color: string; light: string }> => ({
  total: { color: c.accent, light: c.accentDim },
  unread: { color: c.info, light: c.infoDim },
  pending: { color: c.warning, light: c.warningDim },
  approved: { color: c.success, light: c.successDim },
  rejected: { color: c.danger, light: c.dangerDim },
});
