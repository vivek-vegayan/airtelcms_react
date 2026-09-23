import React from "react";
import { Alert, Box, Typography } from "@mui/material";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";

import type { Colors } from "../../../../types/colorTypes";
import type { RescheduleWizard } from "../useRescheduleWizard";
import { StepError, StepSection, StepSkeleton, formatDateOnly } from "../RescheduleAtoms";
import { SlotCard } from "../SlotCard";

/**
 * Step 4 - pick one of the offered engineer slots.
 *
 * The slots arrive with the move-stage response, so reaching this step costs no
 * request. Nothing is reserved here - the slot is only held at Confirm.
 */
export const SelectSlotStep: React.FC<{ wizard: RescheduleWizard; colors: Colors }> = ({
  wizard,
  colors,
}) => {
  const {
    slots,
    slotsMessage,
    isSlotsLoading,
    selectedSlotLabel,
    setSelectedSlotLabel,
    desiredDate,
  } = wizard;

  return (
    <Box>
      <StepError message={wizard.stepError} />

      <StepSection
        icon={<EngineeringRoundedIcon sx={{ fontSize: 14 }} />}
        title={`Available Slots${desiredDate ? ` — ${formatDateOnly(desiredDate)}` : ""}`}
        colors={colors}
      >
        {isSlotsLoading ? (
          <StepSkeleton rows={4} height={92} />
        ) : slots.length === 0 ? (
          <Alert severity="warning" sx={{ fontSize: 12.5 }}>
            {/* A fetch failure lands here too rather than surfacing the
                backend's own error text. */}
            {slotsMessage ?? "No engineer slots are available for the selected date."}
          </Alert>
        ) : (
          <>
            <Typography sx={{ fontSize: 11.5, color: colors.textDim, mb: 1 }}>
              {slots.length} slot{slots.length === 1 ? "" : "s"} offered
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 1.2,
              }}
            >
              {slots.map((slot) => (
                <SlotCard
                  key={slot.label}
                  slot={slot}
                  selected={selectedSlotLabel === slot.label}
                  onSelect={setSelectedSlotLabel}
                  colors={colors}
                />
              ))}
            </Box>
          </>
        )}
      </StepSection>
    </Box>
  );
};

export default SelectSlotStep;
