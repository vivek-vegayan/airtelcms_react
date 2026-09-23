import React from "react";
import { Alert, Avatar, Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import type { Colors } from "../../../types/colorTypes";

/**
 * Presentational pieces shared by the five reschedule steps, and by any other
 * CRQ-workflow dialog that needs the same rhythm (the Validate dialog reuses
 * StepSection / InfoTile / StepError / StepSkeleton rather than restating
 * them). Deliberately kept in one file: they are small, depend on nothing but
 * MUI and the colour tokens, and colocating them keeps the step components
 * down to their own layout.
 */

/** Section heading with an icon avatar - matches PrevCrqStatusDialog's rhythm. */
export const StepSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  colors: Colors;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, title, colors, action, children }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.25 }}>
      <Avatar sx={{ width: 24, height: 24, bgcolor: colors.accentDim, color: colors.accent }}>
        {icon}
      </Avatar>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: colors.textSecondary,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1 }} />
      {action}
    </Stack>
    {children}
  </Box>
);

/** Labelled read-only value tile used across the details and summary steps. */
export const InfoTile: React.FC<{
  label: string;
  value: React.ReactNode;
  colors: Colors;
  icon?: React.ReactNode;
  mono?: boolean;
  accent?: string;
}> = ({ label, value, colors, icon, mono, accent }) => (
  <Box
    sx={{
      flex: "1 1 180px",
      minWidth: 0,
      px: 1.4,
      py: 1,
      borderRadius: colors.radius,
      border: `1px solid ${accent ? `${accent}44` : colors.border}`,
      bgcolor: colors.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.4 }}>
      {icon && <Box sx={{ display: "flex", color: colors.textDim }}>{icon}</Box>}
      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: colors.textDim,
        }}
      >
        {label}
      </Typography>
    </Stack>
    <Typography
      component="div"
      sx={{
        fontSize: 13,
        fontWeight: 700,
        color: accent ?? colors.textPrimary,
        fontFamily: mono ? "monospace" : "inherit",
        wordBreak: "break-word",
      }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

/** "current → new" comparison row: the shape of the whole confirmation step. */
export const TransitionRow: React.FC<{
  label: string;
  from: React.ReactNode;
  to: React.ReactNode;
  colors: Colors;
  changed?: boolean;
}> = ({ label, from, to, colors, changed = true }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "stretch", sm: "center" }}
    spacing={1}
    sx={{
      px: 1.4,
      py: 1.1,
      borderRadius: colors.radius,
      border: `1px solid ${colors.border}`,
      bgcolor: colors.surface,
    }}
  >
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        color: colors.textDim,
        width: { xs: "auto", sm: 132 },
        flexShrink: 0,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        flex: 1,
        fontSize: 13,
        fontWeight: 600,
        color: colors.textSecondary,
        textDecoration: changed ? "line-through" : "none",
        textDecorationColor: colors.textDim,
      }}
    >
      {from ?? "—"}
    </Typography>
    <ArrowForwardRoundedIcon
      sx={{ fontSize: 16, color: changed ? colors.accent : colors.textDim, flexShrink: 0 }}
    />
    <Typography
      sx={{
        flex: 1,
        fontSize: 13,
        fontWeight: 800,
        color: changed ? colors.success : colors.textSecondary,
      }}
    >
      {to ?? "—"}
    </Typography>
  </Stack>
);

/** Colour key for the calendar's five day classes. */
export const LegendDot: React.FC<{ color: string; label: string; colors: Colors }> = ({
  color,
  label,
  colors,
}) => (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
    <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: colors.textSecondary }}>
      {label}
    </Typography>
  </Stack>
);

/** Small status pill reused for stage / attempt / count chips. */
export const StatusChip: React.FC<{
  label: string;
  fg: string;
  bg: string;
  border?: string;
}> = ({ label, fg, bg, border }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      height: 20,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: 0.3,
      color: fg,
      bgcolor: bg,
      border: border ? `1px solid ${border}` : "none",
    }}
  />
);

/** Inline error banner - every step surfaces the procedure's own message. */
export const StepError: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <Alert severity="error" variant="outlined" sx={{ mb: 2, fontSize: 12.5, py: 0.4 }}>
      {message}
    </Alert>
  ) : null;

/** Placeholder rows shown while a step's lazily-loaded read is in flight. */
export const StepSkeleton: React.FC<{ rows?: number; height?: number }> = ({
  rows = 3,
  height = 56,
}) => (
  <Stack spacing={1.2}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={height} animation="wave" />
    ))}
  </Stack>
);

/** `yyyy-MM-dd HH:mm:ss` (procedure output) -> "04 Aug 2026, 10:30". */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Date half only, for the "current date -> new date" comparison rows. */
export const formatDateOnly = (value: string | null | undefined): string => {
  if (!value) return "—";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** Time half only. */
export const formatTimeOnly = (value: string | null | undefined): string => {
  if (!value) return "—";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};
