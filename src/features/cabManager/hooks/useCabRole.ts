import { useMemo } from "react";

import { ROLES } from "../data/cabManager.mock";
import type { Persona, Role } from "../types/types";
import { usePermission } from "../../../rbac/usePermission";
import { resolveCabRole } from "../rbac/cabRoles";

/**
 * Cab Manager persona for the current user, resolved from the logged-in
 * user's auth roleCode (src/rbac/usePermission.ts) through the CAB role
 * registry (../rbac/cabRoles.ts).
 */
export function useCabRole() {
  const { roleCode } = usePermission();

  return useMemo(() => {
    const role: Role = resolveCabRole(roleCode);
    const persona: Persona = ROLES[role];
    return { role, persona };
  }, [roleCode]);
}
