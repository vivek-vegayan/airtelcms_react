import { Box, Stack, Tooltip, Typography } from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import { compareExecutionTimes, formatExecutionTime } from "../utils/rescheduleNotification.utils";
import { getDirectionStyles } from "../constants/rescheduleNotification.styles";
import type { Colors } from "../types/colorTypes";

interface RescheduleTimeComparisonProps {
  currentExecutionTime: string;
  rescheduledExecutionTime: string;
  colors: Colors;
  /** Compact renders the two timestamps inline (table row); default stacks them (card). */
  variant?: "stacked" | "inline";
}

export function RescheduleTimeComparison({
  currentExecutionTime,
  rescheduledExecutionTime,
  colors,
  variant = "stacked",
}: RescheduleTimeComparisonProps) {
  const comparison = compareExecutionTimes(currentExecutionTime, rescheduledExecutionTime);
  const directionStyle = getDirectionStyles(colors)[comparison.direction];

  const timestamps = (
    <Stack
      direction={variant === "inline" ? "row" : "column"}
      spacing={variant === "inline" ? 1 : 0.25}
      alignItems={variant === "inline" ? "center" : "flex-start"}
    >
      <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: 500 }}>
        {formatExecutionTime(currentExecutionTime)}
      </Typography>
      <ArrowRightAltIcon
        fontSize="small"
        sx={{
          color: directionStyle.color,
          transform: variant === "stacked" ? "rotate(90deg)" : "none",
          fontSize: 16,
        }}
      />
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: colors.textPrimary }}>
        {formatExecutionTime(rescheduledExecutionTime)}
      </Typography>
    </Stack>
  );

  return (
    <Box>
      {timestamps}
      <Tooltip title={comparison.isSameDay ? "Same-day reschedule" : "Different-day reschedule"} arrow>
        <Box
          sx={{
            display: "inline-block",
            mt: "5px",
            px: "7px",
            py: "1px",
            borderRadius: "20px",
            background: directionStyle.bg,
          }}
        >
          <Typography sx={{ fontSize: 9, fontWeight: 800, color: directionStyle.color }}>
            {comparison.diffLabel}
          </Typography>
        </Box>
      </Tooltip>
    </Box>
  );
}
