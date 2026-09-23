import { Button, Stack, Tooltip, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { RescheduleNotification } from "../types/rescheduleNotification.types";
import type { Colors } from "../types/colorTypes";

interface RescheduleNotificationActionsProps {
  notification: RescheduleNotification;
  colors: Colors;
  onMarkAsRead: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const pillButtonSx = {
  minWidth: 0,
  whiteSpace: "nowrap" as const,
  fontSize: 10.5,
  fontWeight: 700,
  borderRadius: "8px",
  textTransform: "none" as const,
  px: "9px",
  py: "3px",
};

export function RescheduleNotificationActions({
  notification,
  colors,
  onMarkAsRead,
  onApprove,
  onReject,
}: RescheduleNotificationActionsProps) {
  const isDecided = notification.actionStatus !== "PENDING";

  if (isDecided) {
    return (
      <Typography sx={{ fontSize: 11, color: colors.textDim, fontWeight: 600 }}>
        No further action
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
      {notification.readStatus === "UNREAD" && (
        <Tooltip title="Mark as read" arrow>
          <Button
            size="small"
            variant="text"
            startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
            onClick={() => onMarkAsRead(notification.id)}
            aria-label={`Mark ${notification.crqNo} as read`}
            sx={{ ...pillButtonSx, color: colors.accent, "&:hover": { background: colors.accentDim } }}
          >
            Read
          </Button>
        </Tooltip>
      )}
      <Tooltip title="Approve reschedule request" arrow>
        <Button
          size="small"
          startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
          onClick={() => onApprove(notification.id)}
          aria-label={`Approve reschedule for ${notification.crqNo}`}
          sx={{
            ...pillButtonSx,
            color: colors.success,
            border: `1.5px solid ${colors.successBorder}`,
            background: colors.successDim,
            "&:hover": { background: colors.successBorder },
          }}
        >
          Approve
        </Button>
      </Tooltip>
      <Tooltip title="Reject reschedule request" arrow>
        <Button
          size="small"
          startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
          onClick={() => onReject(notification.id)}
          aria-label={`Reject reschedule for ${notification.crqNo}`}
          sx={{
            ...pillButtonSx,
            color: colors.danger,
            border: `1.5px solid ${colors.dangerBorder}`,
            background: colors.dangerDim,
            "&:hover": { background: colors.dangerBorder },
          }}
        >
          Reject
        </Button>
      </Tooltip>
    </Stack>
  );
}
