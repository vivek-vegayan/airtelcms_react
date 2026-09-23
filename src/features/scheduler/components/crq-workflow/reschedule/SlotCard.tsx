import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import type { Colors } from "../../../types/colorTypes";
import type { RescheduleSlot } from "../../../types/reschedule.types";
import { formatTimeOnly } from "./RescheduleAtoms";

interface SlotCardProps {
  slot: RescheduleSlot;
  selected: boolean;
  onSelect: (label: string) => void;
  colors: Colors;
}

/**
 * One offered engineer slot. Everything shown comes straight from
 * CRQ_SP_RESCHEDULE_GET_SLOTS; optional fields (skill level, free minutes)
 * are simply omitted when the procedure had nothing to report for them.
 */
export const SlotCard: React.FC<SlotCardProps> = ({ slot, selected, onSelect, colors }) => (
  <Box
    onClick={() => onSelect(slot.label)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(slot.label);
      }
    }}
    sx={{
      position: "relative",
      p: 1.5,
      borderRadius: colors.radiusL,
      cursor: "pointer",
      border: `1.5px solid ${selected ? colors.accent : colors.border}`,
      bgcolor: selected ? colors.accentDim : colors.surface,
      transition: "border-color .15s, background-color .15s, transform .15s",
      "&:hover": { borderColor: colors.accent, transform: "translateY(-1px)" },
      "&:focus-visible": { outline: `2px solid ${colors.accent}`, outlineOffset: 2 },
    }}
  >
    {selected && (
      <CheckCircleRoundedIcon
        sx={{ position: "absolute", top: 10, right: 10, fontSize: 18, color: colors.accent }}
      />
    )}

    <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 0.8, pr: 3 }}>
      <ScheduleRoundedIcon sx={{ fontSize: 16, color: colors.accent }} />
      <Typography sx={{ fontSize: 14, fontWeight: 800, color: colors.textPrimary }}>
        {formatTimeOnly(slot.startDateTime)} – {formatTimeOnly(slot.endDateTime)}
      </Typography>
      {slot.durationMinutes != null && (
        <Chip
          label={`${slot.durationMinutes} min`}
          size="small"
          sx={{
            height: 18,
            fontSize: 9.5,
            fontWeight: 800,
            bgcolor: colors.infoDim,
            color: colors.info,
          }}
        />
      )}
    </Stack>

    <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.6, minWidth: 0 }}>
      <PersonRoundedIcon sx={{ fontSize: 15, color: colors.textDim }} />
      <Typography
        sx={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, minWidth: 0 }}
        noWrap
      >
        {slot.engineerName ?? "Unassigned"}
      </Typography>
      {slot.engineerOlmId && (
        <Typography
          sx={{ fontSize: 11, fontFamily: "monospace", color: colors.textDim }}
          noWrap
        >
          {slot.engineerOlmId}
        </Typography>
      )}
    </Stack>

    <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ columnGap: 0.6, rowGap: 0.5 }}>
      {/* Every slot the procedure returns is in OFFERED state - anything
          reserved, confirmed or expired is filtered out before it gets here. */}
      <Chip
        label="Available"
        size="small"
        sx={{
          height: 18,
          fontSize: 9.5,
          fontWeight: 800,
          bgcolor: colors.successDim,
          color: colors.success,
          border: `1px solid ${colors.successBorder}`,
        }}
      />
      {slot.shiftLetter && (
        <Chip
          label={`Shift ${slot.shiftLetter}`}
          size="small"
          sx={{
            height: 18,
            fontSize: 9.5,
            fontWeight: 800,
            bgcolor: colors.trackOff,
            color: colors.textSecondary,
          }}
        />
      )}
      {slot.skillLevel && (
        <Chip
          label={slot.skillLevel}
          size="small"
          sx={{
            height: 18,
            fontSize: 9.5,
            fontWeight: 800,
            bgcolor: colors.accentDim,
            color: colors.accent,
            border: `1px solid ${colors.accentBorder}`,
          }}
        />
      )}
      {slot.freeMinutes != null && (
        <Chip
          label={`${slot.freeMinutes} min free`}
          size="small"
          sx={{
            height: 18,
            fontSize: 9.5,
            fontWeight: 800,
            bgcolor: colors.successDim,
            color: colors.success,
          }}
        />
      )}
    </Stack>
  </Box>
);

export default SlotCard;
