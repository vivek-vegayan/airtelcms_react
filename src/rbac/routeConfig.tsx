import DashboardIcon from "@mui/icons-material/Dashboard";
import Groups2Icon from "@mui/icons-material/Groups2";
import {
  CalendarMonth,
  SupervisedUserCircle,
} from "@mui/icons-material";
import MailIcon from "@mui/icons-material/Mail";
import PersonIcon from "@mui/icons-material/Person";
import ViewTimelineOutlinedIcon from "@mui/icons-material/ViewTimelineOutlined";
import FilterTiltShiftIcon from "@mui/icons-material/FilterTiltShift";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import Badge from "@mui/material/Badge";

export interface SidebarItem {
  to: string;
  text: string;
  icon: React.ReactNode;
  requiredModule?: string | null;
}

export const getSidebarConfig = (inboxCount: number): SidebarItem[] => [
  {
    to: "/home",
    text: "Dashboard",
    icon: <DashboardIcon />,
    requiredModule: null,
  },
  {
    to: "/me",
    text: "Me",
    icon: <PersonIcon />,
    requiredModule: null,
  },
  {
    to: "/generateroster",
    text: "Roster Generator",
    icon: <ViewTimelineOutlinedIcon />,
    requiredModule: "Roster Managemement",
  },
  {
    to: "/team",
    text: "Team Management",
    icon: <Groups2Icon />,
    requiredModule: "Organization Hierarchy",
  },
  {
    to: "/scheduler",
    text: "Scheduler",
    icon: <FilterTiltShiftIcon />,
    requiredModule: "Role-Based Access Control",
  },
  {
    to: "/roster",
    text: "Roster View",
    icon: <CalendarMonth />,
    requiredModule: "Roster Managemement",
  },
  {
    to: "/inbox",
    text: "Inbox",
    icon: (
      <Badge badgeContent={inboxCount} color="error">
        <MailIcon />
      </Badge>
    ),
    requiredModule: "Notification System",
  },
  {
    to: "/user-management",
    text: "User Management",
    icon: <SupervisedUserCircle />,
    requiredModule: "User Management",
  },
  {
    to: "/analytics",
    text: "Analytics",
    icon: <InsightsRoundedIcon />,
    requiredModule: "CRQ Analytics",
  },
];