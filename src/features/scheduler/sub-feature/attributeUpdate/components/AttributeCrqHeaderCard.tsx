import React from "react";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import type { Colors } from "../../../types/colorTypes";
import type { AttributeUpdateCrqContext } from "../types/attributeUpdate.types";
import { STAGE_BADGES } from "../constants/attributeUpdate.constants";

interface AttributeCrqHeaderCardProps {
  crq: AttributeUpdateCrqContext;
  /** Label of the CRQ's current (only editable) workflow stage. */
  currentStageLabel: string;
  /** Stages completed vs. total across the 7-stage workflow timeline. */
  completion: { filled: number; total: number };
  colors: Colors;
}

const StageBadge: React.FC<{
  palette: { bg: string; fg: string };
  icon: React.ReactNode;
  label: string;
}> = ({ palette, icon, label }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      px: 1.25,
      py: "4px",
      borderRadius: "14px",
      fontSize: 11.5,
      fontWeight: 500,
      whiteSpace: "nowrap",
      bgcolor: palette.bg,
      color: palette.fg,
    }}
  >
    {icon}
    {label}
  </Box>
);

/**
 * Header card of the dialog body: CRQ identity + requester meta on the left,
 * the CRQ's current (only editable) stage badge on the right, and an
 * overall "N/7 stages completed" progress bar for the whole timeline below.
 */
export const AttributeCrqHeaderCard: React.FC<AttributeCrqHeaderCardProps> = ({
  crq,
  currentStageLabel,
  completion,
  colors,
}) => {
  const pct = completion.total ? Math.round((completion.filled / completion.total) * 100) : 100;
  const complete = completion.total > 0 && completion.filled === completion.total;

  return (
    <Box
      sx={{
        bgcolor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: colors.radiusL,
        px: 2,
        py: 1.5,
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
          gap: 1.25,
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "monospace",
              fontSize: 14.5,
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            {crq.crqNo}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, mt: 0.2 }}>
            {crq.requester} · {crq.circle} · {crq.vendor} · {crq.domain}
          </Typography>
        </Box>

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.6}
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
          sx={{ maxWidth: { sm: 440 } }}
        >
          <StageBadge
            palette={STAGE_BADGES.cms}
            icon={<FlagOutlinedIcon sx={{ fontSize: 13 }} />}
            label={`Current stage: ${currentStageLabel}`}
          />
          <StageBadge
            palette={{ bg: colors.successDim, fg: colors.success }}
            icon={<TaskAltRoundedIcon sx={{ fontSize: 13 }} />}
            label={`${completion.filled}/${completion.total} stages completed`}
          />
        </Stack>
      </Box>

      {completion.total > 0 && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25 }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              bgcolor: colors.trackOff,
              "& .MuiLinearProgress-bar": {
                borderRadius: 3,
                bgcolor: complete ? colors.success : colors.accent,
              },
            }}
          />
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: complete ? colors.success : colors.textSecondary,
              whiteSpace: "nowrap",
            }}
          >
            {completion.filled}/{completion.total} stages
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export default AttributeCrqHeaderCard;
