import { Box, Divider, Stack, Typography } from "@mui/material";
import type { RescheduleNotification } from "../types/rescheduleNotification.types";
import type { Colors } from "../types/colorTypes";
import { ActionStatusChip, ReadStatusIndicator } from "./RescheduleStatusChip";
import { RescheduleTimeComparison } from "./RescheduleTimeComparison";
import { RescheduleNotificationActions } from "./RescheduleNotificationActions";
import { formatExecutionTime } from "../utils/rescheduleNotification.utils";

interface RescheduleNotificationCardProps {
  notification: RescheduleNotification;
  colors: Colors;
  onMarkAsRead: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function RescheduleNotificationCard({
  notification,
  colors,
  onMarkAsRead,
  onApprove,
  onReject,
}: RescheduleNotificationCardProps) {
  const isUnread = notification.readStatus === "UNREAD";
  return (
    <Box
      sx={{
        p: "11px 13px",
        borderRadius: "12px",
        border: `1.5px solid ${colors.border}`,
        borderLeft: "3px solid",
        borderLeftColor: isUnread ? colors.accent : colors.border,
        background: isUnread ? colors.accentDim : colors.surface,
        transition: "box-shadow .2s, transform .2s",
        "&:hover": {
          boxShadow: colors.isDark ? "0 6px 18px rgba(0,0,0,.4)" : "0 6px 18px rgba(60,60,140,.09)",
          transform: "translateX(2px)",
        },
      }}
    >
      <Stack spacing={0.9}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1} alignItems="center">
            <ReadStatusIndicator status={notification.readStatus} colors={colors} />
            <Typography
              sx={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 12,
                fontWeight: isUnread ? 800 : 600,
                color: isUnread ? colors.accent : colors.textPrimary,
              }}
            >
              {notification.crqNo}
            </Typography>
          </Stack>
          <ActionStatusChip status={notification.actionStatus} colors={colors} />
        </Stack>

        <RescheduleTimeComparison
          currentExecutionTime={notification.currentExecutionTime}
          rescheduledExecutionTime={notification.rescheduledExecutionTime}
          colors={colors}
          variant="stacked"
        />

        {notification.actionStatus === "REJECTED" && notification.rejectionReason && (
          <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
            Reason: {notification.rejectionReason}
          </Typography>
        )}

        <Typography sx={{ fontSize: 10, color: colors.textDim }}>
          Requested {formatExecutionTime(notification.requestedAt)}
        </Typography>

        <Divider sx={{ borderColor: colors.border }} />

        <RescheduleNotificationActions
          notification={notification}
          colors={colors}
          onMarkAsRead={onMarkAsRead}
          onApprove={onApprove}
          onReject={onReject}
        />
      </Stack>
    </Box>
  );
}
