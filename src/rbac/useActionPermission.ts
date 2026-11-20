// src/rbac/useActionPermission.ts
import { useMemo } from "react";

import { useAppSelector } from "../app/hooks";

// ─────────────────────────────────────────────────────────────────────────────
//  Action permissions, for any module
//
//  A button needs a permission CODE on a SUB-MODULE of a MODULE, read straight
//  from the login RBAC payload (auth.user.moduleHierarchy). Codes are created
//  in Global Settings → Admin Settings (name "CRQ Reschedule" → code
//  CRQ_RESCHEDULE) and granted per role on each sub-module.
//
//  Why sub-module level: the module-level list (auth.user.modules, used by
//  usePermission().can) is the union of every sub-module, so a code granted on
//  one sub-module would otherwise unlock buttons on all of them.
//
//  Modules wrap this with their own typed codes / sub-module names so typos
//  fail to compile — see features/cabManager/rbac/useCabPermission.ts.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True when the user holds `code` on `subModule` of `module`. With a list of
 * codes, true when the user holds ANY of them.
 *
 *   const canApprove = useActionPermission("Cab Manager", "All CRQs", "CRQ_APPROVE");
 */
export function useActionPermission(
  module: string,
  subModule: string,
  code: string | readonly string[],
): boolean {
  const moduleHierarchy = useAppSelector((s) => s.auth.user?.moduleHierarchy);
  // Joined so a list literal created on every render doesn't defeat useMemo.
  const key = (typeof code === "string" ? [code] : code).join(",");

  return useMemo(() => {
    const granted = moduleHierarchy
      ?.find((m) => m.moduleName === module)
      ?.subModules.find((sm) => sm.subModuleName === subModule)
      ?.permissions.map((p) => p.permissionCode.trim().toUpperCase());
    if (!granted?.length) return false;
    return key.split(",").some((c) => granted.includes(c.trim().toUpperCase()));
  }, [moduleHierarchy, module, subModule, key]);
}
