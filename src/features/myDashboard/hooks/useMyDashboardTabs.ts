import { useMemo } from "react";
import { usePermission } from "../../../rbac/usePermission";
import { isNavItemAllowed } from "../../../rbac/navRegistry";
import {
  MY_DASHBOARD_VISIBLE_TABS,
  type MyDashboardTab,
} from "../config/dashboardTabs";

/**
 * The tabs this user may actually open, filtered through the very same
 * `isNavItemAllowed` predicate the sidebar and PrivateRoute use. Nothing
 * here knows about role codes — a tab appears iff the live WEB_* grants say
 * so, which is what keeps Notification Manager hidden for roles that were
 * never granted its sub-module.
 */
export const useMyDashboardTabs = (): MyDashboardTab[] => {
  const { hasModule, hasSubModule } = usePermission();

  return useMemo(
    () =>
      MY_DASHBOARD_VISIBLE_TABS.filter((tab) =>
        isNavItemAllowed(tab, hasModule, hasSubModule),
      ),
    [hasModule, hasSubModule],
  );
};
