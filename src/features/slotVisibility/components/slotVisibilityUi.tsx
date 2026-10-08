import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTabColorTokens } from "../../../style/theme";
import { getFilterBarSx, type SlotTone } from "./slotVisibility.styles";

/* ══════════════ Filter bar ══════════════ */

export function SlotFilterBar({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Box sx={getFilterBarSx(theme)}>{children}</Box>;
}

/* ══════════════ Legend ══════════════ */

export function SlotLegend({ title, items }: { title?: string; items: { label: string; tone: SlotTone }[] }) {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  return (
    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
      {title && (
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary, letterSpacing: ".4px", textTransform: "uppercase" }}>
          {title}
        </Typography>
      )}
      {items.map((item) => (
        <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "4px",
              background: item.tone.bg,
              border: `1px solid ${item.tone.border}`,
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, whiteSpace: "nowrap" }}>{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ══════════════ Status chip ══════════════ */

export function SlotStatusChip({ label, tone }: { label: string; tone: SlotTone }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.25,
        py: 0.4,
        borderRadius: "999px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.3,
        maxWidth: "100%",
      }}
    >
      {label}
    </Box>
  );
}

/* ══════════════ Mini stat ══════════════
 * Compact label/value tile used inside panels (selected slot summary,
 * resolved activity), smaller than the page-level StatCard.
 */

export function MiniStat({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  return (
    <Box
      sx={{
        p: "10px 12px",
        borderRadius: colors.radiusL,
        background: colors.surface2,
        border: `1px solid ${colors.border}`,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, letterSpacing: ".5px", textTransform: "uppercase" }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.25,
          fontSize: 18,
          fontWeight: 800,
          color: color ?? colors.textPrimary,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
