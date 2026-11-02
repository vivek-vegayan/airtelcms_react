// Same icons the sidebar (rbac/navRegistry.tsx) uses for each module, so a
// notification reads as belonging to the screen it came from.
import CalendarMonthIcon from "@mui/icons-material/CalendarMonthOutlined";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenterOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHorizOutlined";
import Groups2Icon from "@mui/icons-material/Groups2Outlined";
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircleOutlined";
import InsightsIcon from "@mui/icons-material/InsightsOutlined";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import CloudSyncIcon from "@mui/icons-material/CloudSyncOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import EventBusyIcon from "@mui/icons-material/EventBusyOutlined";
import NotificationsIcon from "@mui/icons-material/NotificationsOutlined";

// First match wins, so more specific keys (REASSIGN, CAB) come before
// broader ones (CRQ, TEAM).
const MODULE_ICONS: [string[], typeof NotificationsIcon][] = [
  [["REASSIGN"], SwapHorizIcon],
  [["CAB"], BusinessCenterIcon],
  [["ROSTER", "SHIFT"], CalendarMonthIcon],
  [["LEAVE"], EventBusyIcon],
  // "SCHEDUL" covers SCHEDULER, SCHEDULING and SCHEDULE codes.
  [["SCHEDUL", "CRQ"], ScheduleIcon],
  [["TASK", "PLAN", "ACTIVITY"], AssignmentIcon],
  [["REPORT"], AssessmentIcon],
  [["TEAM"], Groups2Icon],
  [["USER"], SupervisedUserCircleIcon],
  [["ANALYTIC"], InsightsIcon],
  [["SFTP"], CloudSyncIcon],
  [["SETTING", "FREEZE", "HOLIDAY", "CONFIG"], SettingsIcon],
];

export const getModuleIcon = (moduleKey: string) => {
  const key = moduleKey.toUpperCase();
  const Icon =
    MODULE_ICONS.find(([keys]) => keys.some((k) => key.includes(k)))?.[1] ??
    NotificationsIcon;
  return <Icon fontSize="small" />;
};
