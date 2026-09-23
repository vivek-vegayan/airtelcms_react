import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

export const STATUS_OPTIONS = [
  {
    value: "Done" as const,
    label: "Pass",
    description: "Implementation completed successfully",
    icon: ThumbUpOutlinedIcon,
    palette: "success" as const,
  },
  {
    value: "Failed" as const,
    label: "Failed",
    description: "Implementation did not meet requirements",
    icon: ThumbDownOutlinedIcon,
    palette: "error" as const,
  },
  {
    value: "canceled" as const,
    label: "Cancelled",
    description: "Implementation was cancelled before completion",
    icon: CancelOutlinedIcon,
    palette: "warning" as const,
  },
] as const;
