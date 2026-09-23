import { Chip, alpha } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { getStatusChipColor } from "../utils/leave.utils";
import type { LeaveStatus } from "../types/leave.types";

interface LeaveStatusChipProps {
  status: LeaveStatus;
}

const STATUS_META: Record<
  string,
  { bgColor: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    bgColor: alpha("#F59E0B", 0.12),
    color: "#D97706",
    icon: <AccessTimeRoundedIcon sx={{ fontSize: "13px !important" }} />,
  },
  APPROVED: {
    bgColor: alpha("#10B981", 0.12),
    color: "#059669",
    icon: <CheckCircleRoundedIcon sx={{ fontSize: "13px !important" }} />,
  },
  REJECTED: {
    bgColor: alpha("#EF4444", 0.12),
    color: "#DC2626",
    icon: <CancelRoundedIcon sx={{ fontSize: "13px !important" }} />,
  },
};

/**
 * Reusable status chip — colour logic lives in utils, not scattered inline.
 */
export const LeaveStatusChip = ({ status }: LeaveStatusChipProps) => {
  const meta = STATUS_META[status?.toUpperCase()] ?? {
    bgColor: alpha("#94A3B8", 0.12),
    color: "#64748B",
    icon: null,
  };

  return (
    <Chip
      label={status}
      size="small"
      icon={meta.icon as React.ReactElement}
      sx={{
        height: 26,
        fontWeight: 700,
        fontSize: "0.72rem",
        letterSpacing: "0.03em",
        textTransform: "capitalize",
        minWidth: 90,
        background: meta.bgColor,
        color: meta.color,
        border: "none",
        borderRadius: "8px",
        "& .MuiChip-icon": {
          color: meta.color,
          ml: 0.75,
        },
        "& .MuiChip-label": {
          px: 1,
        },
      }}
    />
  );
};

// import { Chip } from "@mui/material";
// import { getStatusChipColor } from "../utils/leave.utils";
// import type { LeaveStatus } from "../types/leave.types";

// interface LeaveStatusChipProps {
//   status: LeaveStatus;
// }

// /**
//  * Reusable status chip — colour logic lives in utils, not scattered inline.
//  */
// export const LeaveStatusChip = ({ status }: LeaveStatusChipProps) => (
//   <Chip
//     label={status}
//     color={getStatusChipColor(status)}
//     size="small"
//     sx={{ fontWeight: 600, minWidth: 84, textTransform: "capitalize" }}
//   />
// );