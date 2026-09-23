
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssignmentIcon from "@mui/icons-material/Assignment";

export const getModuleIcon = (moduleKey: string) => {
  const key = moduleKey.toUpperCase();
  if (key.includes("ROSTER")) return <CalendarMonthIcon fontSize="small" />;
  if (key.includes("TASK")) return <AssignmentIcon fontSize="small" />;
  if (key.includes("LEAVE")) return <AccessTimeIcon fontSize="small" />;
  return <NotificationsIcon fontSize="small" />;
};
