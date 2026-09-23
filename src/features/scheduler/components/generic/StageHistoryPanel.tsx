import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { format } from "date-fns";
import type { StageHistoryEntry } from "../../types/crqWorkflow.types";

interface StageHistoryPanelProps {
  history: StageHistoryEntry[] | null | undefined;
  colors: any;
  /** Compact variant for card bodies; default full section with header. */
  dense?: boolean;
  title?: string;
}

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd-MMM-yyyy HH:mm");
};

const statusPalette = (status: string | null | undefined, colors: any) => {
  const s = (status ?? "").toLowerCase();
  if (s.includes("done") || s.includes("complete"))
    return { bg: colors.successDim, fg: colors.success, border: colors.successBorder };
  if (s.includes("fail") || s.includes("cancel"))
    return { bg: colors.dangerDim, fg: colors.danger, border: colors.dangerBorder };
  if (s.includes("progress"))
    return { bg: colors.infoDim, fg: colors.info, border: colors.infoBorder };
  if (s.includes("pause") || s.includes("hold"))
    return {
      bg: colors.warningDim ?? "#fef3c7",
      fg: colors.warning ?? "#d97706",
      border: colors.warningBorder ?? "#fcd34d",
    };
  return { bg: colors.trackOff, fg: colors.textDim, border: colors.border };
};

/**
 * Read-only listing of a CRQ's completed previous stages (crq.history[]).
 * Deliberately renders NO action buttons - historical records are immutable
 * audit data. Used by the stage cards, the workflow cockpit and the
 * "Previous CRQ Status" dialog so history looks identical everywhere.
 */
export const StageHistoryPanel: React.FC<StageHistoryPanelProps> = ({
  history,
  colors,
  dense = false,
  title = "Previous Stages",
}) => {
  // Only stages *before* the current one are history; the current entry and
  // anything after it belong to the live workflow, not the audit trail.
  const currentIdx = history?.findIndex((h) => h.current) ?? -1;
  const entries = (history ?? []).filter(
    (h, i) => !h.current && (currentIdx === -1 || i < currentIdx),
  );

  if (!entries.length) {
    return dense ? null : (
      <Box
        sx={{
          p: 2,
          textAlign: "center",
          border: `1px dashed ${colors.border}`,
          borderRadius: colors.radiusL ?? "12px",
        }}
      >
        <Typography sx={{ fontSize: 12.5, color: colors.textDim }}>
          No previous-stage history for this CRQ yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.2 }}>
        <HistoryRoundedIcon sx={{ fontSize: 15, color: colors.textDim }} />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.55,
            textTransform: "uppercase",
            color: colors.textSecondary,
          }}
        >
          {title}
        </Typography>
        <Chip
          icon={<LockOutlinedIcon sx={{ fontSize: "12px !important" }} />}
          label="History · Read-only"
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: colors.trackOff,
            color: colors.textDim,
            border: `1px solid ${colors.border}`,
            "& .MuiChip-icon": { color: colors.textDim },
          }}
        />
      </Stack>

      <Stack spacing={dense ? 0.8 : 1}>
        {entries.map((entry) => {
          const pal = statusPalette(entry.status, colors);
          return (
            <Box
              key={entry.stage}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1.2,
                px: 1.5,
                py: dense ? 0.9 : 1.2,
                borderRadius: colors.radiusL ?? "10px",
                border: `1px dashed ${colors.border}`,
                bgcolor: colors.isDark
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.015)",
                opacity: 0.92,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  minWidth: 130,
                }}
              >
                {entry.stageLabel ?? entry.stage}
              </Typography>

              <Chip
                label={entry.status ?? "—"}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10.5,
                  fontWeight: 800,
                  bgcolor: pal.bg,
                  color: pal.fg,
                  border: `1px solid ${pal.border}`,
                }}
              />

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <AccessTimeIcon sx={{ fontSize: 12, color: colors.textDim }} />
                <Typography sx={{ fontSize: 11, color: colors.textDim }}>
                  {fmt(entry.startedAt)} → {fmt(entry.completedAt)}
                </Typography>
              </Stack>

              {(entry.performedBy || entry.assignedTo) && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PersonOutlineIcon sx={{ fontSize: 12, color: colors.textDim }} />
                  <Typography
                    sx={{ fontSize: 11, fontFamily: "monospace", color: colors.textSecondary }}
                  >
                    {entry.performedBy ?? entry.assignedTo}
                  </Typography>
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default StageHistoryPanel;
