import { Navigate } from "react-router";
import AccessDenied from "../../../rbac/AccessDenied";
import { useMyDashboardTabs } from "../hooks/useMyDashboardTabs";

/**
 * `/my-dashboard` has no body of its own — it lands on the first tab this
 * user is actually allowed to open, rather than assuming Overview. Someone
 * holding "Me" but not "Dashboard" lands on Monthly View; someone holding
 * neither never reaches here at all (PrivateRoute stops them on the parent),
 * but the fallback below keeps that from ever being a blank screen.
 */
const MyDashboardIndexRedirect = () => {
  const tabs = useMyDashboardTabs();

  if (tabs.length === 0) return <AccessDenied reason="forbidden" />;
  return <Navigate to={tabs[0].to} replace />;
};

export default MyDashboardIndexRedirect;
