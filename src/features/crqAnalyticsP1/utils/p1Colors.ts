import { useMemo } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { useTabColorTokens } from "../../../style/theme";
import { categoricalPalette, chartChrome, seriesColor } from "../../crqAnalytics/utils/chartPalette";

/**
 * Series colours for the Phase 1 cards, taken from the analytics chart palette that the other
 * /analytics tabs already use (so CCB, SE, received, closed ... keep the same colour everywhere),
 * plus the app status tokens for real states (Slot Lapse, over-booked, utilization).
 */
export function useP1Colors() {
  const theme = useTheme();
  const tokens = useTabColorTokens(theme);
  const isDark = theme.palette.mode === "dark";

  return useMemo(() => {
    const cat = categoricalPalette(isDark);
    const chrome = chartChrome(isDark);
    return {
      tokens,
      isDark,
      cat,
      chrome,
      received: seriesColor("raised", isDark),
      movedToSe: seriesColor("movedToSe", isDark),
      done: seriesColor("closed", isDark),
      ccb: seriesColor("ccb", isDark),
      se: seriesColor("se", isDark),
      rejected: seriesColor("rejected", isDark),
      cancelled: chrome.muted,
      rescheduled: cat[3],
      openNow: cat[6],
      unknown: tokens.textDim,
      day: cat[3],
      night: cat[6],
      /** Two-step shade for count grids: the cell with more CRQs is darker. */
      shade: (share: number) =>
        share > 0.6 ? alpha(tokens.info, isDark ? 0.34 : 0.24) : share > 0.3 ? alpha(tokens.info, isDark ? 0.18 : 0.12) : "transparent",
    };
  }, [tokens, isDark]);
}

export type P1Colors = ReturnType<typeof useP1Colors>;
