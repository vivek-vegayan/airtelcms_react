import { Box, Chip } from "@mui/material";
import type { ActionStatus, ReadStatus } from "../types/rescheduleNotification.types";
import type { Colors } from "../types/colorTypes";
import { getActionStatusStyles } from "../constants/rescheduleNotification.styles";

export function ActionStatusChip({ status, colors }: { status: ActionStatus; colors: Colors }) {
  const s = getActionStatusStyles(colors)[status];
  return (
    <Chip
      size="small"
      label={s.label}
      sx={{
        background: s.bg,
        color: s.color,
        fontSize: 10.5,
        fontWeight: 800,
        borderRadius: "6px",
        border: `1.5px solid ${s.border}`,
        height: "auto",
        "& .MuiChip-label": { px: "8px", py: "2.5px" },
      }}
    />
  );
}

export function ReadStatusIndicator({ status, colors }: { status: ReadStatus; colors: Colors }) {
  if (status === "READ") return null;
  return (
    <Box
      component="span"
      aria-label="Unread notification"
      title="Unread"
      sx={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        bgcolor: colors.accent,
        boxShadow: `0 0 0 3px ${colors.accentDim}`,
        flexShrink: 0,
      }}
    />
  );
}
