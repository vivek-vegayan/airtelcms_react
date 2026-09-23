import type { ReactNode } from "react";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

/** Root path of the merged workspace. Everything else derives from it. */
export const MY_DASHBOARD_BASE = "/my-dashboard";

export interface MyDashboardTab {
  /** Segment under MY_DASHBOARD_BASE — doubles as the <Route path>. */
  segment: string;
  /** Absolute path: `${MY_DASHBOARD_BASE}/${segment}`. */
  to: string;
  /** Tab label. */
  label: string;
  /** Copy pushed into the app-shell header while this tab is active. */
  headerText: string;
  /** One-liner shown under the page title. */
  caption: string;
  icon: ReactNode;
  /**
   * The exact two fields `isNavItemAllowed` already understands, so tab
   * visibility, sidebar visibility and direct-URL route protection are all
   * decided by one predicate against the live WEB_* grants — no role names
   * are named anywhere in this file.
   */
  requiredModule: string | null;
  requiredSubModule?: string;
  /** Pre-restructure URLs that must keep resolving here. */
  legacyPaths: string[];
  /**
   * Temporarily withdrawn from the app: no tab, no sidebar entry, no route.
   * The entry stays here rather than being deleted so its gating, copy and
   * legacy URLs survive intact until it is switched back on — clear this
   * flag and the tab, the sidebar child and the route all come back together.
   */
  hidden?: boolean;
}

/**
 * The single source of truth for My Dashboard: the router, the sidebar
 * registry, the in-page tab strip and the backward-compatibility redirects
 * are all generated from this list.
 *
 * Gating rationale — these mirror what each page required *before* the
 * merge, so no user loses a page they can open today:
 *
 *  - Overview was `/home`, gated at module level on "Dashboard".
 *  - Monthly View and Leave were `/me/*`, gated at module level on "Me"
 *    (the old Me shell rendered its tabs unconditionally).
 *  - Notifications is the one deliberate tightening: it now additionally
 *    requires the "Notification Manager" sub-module of "Me" (live
 *    WEB_SUB_MODULE row 5), which is the mechanism that decides who sees
 *    the Notification Manager. Roles without that grant get no tab, no
 *    route and no data fetch.
 */
export const MY_DASHBOARD_TABS: MyDashboardTab[] = [
  {
    segment: "overview",
    to: `${MY_DASHBOARD_BASE}/overview`,
    label: "Overview",
    headerText: "My Dashboard — Overview",
    caption: "Your day at a glance — attendance, assignments and schedule",
    icon: <SpaceDashboardOutlinedIcon />,
    requiredModule: "Dashboard",
    legacyPaths: ["/home"],
  },
  {
    segment: "monthly-view",
    to: `${MY_DASHBOARD_BASE}/monthly-view`,
    label: "Roster view",
    headerText: "My Dashboard — Monthly View",
    caption: "Your monthly roster calendar",
    icon: <CalendarMonthOutlinedIcon />,
    requiredModule: "Me",
    legacyPaths: ["/me/monthlyview"],
  },
  {
    segment: "leave",
    to: `${MY_DASHBOARD_BASE}/leave`,
    label: "Leave",
    headerText: "My Dashboard — Leave",
    caption: "Apply for leave and track your requests",
    icon: <EventNoteOutlinedIcon />,
    requiredModule: "Me",
    legacyPaths: ["/me/leave"],
  },
  {
    segment: "notifications",
    to: `${MY_DASHBOARD_BASE}/notifications`,
    label: "Notifications",
    headerText: "My Dashboard — Notifications",
    caption: "Configure who gets notified for each action",
    icon: <NotificationsActiveOutlinedIcon />,
    requiredModule: "Me",
    requiredSubModule: "Notification Manager",
    // Kept verbatim, typo and all — this is the URL that shipped.
    legacyPaths: ["/me/notifiactionmanger"],
  },
];

/**
 * The tabs currently in service. Everything user-facing — the tab strip, the
 * sidebar children, the router and the index redirect — reads this list, so
 * hiding a tab removes it from all four at once and leaves no reachable URL
 * pointing at it.
 */
export const MY_DASHBOARD_VISIBLE_TABS: MyDashboardTab[] =
  MY_DASHBOARD_TABS.filter((tab) => !tab.hidden);

/** Segments of the tabs hidden for now — their URLs redirect to the root. */
export const MY_DASHBOARD_HIDDEN_SEGMENTS: string[] = MY_DASHBOARD_TABS.filter(
  (tab) => tab.hidden,
).map((tab) => tab.segment);

/**
 * Every legacy path -> its new home, for the compatibility redirects. A
 * hidden tab's old URLs still resolve rather than dead-end, but they land on
 * the workspace root instead of a page that is no longer routed.
 */
export const MY_DASHBOARD_LEGACY_REDIRECTS: { from: string; to: string }[] = [
  ...MY_DASHBOARD_TABS.flatMap((tab) =>
    tab.legacyPaths.map((from) => ({
      from,
      to: tab.hidden ? MY_DASHBOARD_BASE : tab.to,
    })),
  ),
  // The old Me landing page had no body of its own — it index-redirected to
  // its first tab, which is exactly what MY_DASHBOARD_BASE does now.
  { from: "/me", to: MY_DASHBOARD_BASE },
];

/** Resolves the tab that owns a pathname (used for header + active state). */
export const findTabByPath = (pathname: string): MyDashboardTab | undefined =>
  MY_DASHBOARD_VISIBLE_TABS.find(
    (tab) => pathname === tab.to || pathname.startsWith(`${tab.to}/`),
  );
