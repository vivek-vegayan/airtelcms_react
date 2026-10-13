import React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Typography,
  alpha,
  type SxProps,
  type Theme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { SlideUpTransition } from "../../../../../../components/common/SlideUpTransition";
import { MOP_VERSION_STATUS_LABEL } from "../../../../types/mopValidate.types";

/**
 * Shared primitives for the MOP Validate surfaces - the stage panel, the
 * version strip and the fullscreen review workspace - so all three speak the
 * same visual language as the rest of the stage dialog: rounded 1px-bordered
 * surfaces, soft alpha chips and the 9.5px uppercase micro-label, all driven
 * by `useTabColorTokens`.
 */

/** `2026-08-28T11:40:00` -> `28 Aug 11:40`, the compact stamp. */
export const shortStamp = (value: string | null | undefined): string => {
  if (!value) return "—";
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return value;
  return `${at.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${at.toLocaleTimeString(
    "en-GB",
    { hour: "2-digit", minute: "2-digit", hour12: false },
  )}`;
};

/**
 * Status -> colour. Only a decided version is green or red; everything still
 * in flight reads as the neutral accent, so nothing implies an outcome that
 * has not been reached.
 */
export const versionTone = (status: string | null | undefined, colors: any): string => {
  if (status === "validated") return colors.success;
  if (status === "rejected") return colors.danger;
  if (status === "superseded") return colors.textDim;
  return colors.accent;
};

/** The uppercase micro-label used by every field caption in the stage dialog. */
export const Lbl: React.FC<{ children: React.ReactNode; colors: any; sx?: any }> = ({
  children,
  colors,
  sx,
}) => (
  <Typography
    sx={{
      fontSize: 9.5,
      letterSpacing: "0.09em",
      textTransform: "uppercase",
      fontWeight: 700,
      color: colors.textSecondary,
      lineHeight: 1.5,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

/** Soft tinted chip - the stage dialog's status pill. */
export const ToneChip: React.FC<{ label: React.ReactNode; tone: string; sx?: SxProps<Theme> }> = ({
  label,
  tone,
  sx,
}) => (
  <Chip
    label={label}
    size="small"
    sx={{
      height: 20,
      fontSize: 10,
      fontWeight: 700,
      bgcolor: alpha(tone, 0.14),
      color: tone,
      border: `1px solid ${alpha(tone, 0.28)}`,
      "& .MuiChip-label": { px: 0.9 },
      ...(sx as object),
    }}
  />
);

/** A version status as a chip, labelled from `MOP_VERSION_STATUS_LABEL`. */
export const VersionStatusChip: React.FC<{ status: string; colors: any; sx?: SxProps<Theme> }> = ({
  status,
  colors,
  sx,
}) => (
  <ToneChip
    label={MOP_VERSION_STATUS_LABEL[status as keyof typeof MOP_VERSION_STATUS_LABEL] ?? status}
    tone={versionTone(status, colors)}
    sx={sx}
  />
);

// ── Buttons ──────────────────────────────────────────────────────────────
// Same shape as the panel's "Validate" / "Start review" pair, so a button
// looks the same whether it sits in the panel or in the workspace.

const baseBtn = {
  textTransform: "none" as const,
  fontSize: 12.5,
  fontWeight: 700,
  borderRadius: 1.5,
  px: 1.5,
  whiteSpace: "nowrap" as const,
  boxShadow: "none",
};

export const solidBtnSx = (tone: string) => ({
  ...baseBtn,
  bgcolor: tone,
  color: "#fff",
  "&:hover": { bgcolor: tone, filter: "brightness(1.08)", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: alpha(tone, 0.35), color: "rgba(255,255,255,0.8)" },
});

export const outlineBtnSx = (colors: any, tone?: string) => ({
  ...baseBtn,
  border: `1px solid ${tone ? alpha(tone, 0.45) : colors.border}`,
  color: tone ?? colors.textPrimary,
  bgcolor: "transparent",
  "&:hover": {
    bgcolor: alpha(tone ?? colors.accent, 0.08),
    borderColor: tone ?? colors.accent,
    color: tone ?? colors.accent,
  },
});

export const ghostBtnSx = (colors: any) => ({
  ...baseBtn,
  color: colors.textSecondary,
  "&:hover": { bgcolor: alpha(colors.textPrimary, 0.06) },
});

/** Rounded inputs to match the rest of the dialog's form fields. */
export const inputSx = { borderRadius: 1.5, fontSize: 13 };

/**
 * Shell for the workspace's confirm dialogs (new finding, approve, reject),
 * styled like the app's `ConfirmDialog`: a rounded surface card with a tinted
 * icon badge that tells approve from reject before the text is read.
 */
export const ActionDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  colors: any;
  kicker: string;
  title: string;
  accent: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, colors, kicker, title, accent, icon, children }) => (
  <Dialog
    open={open}
    onClose={onClose}
    TransitionComponent={SlideUpTransition}
    PaperProps={{
      elevation: 0,
      sx: {
        width: "min(520px, calc(100% - 32px))",
        m: 2,
        borderRadius: colors.radiusL,
        bgcolor: colors.surface,
        backgroundImage: "none",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadowOverlay,
        overflow: "hidden",
      },
    }}
  >
    <Box sx={{ height: 3, bgcolor: accent }} />
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              flex: "none",
              display: "grid",
              placeItems: "center",
              borderRadius: colors.radius,
              bgcolor: alpha(accent, 0.12),
              color: accent,
              "& svg": { fontSize: 20 },
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Lbl colors={colors}>{kicker}</Lbl>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.35 }}>
            {title}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ color: colors.textSecondary, mt: -0.5 }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      {children}
    </Box>
  </Dialog>
);

/** Confirm + Cancel pair, right-aligned like `ConfirmDialog`'s actions. */
export const ActionFooter: React.FC<{
  colors: any;
  confirmLabel: string;
  confirmTone: string;
  confirmDisabled: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  extra?: React.ReactNode;
}> = ({ colors, confirmLabel, confirmTone, confirmDisabled, busy, onConfirm, onCancel, extra }) => (
  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
    <Button onClick={onCancel} sx={ghostBtnSx(colors)}>
      Cancel
    </Button>
    {extra}
    <Button
      onClick={onConfirm}
      disabled={confirmDisabled || busy}
      startIcon={busy ? <CircularProgress size={13} color="inherit" /> : undefined}
      sx={solidBtnSx(confirmTone)}
    >
      {confirmLabel}
    </Button>
  </Box>
);
