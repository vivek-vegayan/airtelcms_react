import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
// import type { StageConfig } from "../../types/stageWorkflow.types";
import { StageCard } from "./StageCard";
import type { StageConfig } from "../../types/stageWorkflow.types";

interface StageDetailPanelProps {
  plan: any;
  stageConfig: StageConfig;
  openCrqs: Record<string, boolean>;
  selectedCrq: any;
  colors: any;
  onToggle: (id: string) => void;
  onSelect: (crq: any) => void;
  /** Passed through to StageCard; omitted when the user lacks Scheduler UPDATE. */
  onStartPause?: (crq: any) => void;
  /** Passed through to StageCard; omitted on stages that cannot reschedule. */
  onReschedule?: (crq: any) => void;
}

/**
 * Stage-agnostic replacement for the original `DetailPanel`. Takes a
 * `stageConfig` so the same panel works for every workflow stage.
 */
export const StageDetailPanel: React.FC<StageDetailPanelProps> = ({
  plan,
  stageConfig,
  openCrqs,
  selectedCrq,
  colors,
  onToggle,
  onSelect,
  onStartPause,
  onReschedule,
}) => (
  <Box
    sx={{
      width: "100%",
      p: 2,
      bgcolor: colors.accentDim,
      borderTop: `1px solid ${colors.border}`,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.8 }}>
      <Box
        sx={{
          width: 3,
          height: 16,
          borderRadius: 99,
          background: `linear-gradient(180deg, ${colors.accent}, ${colors.info})`,
        }}
      />
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.55,
          color: colors.textSecondary,
          textTransform: "uppercase",
        }}
      >
        {stageConfig.label} CRQs
      </Typography>
      <Chip
        label={plan.crqs?.length ?? 0}
        size="small"
        sx={{
          height: 20,
          fontSize: 11,
          fontWeight: 800,
          bgcolor: colors.accentDim,
          color: colors.accent,
          border: `1px solid ${colors.accentBorder}`,
        }}
      />
      <Typography sx={{ fontSize: 12, color: colors.textDim, fontFamily: "monospace" }}>
        › {plan.planNumber}
      </Typography>
    </Stack>

    {!plan.crqs?.length ? (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          border: `1px dashed ${colors.border}`,
          borderRadius: colors.radiusL,
        }}
      >
        <TableRowsRoundedIcon sx={{ fontSize: 28, mb: 1, color: colors.textDim, opacity: 0.5 }} />
        <Typography sx={{ fontSize: 13, color: colors.textDim }}>No CRQs found.</Typography>
      </Box>
    ) : (
      plan.crqs.map((crq: any) => (
        <StageCard
          key={crq.crqNo}
          crq={crq}
          stageConfig={stageConfig}
          colors={colors}
          isOpen={!!openCrqs[crq.crqNo]}
          isSelected={selectedCrq?.crqNo === crq.crqNo}
          onToggle={() => onToggle(crq.crqNo)}
          onSelect={() =>
            onSelect(
              selectedCrq?.crqNo === crq.crqNo
                ? null
                : { ...crq, planNumber: plan.planNumber },
            )
          }
          onStartPause={onStartPause ? () => onStartPause(crq) : undefined}
          onReschedule={
            onReschedule
              ? () => onReschedule({ ...crq, planNumber: plan.planNumber })
              : undefined
          }
        />
      ))
    )}
  </Box>
);

export default StageDetailPanel;
