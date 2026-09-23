import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Typography,
} from "@mui/material";
import type { RescheduleNotification } from "../types/rescheduleNotification.types";
import type { Colors } from "../types/colorTypes";
import { ActionStatusChip, ReadStatusIndicator } from "./RescheduleStatusChip";
import { RescheduleTimeComparison } from "./RescheduleTimeComparison";
import { RescheduleNotificationActions } from "./RescheduleNotificationActions";

interface RescheduleNotificationTableProps {
  notifications: readonly RescheduleNotification[];
  colors: Colors;
  onMarkAsRead: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function RescheduleNotificationTable({
  notifications,
  colors,
  onMarkAsRead,
  onApprove,
  onReject,
}: RescheduleNotificationTableProps) {
  const headCellSx = {
    fontSize: 9.5,
    fontWeight: 800,
    color: colors.textSecondary,
    letterSpacing: ".4px",
    textTransform: "uppercase" as const,
    borderBottom: `1.5px solid ${colors.border}`,
    background: colors.surface2,
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={headCellSx}>CRQ No.</TableCell>
          <TableCell sx={headCellSx}>Current → Rescheduled Execution Time</TableCell>
          <TableCell sx={headCellSx}>Status</TableCell>
          <TableCell sx={headCellSx} align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {notifications.map((notification) => {
          const isUnread = notification.readStatus === "UNREAD";
          return (
            <TableRow
              key={notification.id}
              sx={{
                transition: "background .15s",
                "& td": {
                  borderBottom: `1px solid ${colors.border}`,
                  background: isUnread ? colors.accentDim : "transparent",
                },
                "&:hover td": { background: colors.selectedRow },
              }}
            >
              <TableCell>
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
              </TableCell>
              <TableCell>
                <RescheduleTimeComparison
                  currentExecutionTime={notification.currentExecutionTime}
                  rescheduledExecutionTime={notification.rescheduledExecutionTime}
                  colors={colors}
                  variant="inline"
                />
              </TableCell>
              <TableCell>
                <Stack spacing={0.5} alignItems="flex-start">
                  <ActionStatusChip status={notification.actionStatus} colors={colors} />
                  {notification.actionStatus === "REJECTED" && notification.rejectionReason && (
                    <Typography sx={{ fontSize: 10, color: colors.textDim, maxWidth: 220, display: "block" }}>
                      {notification.rejectionReason}
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell align="right">
                <RescheduleNotificationActions
                  notification={notification}
                  colors={colors}
                  onMarkAsRead={onMarkAsRead}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
