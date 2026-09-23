import { Box, Button, Stack, Typography } from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import type { Colors } from "../types/colorTypes";

interface RescheduleNotificationEmptyStateProps {
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  colors: Colors;
}

export function RescheduleNotificationEmptyState({
  hasActiveFilters,
  onResetFilters,
  colors,
}: RescheduleNotificationEmptyStateProps) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ py: "36px", px: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: colors.accentDim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EventBusyIcon sx={{ fontSize: 24, color: colors.accent }} />
      </Box>
      <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, fontWeight: 700 }}>
        {hasActiveFilters ? "No reschedule requests match your filters" : "No reschedule requests"}
      </Typography>
      {hasActiveFilters && (
        <Button
          size="small"
          onClick={onResetFilters}
          sx={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "none",
            color: colors.accent,
            "&:hover": { background: colors.accentDim },
          }}
        >
          Reset filters
        </Button>
      )}
    </Stack>
  );
}
