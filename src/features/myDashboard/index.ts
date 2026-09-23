export { default as MyDashboardPage } from "./pages/MyDashboardPage";
export { default as MyDashboardIndexRedirect } from "./pages/MyDashboardIndexRedirect";
export {
  MY_DASHBOARD_BASE,
  MY_DASHBOARD_TABS,
  MY_DASHBOARD_VISIBLE_TABS,
  MY_DASHBOARD_HIDDEN_SEGMENTS,
  MY_DASHBOARD_LEGACY_REDIRECTS,
  findTabByPath,
  type MyDashboardTab,
} from "./config/dashboardTabs";
export { useMyDashboardTabs } from "./hooks/useMyDashboardTabs";
