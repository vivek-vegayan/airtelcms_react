// src/rbac/ActionGate.tsx
import type { ReactNode } from "react";

import { useActionPermission } from "./useActionPermission";

interface Props {
  /** WEB_MODULE name exactly as returned at login, e.g. "Cab Manager". */
  module: string;
  /** WEB_SUB_MODULE name under that module, e.g. "All CRQs". */
  subModule: string;
  /** Required permission code, or a list where holding ANY one is enough. */
  code: string | readonly string[];
  children: ReactNode;
  /** Rendered instead of nothing when the user lacks the permission. */
  fallback?: ReactNode;
}

/**
 * Renders its children only when the user holds the permission code on that
 * sub-module. Works for any module; checks codes per sub-module, unlike the
 * older PermissionGate, which checks CRUD actions per module.
 *
 *   <ActionGate module="Cab Manager" subModule="All CRQs" code="CRQ_APPROVE">
 *     <Button onClick={approve}>Approve</Button>
 *   </ActionGate>
 *
 * For table options rather than elements (row selection, action columns),
 * use the useActionPermission hook instead.
 */
export function ActionGate({ module, subModule, code, children, fallback = null }: Props) {
  return useActionPermission(module, subModule, code) ? <>{children}</> : <>{fallback}</>;
}
