import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import type { Colors } from "../../../../types/colorTypes";
import type { RescheduleWizard } from "../useRescheduleWizard";
import { InfoTile, formatDateTime } from "../RescheduleAtoms";
import { stageLabel } from "../stageLabel";

/**
 * Terminal screen. The tick draws itself in with a stroke animation and the
 * ring pulses once - no animation library, just keyframes, so this adds
 * nothing to the bundle.
 */
export const SuccessStep: React.FC<{ wizard: RescheduleWizard; colors: Colors }> = ({
  wizard,
  colors,
}) => {
  const { confirmation, context, toStage } = wizard;

  return (
    <Stack alignItems="center" sx={{ py: 3, textAlign: "center" }}>
      <Box
        sx={{
          position: "relative",
          width: 72,
          height: 72,
          mb: 2,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: colors.successDim,
          border: `2px solid ${colors.success}`,
          animation: "rsPop .45s cubic-bezier(.2,.8,.3,1.2)",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: `2px solid ${colors.success}`,
            opacity: 0,
            animation: "rsRing 1.1s ease-out .2s",
          },
          "@keyframes rsPop": {
            "0%": { transform: "scale(0.4)", opacity: 0 },
            "100%": { transform: "scale(1)", opacity: 1 },
          },
          "@keyframes rsRing": {
            "0%": { transform: "scale(0.8)", opacity: 0.7 },
            "100%": { transform: "scale(1.35)", opacity: 0 },
          },
        }}
      >
        <CheckRoundedIcon sx={{ fontSize: 38, color: colors.success }} />
      </Box>

      <Typography sx={{ fontSize: 17, fontWeight: 800, color: colors.textPrimary, mb: 0.5 }}>
        Reschedule confirmed
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, mb: 2.5 }}>
        {confirmation?.message ??
          `${context?.crqNo ?? "The CRQ"} has been rescheduled and moved to ${stageLabel(toStage)}.`}
      </Typography>

      <Stack
        direction="row"
        flexWrap="wrap"
        useFlexGap
        justifyContent="center"
        sx={{ gap: 1, width: "100%" }}
      >
        <InfoTile
          label="Engineer"
          value={
            confirmation?.engineerName
              ? `${confirmation.engineerName}${confirmation.engineerOlmId ? ` (${confirmation.engineerOlmId})` : ""}`
              : "—"
          }
          colors={colors}
        />
        <InfoTile
          label="New Start"
          value={formatDateTime(confirmation?.slotStart)}
          colors={colors}
          accent={colors.success}
        />
        <InfoTile
          label="New End"
          value={formatDateTime(confirmation?.slotEnd)}
          colors={colors}
          accent={colors.success}
        />
        <InfoTile label="Stage" value={stageLabel(toStage)} colors={colors} />
        <InfoTile label="Shift" value={confirmation?.shiftLetter ?? "—"} colors={colors} />
        <InfoTile
          label="Schedule ID"
          value={confirmation?.scheduleId ?? "—"}
          colors={colors}
          mono
        />
      </Stack>
    </Stack>
  );
};

export default SuccessStep;
