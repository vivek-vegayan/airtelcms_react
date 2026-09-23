import { Navigate } from "react-router";
import { usePermission } from "../rbac/usePermission";
import { getFirstAccessiblePath } from "../rbac/routeAccess";
import AccessDenied from "../rbac/AccessDenied";

/**
 * Replaces the old hardcoded `<Navigate to="/home" />` used for both the
 * root index route and the catch-all 404 route. Dashboard is just another
 * permission-gated module now, so the "default" landing page must be
 * computed per-user instead of assumed.
 */
const DefaultRedirect = () => {
  const { hasModule, hasSubModule } = usePermission();
  const target = getFirstAccessiblePath(hasModule, hasSubModule);

  if (!target) return <AccessDenied reason="no-modules" />;
  return <Navigate to={target} replace />;
};

export default DefaultRedirect;
