import { type ReactNode } from "react";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboardOutlined";
import Groups2Icon from "@mui/icons-material/Groups2Outlined";
import AltRouteIcon from "@mui/icons-material/AltRouteOutlined";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenterOutlined";
import ViewTimelineOutlinedIcon from "@mui/icons-material/ViewTimelineOutlined";
import CalendarMonth from "@mui/icons-material/CalendarMonthOutlined";
import SupervisedUserCircle from "@mui/icons-material/SupervisedUserCircleOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import MailIcon from "@mui/icons-material/MailOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import TuneIcon from "@mui/icons-material/TuneOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsOutlined";
import InsightsRoundedIcon from "@mui/icons-material/InsightsOutlined";
import DashboardRoundedIcon from "@mui/icons-material/DashboardOutlined";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsOutlined";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeOutlined";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonthOutlined";
import SchemaIcon from "@mui/icons-material/SchemaOutlined";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import TerminalIcon from "@mui/icons-material/TerminalOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import {
  MY_DASHBOARD_BASE,
  MY_DASHBOARD_VISIBLE_TABS,
} from "../features/myDashboard/config/dashboardTabs";
/** The minimal shape `isNavItemAllowed` needs in order to decide one grant. */
export interface AccessRequirement {
  requiredModule: string | null;
  /** When set, gates on a specific sub-module of requiredModule instead of the whole module. */
  requiredSubModule?: string;
  /** When set, the item is allowed if ANY listed requirement is satisfied. */
  requiredAnyOf?: AccessRequirement[];
  /**
   * When true, only a super-admin role satisfies this — whatever modules the
   * user holds. Used by screens whose access must not be delegable from Global
   * Settings (the Audit Log), where a WEB_* grant would let an administrator
   * hand out a screen the server still refuses.
   */
  requiredSuperAdmin?: boolean;
}

export interface NavItem extends AccessRequirement {
  to: string;
  text: string;
  icon: ReactNode;
  showBadge?: boolean;

  matchPaths?: string[];
  children?: Omit<NavItem, "children">[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
  /*
   * "Dashboard" (/home) and "Me" (/me, itself carrying an in-page tab strip)
   * used to be two top-level entries wrapping five screens between them.
   * They are now one workspace, generated from MY_DASHBOARD_VISIBLE_TABS so that the
   * sidebar, the router, the in-page tabs and the direct-URL route guard can
   * never disagree about which of them a given user may open.
   *
   * The parent declares `requiredAnyOf` rather than a single requiredModule
   * because it spans two modules ("Dashboard" and "Me"): it appears when the
   * user can reach at least one tab underneath it, and disappears entirely
   * when they can reach none.
   */
  {
    to: MY_DASHBOARD_BASE,
    text: "My Dashboard",
    icon: <SpaceDashboardIcon />,
    requiredModule: null,
    requiredAnyOf: MY_DASHBOARD_VISIBLE_TABS.map(
      ({ requiredModule, requiredSubModule }) => ({
        requiredModule,
        requiredSubModule,
      }),
    ),
    children: MY_DASHBOARD_VISIBLE_TABS.map((tab) => ({
      to: tab.to,
      text: tab.label,
      icon: tab.icon,
      requiredModule: tab.requiredModule,
      requiredSubModule: tab.requiredSubModule,
      matchPaths: [tab.to],
    })),
  },
  {
    to: "/cabmanager",
    text: "Cab Manager",
    icon: <BusinessCenterIcon />,
    requiredModule: "Cab Manager",
    children: [
      {
        to: "/cabmanager/dashboard",
        text: "Dashboard",
        icon: <DashboardIcon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "Dashboard",
        matchPaths: ["/cabmanager/dashboard"],
      },
      {
        to: "/cabmanager/planning",
        text: "Cab Planning",
        icon: <EventNoteOutlinedIcon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "Cab Planning",
        matchPaths: ["/cabmanager/planning"],
      },
      {
        to: "/cabmanager/sessions",
        text: "Cab Sessions",
        icon: <Groups2Icon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "Cab Sessions",
        matchPaths: ["/cabmanager/sessions"],
      },
      {
        to: "/cabmanager/mycrqs",
        text: "My CRQs",
        icon: <CheckCircleOutlineIcon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "My CRQs",
        matchPaths: ["/cabmanager/mycrqs"],
      },
      {
        to: "/cabmanager/allcrqs",
        text: "All CRQs",
        icon: <ListAltOutlinedIcon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "All CRQs",
        matchPaths: ["/cabmanager/allcrqs"],
      },
      {
        to: "/cabmanager/journey",
        text: "CRQ Journey",
        icon: <AltRouteIcon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "CRQ Journey",
        matchPaths: ["/cabmanager/journey"],
      },
      {
        to: "/cabmanager/implementation",
        text: "Implementation",
        icon: <PlayArrowOutlinedIcon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "Implementation",
        matchPaths: ["/cabmanager/implementation"],
      },
      {
        to: "/cabmanager/admin",
        text: "Admin Config",
        icon: <SettingsIcon />,
        requiredModule: "Cab Manager",
        requiredSubModule: "Admin Config",
        matchPaths: ["/cabmanager/admin"],
      },
    ],
  },
  {
    to: "/team",
    text: "Team Management",
    icon: <Groups2Icon />,
    requiredModule: "Team Management",
  },
  {
    to: "/scheduler",
    text: "Scheduler",
    icon: <ScheduleIcon />,
    requiredModule: "Scheduler",
    /*
     * These children used to declare `requiredModule: "Role-Based Access
     * Control"` — the admin RBAC module (WEB_MODULE 21), copy-pasted rather
     * than intended. The effect was that a Scheduler page only appeared for
     * someone holding BOTH Scheduler and the admin RBAC module, so every role
     * granted Scheduler alone (a team member, most notably) saw the parent
     * item with no children under it and could never reach CRQ Workflow.
     *
     * They now gate on the Scheduler module the pages actually belong to.
     * Sub-module names below are the live WEB_SUB_MODULE rows under module 5
     * verbatim — "Plan VIew And Setup" really is spelled with that capital I
     * in the database, and matching it exactly is what makes the grant work.
     * CRQ Journey has no sub-module row of its own, so it stays gated at
     * module level rather than inventing a name no grant could ever satisfy.
     */
    children: [
      {
        // Default child — matches /scheduler AND /scheduler/crqWorkflow (and detail pages)
        to: "/scheduler/crqWorkflow",
        text: "CRQ Workflow",
        icon: <CalendarMonthIcon />,
        requiredModule: "Scheduler",
        requiredSubModule: "Shift Scheduler",
        // Also highlight when drilling into a CRQ detail: /scheduler/crqWorkflow/ABC123
        matchPaths: ["/scheduler/crqWorkflow"],
      },
      {
        to: "/scheduler/planviewandsetup",
        text: "Plan",
        icon: <AssignmentIcon />,
        requiredModule: "Scheduler",
        requiredSubModule: "Plan VIew And Setup",
        matchPaths: ["/scheduler/taskconfig", "/scheduler/planviewandsetup"],
      },
      /* Hidden from tab + route (task planning page disabled)
      {
        to: "/scheduler/taskplanning",
        text: "Task Planning",
        icon: <SchemaIcon />,
        requiredModule: "Scheduler",
        matchPaths: ["/scheduler/taskplanning"],
      },
      */
      {
        to: "/scheduler/crqjourney",
        text: "CRQ Journey",
        icon: <AltRouteIcon />,
        requiredModule: "Scheduler",
        matchPaths: ["/scheduler/crqjourney"],
      },
      {
        /*
         * Read-only register of every cancelled CRQ, across all seven stages.
         * Gated at module level like CRQ Journey above: there is no
         * WEB_SUB_MODULE row under module 5 for it, and naming one that does
         * not exist would read as "not granted" for every user.
         */
        to: "/scheduler/cancelledcrq",
        text: "Cancelled CRQs",
        icon: <BlockOutlinedIcon />,
        requiredModule: "Scheduler",
        matchPaths: ["/scheduler/cancelledcrq"],
      },
    ],
  },
  {
    to: "/roster",
    text: "Roster",
    icon: <CalendarMonth />,
    requiredModule: "Roster Managemement",
    children: [
      {
        to: "/roster/view",
        text: "Roster View",
        icon: <CalendarMonth />,
        requiredModule: "Roster Managemement",
        matchPaths: ["/roster/view"],
      },
      {
        to: "/roster/generation",
        text: "Roster Generation",
        icon: <ViewTimelineOutlinedIcon />,
        requiredModule: "Roster Managemement",
        matchPaths: ["/roster/generation"],
      },
    ],
  },
  {
    /*
     * Gated on "Inbox" (WEB_MODULE 7 — sub-modules "Notification" and
     * "Action", i.e. exactly the two routes under /inbox), not on
     * "Notification System" (WEB_MODULE 22), which this previously named.
     * Module 22 is the admin-side notification config module — its
     * sub-modules are Notification Configuration / Queue / Template — and
     * it is only granted to SUPER_ADMIN, FUNCTION_HEAD and SUB_DOMAIN_HEAD.
     * So Inbox appeared for those three by coincidence while TEAM_MEMBER and
     * VERTICAL_HEAD, who hold the real Inbox module, never saw the item no
     * matter what was granted to them.
     */
    to: "/inbox",
    text: "Inbox",
    icon: <MailIcon />,
    requiredModule: "Inbox",
    showBadge: true,
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
    children: [
      {
        to: "/analytics/dashboard",
        text: "Dashboard",
        icon: <DashboardRoundedIcon />,
        requiredModule: "CRQ Analytics",
        matchPaths: ["/analytics/dashboard"],
      },
      {
        to: "/analytics/crq-analytics",
        text: "CRQ Analytics",
        icon: <QueryStatsRoundedIcon />,
        requiredModule: "CRQ Analytics",
        matchPaths: ["/analytics/crq-analytics"],
      },
      {
        to: "/analytics/reports",
        text: "Reports",
        icon: <SummarizeRoundedIcon />,
        requiredModule: "CRQ Analytics",
        matchPaths: ["/analytics/reports"],
      },
    ],
  },
  {
    to: "/sftp-management",
    text: "SFTP Management",
    icon: <CloudSyncOutlinedIcon />,
    requiredModule: "SFTP Management",
    children: [
      {
        to: "/sftp-management/windows",
        text: "Windows",
        icon: <DnsOutlinedIcon />,
        requiredModule: "SFTP Management",
        requiredSubModule: "Windows",
        matchPaths: ["/sftp-management/windows"],
      },
      {
        to: "/sftp-management/linux",
        text: "Linux",
        icon: <TerminalIcon />,
        requiredModule: "SFTP Management",
        requiredSubModule: "Linux",
        matchPaths: ["/sftp-management/linux"],
      },
    ],
  },
  {
    // No dedicated module exists server-side yet, so this rides on the
    // CRQ Analytics grant — the same audience the reports were built for.
    to: "/team-report",
    text: "Team Report",
    icon: <AssessmentIcon />,
    requiredModule: "CRQ Analytics",
  },
  {
    to: "/global-settings",
    text: "Global Settings",
    icon: <SettingsIcon />,
    requiredModule: "Global Settings",
    children: [
      {
        to: "/global-settings/networkfreezsetting",
        text: "Network Settings",
        icon: <NotificationsNoneIcon />,
        requiredModule: "Global Settings",
        requiredSubModule: "Network Settings",
      },
      {
        to: "/global-settings/adminsetting",
        text: "Admin Settings",
        icon: <TuneIcon />,
        requiredModule: "Global Settings",
        requiredSubModule: "Admin Settings",
      },
      {
        to: "/global-settings/orgconfig",
        text: "Organization Settings",
        icon: <SchemaIcon />,
        requiredModule: "Global Settings",
        requiredSubModule: "Organization Settings",
      },
    ],
  },
];

/**
 * Route entries that are guarded like nav items but are NOT shown in the
 * sidebar — screens reached as a tab inside another workspace.
 *
 * `routeAccess` folds these into the same flat list it builds from
 * `ALL_NAV_ITEMS`, so a direct URL to one is refused by exactly the predicate
 * that governs everything else; `useSidebarNav` reads only `ALL_NAV_ITEMS`, so
 * the sidebar's shape is untouched.
 *
 * Without this, /user-management/auditlog would prefix-match the plain
 * "/user-management" entry and be allowed for anyone holding the User
 * Management module.
 */
export const ROUTE_ONLY_ACCESS_ENTRIES: Array<
  AccessRequirement & { to: string; matchPaths?: string[] }
> = [
  {
    to: "/user-management/auditlog",
    requiredModule: null,
    requiredSuperAdmin: true,
    matchPaths: ["/user-management/auditlog"],
  },
];

export const isNavItemAllowed = (
  item: AccessRequirement,
  hasModule: (moduleName: string) => boolean,
  hasSubModule: (moduleName: string, subModuleName: string) => boolean,
  /**
   * Optional and defaulted to false so every existing caller keeps working
   * unchanged — and so that a `requiredSuperAdmin` entry fails closed for any
   * caller that has not been taught about it.
   */
  isSuperAdmin: boolean = false,
): boolean => {
  // Evaluated before the `requiredModule === null` shortcut below, so a group
  // spanning several modules can declare `requiredModule: null` and still be
  // gated — otherwise that null would read as "open to every signed-in user".
  if (item.requiredAnyOf?.length) {
    return item.requiredAnyOf.some((req) =>
      isNavItemAllowed(req, hasModule, hasSubModule, isSuperAdmin),
    );
  }
  // Checked before the null shortcut for the same reason: a super-admin-only
  // entry declares no module, and that must not read as "open to everyone".
  if (item.requiredSuperAdmin && !isSuperAdmin) return false;
  if (item.requiredModule === null) return true;
  if (item.requiredSubModule) {
    return hasSubModule(item.requiredModule, item.requiredSubModule);
  }
  return hasModule(item.requiredModule);
};
