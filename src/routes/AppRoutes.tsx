import React, { type JSX, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router";
import { PrivateRoute } from "./PrivateRoute";
import DefaultRedirect from "./DefaultRedirect";
import CommonContainer from "../components/common/CommonContainer";
import { RouteFallback } from "../components/loading/PageLoader";
import LegacyRedirect from "./LegacyRedirect";
import {
  MY_DASHBOARD_BASE,
  MY_DASHBOARD_HIDDEN_SEGMENTS,
  MY_DASHBOARD_LEGACY_REDIRECTS,
  MY_DASHBOARD_VISIBLE_TABS,
} from "../features/myDashboard/config/dashboardTabs";

// Route-level code splitting — every feature page below is fetched on
// first navigation instead of bundled eagerly into the initial load. The
// <Suspense fallback={<RouteFallback/>}> already wrapping <Routes> further
// down (previously dead weight, since nothing here was lazy) is what
// makes this work with no new boundaries needed. Named exports from a
// feature's barrel `index.ts` resolve to the same dynamic import
// specifier, so the bundler still only fetches one chunk per feature.
const TeamManagementPage = lazy(
  () => import("../features/teamManagement/pages/TeamManagementPage"),
);
const TeamManagementMain = lazy(() =>
  import("../features/teamManagement/pages/TeamManagementMain").then((m) => ({
    default: m.TeamManagementMain,
  })),
);
const MyDashboardPage = lazy(
  () => import("../features/myDashboard/pages/MyDashboardPage"),
);
const MyDashboardIndexRedirect = lazy(
  () => import("../features/myDashboard/pages/MyDashboardIndexRedirect"),
);
const MonthlyRosterPageTab = lazy(
  () => import("../features/roster/page/MonthlyRosterPageTab"),
);
const RosterViewMain = lazy(() =>
  import("../features/roster/page/RosterViewMain").then((m) => ({
    default: m.RosterViewMain,
  })),
);
const UserRosterMain = lazy(() =>
  import("../features/userMe/pages/UserRosterMain").then((m) => ({
    default: m.UserRosterMain,
  })),
);
const InboxPageTab = lazy(() => import("../features/inbox/InboxPageTab"));
const TaskInbox = lazy(() => import("../features/inbox/components/TaskInbox"));
const SchedulerMainTab = lazy(
  () => import("../features/scheduler/page/SchedulerMainTab"),
);
const NotificationManagerMain = lazy(
  () => import("../features/userMe/pages/NotificationManagerMain"),
);
const UserLeaveSectionMain = lazy(() =>
  import("../features/userMe/pages/UserLeaveSectionMain").then((m) => ({
    default: m.UserLeaveSectionMain,
  })),
);
const CrqDetailedView = lazy(() =>
  import("../features/scheduler/components/plan-and-inventory/CrqDetailedView").then(
    (m) => ({
      default: m.CrqDetailedView,
    }),
  ),
);
const RosterGenerationMain = lazy(() =>
  import("../features/rosterGenerator/pages/RosterGenerationMain").then(
    (m) => ({
      default: m.RosterGenerationMain,
    }),
  ),
);
const UserManagementLayout = lazy(
  () => import("../features/userManagement/layout/UserManagementLayout"),
);
const UserLogs = lazy(() =>
  import("../features/userManagement/pages/UserLogs").then((m) => ({
    default: m.UserLogs,
  })),
);
const AuditLog = lazy(() =>
  import("../features/userManagement/pages/AuditLog").then((m) => ({
    default: m.AuditLog,
  })),
);
const NetworkManagementTabView = lazy(
  () => import("../features/settings/page/NetworkManagementTabView"),
);
const GlobalSettingsIndexRedirect = lazy(() =>
  import("../features/settings/page/NetworkManagementTabView").then((m) => ({
    default: m.GlobalSettingsIndexRedirect,
  })),
);
const Holidayandnetworkschedulemanagermain = lazy(
  () =>
    import("../features/settings/holiday/pages/Holidayandnetworkschedulemanagermain"),
);
const PlanViewAndSetup = lazy(() =>
  import("../features/scheduler/sub-feature/planViewAndSetup/PlanViewAndSetup").then(
    (m) => ({
      default: m.PlanViewAndSetup,
    }),
  ),
);
const PlanViewAndSetupTab = lazy(
  () => import("../features/scheduler/page/PlanViewAndSetupTab"),
);
const CancelledCrqTab = lazy(
  () => import("../features/scheduler/page/CancelledCrqTab"),
);
const CancelledCrqMain = lazy(() =>
  import("../features/scheduler/sub-feature/cancelledCrq/CancelledCrqMain").then(
    (m) => ({ default: m.CancelledCrqMain }),
  ),
);
const TaskConfigMain = lazy(() =>
  import("../features/scheduler/sub-feature/taskConfig/TaskConfigMain").then(
    (m) => ({ default: m.TaskConfigMain }),
  ),
);
const ModernHomeDashboard = lazy(
  () => import("../features/dashboard/pages/ModernHomeDashboard"),
);
const AdminSettingDashboard = lazy(() =>
  import("../features/settings/globalAdminSetting").then((m) => ({
    default: m.AdminSettingDashboard,
  })),
);
const OrganizationConfigPage = lazy(() =>
  import("../features/settings/orgConfig").then((m) => ({
    default: m.OrganizationConfigPage,
  })),
);
// Hidden from tab + route (task planning page disabled)
// const TaskPlanningMain = lazy(() => import("../features/scheduler/sub-feature/taskPlanning/TaskPlanningMain"));
const CrqJourneyMain = lazy(() =>
  import("../features/crqJourney/CrqJourneyMain").then((m) => ({
    default: m.CrqJourneyMain,
  })),
);
const PlanAndInventoryMain = lazy(() =>
  import("../features/scheduler/page/SchedulerWorkflowMain").then((m) => ({
    default: m.PlanAndInventoryMain,
  })),
);

// Cab Manager pages
const CabDashboardPage = lazy(() =>
  import("../features/cabManager").then((m) => ({
    default: m.CabDashboardPage,
  })),
);
const AllCrqsPage = lazy(() =>
  import("../features/cabManager").then((m) => ({ default: m.AllCrqsPage })),
);
const MyCrqsPage = lazy(() =>
  import("../features/cabManager").then((m) => ({ default: m.MyCrqsPage })),
);
const CabPlanningPage = lazy(() =>
  import("../features/cabManager").then((m) => ({
    default: m.CabPlanningPage,
  })),
);
const CabSessionsPage = lazy(() =>
  import("../features/cabManager").then((m) => ({
    default: m.CabSessionsPage,
  })),
);
const ImplementationPage = lazy(() =>
  import("../features/cabManager").then((m) => ({
    default: m.ImplementationPage,
  })),
);
const AdminPage = lazy(() =>
  import("../features/cabManager").then((m) => ({ default: m.AdminPage })),
);
const CabManagerMainPageTab = lazy(
  () => import("../features/cabManager/pages/CabManagerMainPageTab"),
);
const CrqJourneyPage = lazy(() =>
  import("../features/crqJourney").then((m) => ({ default: m.CrqJourneyPage })),
);
const UserManagement = lazy(
  () => import("../features/userManagement/components/UserManagement"),
);
const AnalyticsMainPageTab = lazy(() =>
  import("../features/crqAnalytics").then((m) => ({
    default: m.AnalyticsMainPageTab,
  })),
);
const AnalyticsDashboardPage = lazy(() =>
  import("../features/crqAnalytics").then((m) => ({
    default: m.AnalyticsDashboardPage,
  })),
);
const CrqAnalyticsPage = lazy(() =>
  import("../features/crqAnalytics").then((m) => ({
    default: m.CrqAnalyticsPage,
  })),
);
const AnalyticsReportsPage = lazy(() =>
  import("../features/crqAnalytics").then((m) => ({
    default: m.AnalyticsReportsPage,
  })),
);
const TeamReportMainPage = lazy(() =>
  import("../features/teamReport").then((m) => ({
    default: m.TeamReportMainPage,
  })),
);
const CrqReassignMainPage = lazy(() =>
  import("../features/crqReassign").then((m) => ({
    default: m.CrqReassignMainPage,
  })),
);
const DataAgentPage = lazy(
  () => import("../features/dataAgent/pages/DataAgentPage"),
);
const SftpAppRedirect = lazy(() => import("./SftpAppRedirect"));

// The body each My Dashboard tab renders, keyed by the segment the registry
// declares — so a renamed tab cannot leave the router pointing at a path
// nothing links to, and a tab marked hidden simply never gets a route.
// Entries for hidden tabs stay here so switching one back on is a one-flag
// change in dashboardTabs.tsx.
const MY_DASHBOARD_TAB_ELEMENTS: Record<string, JSX.Element> = {
  overview: <ModernHomeDashboard />,
  "monthly-view": <UserRosterMain />,
  leave: <UserLeaveSectionMain />,
  notifications: <NotificationManagerMain />,
};

interface AppRoutesProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
  setNotificationCount?: (count: number) => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  setDynamicHeaderText,
  setDynamicHeaderIcon,
}) => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/*
          My Dashboard — the merged Home + Me workspace. One guarded shell,
          one routed body per tab, so only the tab in view is ever mounted
          (and only its data is ever fetched). PrivateRoute sits on the
          parent and re-evaluates the full pathname on every navigation, so
          a direct URL to a tab the user lacks is refused here too, not just
          hidden from the tab strip.
        */}
        <Route
          path="my-dashboard"
          element={
            <PrivateRoute
              element={
                <MyDashboardPage
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        >
          <Route index element={<MyDashboardIndexRedirect />} />
          {MY_DASHBOARD_VISIBLE_TABS.map((tab) => (
            <Route
              key={tab.segment}
              path={tab.segment}
              element={MY_DASHBOARD_TAB_ELEMENTS[tab.segment]}
            />
          ))}
          {/*
            Tabs hidden for now. Their URLs still resolve — landing on the
            workspace root rather than dead-ending on the catch-all — so any
            bookmark or stale link stays harmless until they return.
          */}
          {MY_DASHBOARD_HIDDEN_SEGMENTS.map((segment) => (
            <Route
              key={segment}
              path={segment}
              element={<LegacyRedirect to={MY_DASHBOARD_BASE} />}
            />
          ))}
        </Route>

        {/*
          Backward compatibility: /home and every /me/* URL that shipped keep
          resolving, so bookmarks, in-app deep links and anything holding an
          old URL land on the same screen as before. LegacyRedirect carries
          the query string, hash and location state across.
        */}
        {MY_DASHBOARD_LEGACY_REDIRECTS.map(({ from, to }) => (
          <Route
            key={from}
            path={from.replace(/^\//, "")}
            element={<LegacyRedirect to={to} />}
          />
        ))}
        <Route path="me/*" element={<LegacyRedirect to={MY_DASHBOARD_BASE} />} />
        <Route
          path="team"
          element={
            <PrivateRoute
              element={
                <TeamManagementPage
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        >
          <Route index element={<Navigate to="teammanagement" replace />} />
          <Route path="teammanagement" element={<TeamManagementMain />} />
          <Route
            path="taskconfiguration"
            element={
              <CommonContainer>Hello Task Configuration</CommonContainer>
            }
          />
        </Route>

        {/* {cabPortalRoutes} */}
        <Route
          path="cabmanager"
          element={
            <PrivateRoute
              element={
                <CabManagerMainPageTab
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        >
          {/* Dashboard hidden for now (2026-08-24) — see ROLE_SCREENS in
              cabManager.mock.ts. Route kept mounted so a bookmark or direct
              link still resolves; index redirect points at "sessions"
              instead since it's common to every role's tab list. */}
          <Route index element={<Navigate to="sessions" replace />} />
          <Route path="dashboard" element={<CabDashboardPage />} />
          <Route path="allcrqs" element={<AllCrqsPage />} />
          <Route path="mycrqs" element={<MyCrqsPage />} />
          <Route path="journey" element={<CrqJourneyPage />} />
          <Route path="journey/:id" element={<CrqJourneyPage />} />
          <Route path="planning" element={<CabPlanningPage />} />
          <Route path="sessions" element={<CabSessionsPage />} />
          <Route path="implementation" element={<ImplementationPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route
          path="analytics"
          element={
            <PrivateRoute
              element={
                <AnalyticsMainPageTab
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AnalyticsDashboardPage />} />
          <Route path="crq-analytics" element={<CrqAnalyticsPage />} />
          <Route path="reports" element={<AnalyticsReportsPage />} />
        </Route>

        <Route
          path="team-report"
          element={
            <PrivateRoute
              element={
                <TeamReportMainPage
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        />

        <Route
          path="crq-reassignment"
          element={
            <PrivateRoute
              element={
                <CrqReassignMainPage
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        />

        <Route
          path="roster"
          element={
            <PrivateRoute
              element={
                <MonthlyRosterPageTab
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        >
          <Route index element={<Navigate to="view" replace />} />
          <Route path="generation" element={<RosterGenerationMain />} />
          <Route path="view" element={<RosterViewMain />} />
        </Route>

        <Route
          path="inbox"
          element={
            <PrivateRoute
              element={
                <InboxPageTab
                  setDynamicHeaderText={setDynamicHeaderText}
                  setDynamicHeaderIcon={setDynamicHeaderIcon}
                />
              }
            />
          }
        >
          <Route index element={<Navigate to="notifications" replace />} />
          <Route path="notifications" element={<TaskInbox />} />
          <Route
            path="action"
            element={
              <>
                <>Notifications</>
              </>
            }
          />
        </Route>
        <Route
          path="scheduler"
          element={<PrivateRoute element={<SchedulerMainTab />} />}
        >
          <Route index element={<Navigate to="crqWorkflow" replace />} />
          {/* <Route path="crqWorkflow" element={<PlanAndInventoryMain />} /> */}
          <Route path="crqWorkflow" element={<PlanAndInventoryMain />} />
          <Route
            path="action"
            element={
              <>
                <>Notifications</>
              </>
            }
          />

          <Route path="crqWorkflow/:crqNo" element={<CrqDetailedView />} />
        </Route>
        <Route
          path="scheduler"
          element={<PrivateRoute element={<PlanViewAndSetupTab />} />}
        >
          <Route path="planviewandsetup" element={<PlanViewAndSetup />} />
          <Route path="taskconfig" element={<TaskConfigMain />} />
          {/* <Route path="taskplanning" element={<TaskPlanningMain />} /> */}
          <Route path="crqjourney" element={<CrqJourneyMain />} />
          <Route path="crqjourney/:id" element={<CrqJourneyMain />} />
        </Route>

        {/* Cancelled CRQ register — its own shell rather than a tab on the
            plan-authoring strip above, since it is a read-only record and not
            part of that flow. */}
        <Route
          path="scheduler"
          element={<PrivateRoute element={<CancelledCrqTab />} />}
        >
          <Route path="cancelledcrq" element={<CancelledCrqMain />} />
        </Route>

        <Route
          path="generateroster/*"
          element={<Navigate to="/roster/generation" replace />}
        />

        <Route
          path="user-management"
          element={
            // <PrivateRoute element={<Holidayandnetworkschedulemanagermain />} />
            // <PrivateRoute element={<Holidayandnetworkschedulemanagermain />} />
            <PrivateRoute element={<UserManagementLayout />} />
          }
        >
          <Route index element={<Navigate to="usermang" replace />} />
          <Route path="usermang" element={<UserManagement />} />
          <Route path="userlogs" element={<UserLogs />} />
          {/*
            Audit Log — super admin only. Guarded twice over: PrivateRoute on
            the parent re-evaluates the full pathname on every navigation and
            refuses this one for anyone else (see ROUTE_ONLY_ACCESS_ENTRIES in
            navRegistry), and the page itself fails closed if it is ever
            rendered from somewhere that skipped that check. The backend refuses
            the data independently of both.
          */}
          <Route path="auditlog" element={<AuditLog />} />
        </Route>
        {/* Moved to its own app (cms_sftp_react) — RBAC-gated hand-off. */}
        <Route
          path="sftp-management/*"
          element={<PrivateRoute element={<SftpAppRedirect />} />}
        />
        <Route path="global-settings">
          <Route
            element={<PrivateRoute element={<NetworkManagementTabView />} />}
          >
            {/* default tab — first one this role is actually allowed to open */}
            <Route index element={<GlobalSettingsIndexRedirect />} />

            {/* tab routes — direct-URL access is already gated by the
                PrivateRoute on the parent, which checks the full pathname */}
            <Route
              path="networkfreezsetting"
              element={<Holidayandnetworkschedulemanagermain />}
            />
            <Route path="adminsetting" element={<AdminSettingDashboard />} />
            <Route path="orgconfig" element={<OrganizationConfigPage />} />
          </Route>
        </Route>
        <Route
          path="data-agent"
          element={<PrivateRoute element={<DataAgentPage />} />}
        />

        <Route index element={<DefaultRedirect />} />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
