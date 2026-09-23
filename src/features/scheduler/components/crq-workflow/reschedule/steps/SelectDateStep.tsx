import React from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import type { Colors } from "../../../../types/colorTypes";
import type { RescheduleWizard } from "../useRescheduleWizard";
import { InfoTile, StepError, StepSection, StepSkeleton, formatDateOnly } from "../RescheduleAtoms";
import { RescheduleCalendar } from "../RescheduleCalendar";

/**
 * Step 2 - pick the desired date out of the window
 * Get_Predicted_SlotDates_Reschedule computed.
 *
 * The calendar normally arrives with the initiate response, so reaching this
 * step costs no request at all; Refresh (and resuming an interrupted attempt)
 * recomputes it via CRQ_SP_RESCHEDULE_GET_CALENDAR, which does not create a
 * second attempt row the way re-initiating would.
 */
export const SelectDateStep: React.FC<{ wizard: RescheduleWizard; colors: Colors }> = ({
  wizard,
  colors,
}) => {
  const { calendar, isCalendarLoading, refreshCalendar, desiredDate, setDesiredDate } = wizard;

  if (isCalendarLoading && !calendar) return <StepSkeleton rows={2} height={120} />;

  // Jumping here directly (or a scheduling-engine hiccup on refresh) can
  // leave the calendar unavailable - show a neutral prompt to (re)load it
  // rather than surfacing the backend's own error text.
  if (!calendar) {
    return (
      <Box sx={{ textAlign: "center", py: 5 }}>
        <CalendarMonthRoundedIcon sx={{ fontSize: 26, color: colors.textDim, mb: 1 }} />
        <Typography sx={{ fontSize: 12.5, color: colors.textDim, mb: 1.5 }}>
          The scheduling calendar isn't loaded for this step yet.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => refreshCalendar()}
          disabled={isCalendarLoading}
          startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Load Calendar
        </Button>
      </Box>
    );
  }

  const noSelectableWindow = !calendar.startDate || calendar.startDate === calendar.endDate;

  return (
    <Box>
      <StepError message={wizard.stepError} />

      <StepSection
        icon={<CalendarMonthRoundedIcon sx={{ fontSize: 14 }} />}
        title="Available Window"
        colors={colors}
        action={
          <Button
            size="small"
            onClick={() => refreshCalendar()}
            disabled={isCalendarLoading}
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: "none", fontSize: 11.5, fontWeight: 700 }}
          >
            Refresh
          </Button>
        }
      >
        <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          <InfoTile label="From" value={formatDateOnly(calendar.startDate)} colors={colors} />
          <InfoTile label="To" value={formatDateOnly(calendar.endDate)} colors={colors} />
          <InfoTile
            label="Selected"
            value={desiredDate ? formatDateOnly(desiredDate) : "Not selected"}
            colors={colors}
            accent={desiredDate ? colors.success : undefined}
          />
        </Stack>
      </StepSection>

      {calendar.message && (
        <Typography sx={{ fontSize: 12, color: colors.textSecondary, mb: 1.5 }}>
          {calendar.message}
        </Typography>
      )}

      {noSelectableWindow ? (
        <Alert severity="warning" sx={{ fontSize: 12.5 }}>
          No selectable dates were returned for this CRQ. The roster may not extend far enough
          ahead yet.
        </Alert>
      ) : (
        <Box
          sx={{
            p: 1.5,
            borderRadius: colors.radiusL,
            border: `1px solid ${colors.border}`,
            bgcolor: colors.surface,
          }}
        >
          <RescheduleCalendar
            calendar={calendar}
            selected={desiredDate}
            onSelect={setDesiredDate}
            colors={colors}
          />
        </Box>
      )}
    </Box>
  );
};

export default SelectDateStep;
