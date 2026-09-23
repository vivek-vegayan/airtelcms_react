// src/rbac/PermissionGate.tsx
import type { ReactNode } from "react";
import { usePermission, type PermAction } from "./usePermission";

interface Props {
  /** The API moduleName exactly as returned — e.g. "User Management" */
  module: string;
  /** The action required — e.g. "DELETE" */
  action: PermAction;
  /** What to render when the user has permission */
  children: ReactNode;
  /** Optional fallback — renders this instead of nothing when permission is denied */
  fallback?: ReactNode;
}

/**
 * Usage:
 *   <PermissionGate module="User Management" action="DELETE">
 *     <IconButton onClick={handleDelete}>...</IconButton>
 *   </PermissionGate>
 */
export const PermissionGate = ({ module, action, children, fallback = null }: Props) => {
  const { can } = usePermission();
  return can(module, action) ? <>{children}</> : <>{fallback}</>;
};