import React from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import type { Colors } from "../../../types/colorTypes";
import { SUB_STATUS_BAR } from "../constants/attributeUpdate.constants";

interface RemedySubStatusBarProps {
  statuses: string[];
  activeIndex: number;
  /**
   * Index of the status the CRQ is actually in (GET_CHANGE_REQUEST_STATUS).
   * Everything before it is already passed and is rendered locked.
   */
  floorIndex: number;
  onSelect: (index: number) => void;
  colors: Colors;
}

/**
 * Remedy sub-status selector, rendered only for stages spanning multiple
 * Remedy statuses (Network Execution). Selecting a status updates the
 * header badge and the auto-set remedy_status field.
 *
 * The bar opens on the CRQ's live status and only moves forward from there:
 * a Remedy status is a one-way progression, so the statuses it has already
 * been through are shown ticked and locked rather than hidden - the user can
 * still see the path taken, just not re-select a step of it.
 */
export const RemedySubStatusBar: React.FC<RemedySubStatusBarProps> = ({
  statuses,
  activeIndex,
  floorIndex,
  onSelect,
  colors,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    flexWrap="wrap"
    gap={1}
    sx={{
      px: 2,
      py: 1.5,
      mb: 1.75,
      bgcolor: SUB_STATUS_BAR.bg,
      border: `1px solid ${SUB_STATUS_BAR.border}`,
      borderRadius: colors.radiusL,
    }}
  >
    <Typography
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        fontSize: 13,
        fontWeight: 600,
        color: SUB_STATUS_BAR.fg,
      }}
    >
      <StorageRoundedIcon sx={{ fontSize: 14 }} />
      Remedy sub-status:
    </Typography>
    {statuses.map((status, index) => {
      const isActive = index === activeIndex;
      const isPassed = index < floorIndex;
      const chip = (
        <Box
          key={status}
          component="button"
          type="button"
          disabled={isPassed}
          aria-current={isActive ? "step" : undefined}
          onClick={() => onSelect(index)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.4,
            px: 1.75,
            py: "5px",
            borderRadius: "16px",
            fontSize: 12.5,
            fontFamily: "inherit",
            fontWeight: isActive ? 600 : 400,
            cursor: isPassed ? "not-allowed" : "pointer",
            bgcolor: isActive ? colors.accent : isPassed ? colors.surface2 : "#FFFFFF",
            color: isActive ? "#fff" : isPassed ? colors.textDim : colors.textSecondary,
            border: `1px solid ${isActive ? colors.accent : colors.border}`,
            textDecoration: isPassed ? "line-through" : "none",
            transition: "all 0.15s ease",
            "&:hover":
              !isActive && !isPassed
                ? { borderColor: colors.accent, color: SUB_STATUS_BAR.fg }
                : undefined,
          }}
        >
          {isPassed && <CheckRoundedIcon sx={{ fontSize: 13 }} />}
          {status}
        </Box>
      );

      // Wrapped in a span because a disabled button fires no pointer events of
      // its own, and MUI's Tooltip needs one to know it is being hovered.
      return isPassed ? (
        <Tooltip key={status} title="Already passed — the Remedy status only moves forward.">
          <span style={{ display: "inline-flex" }}>{chip}</span>
        </Tooltip>
      ) : (
        chip
      );
    })}
  </Stack>
);

export default RemedySubStatusBar;
