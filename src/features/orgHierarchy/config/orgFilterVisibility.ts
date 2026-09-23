import { authStorage } from "../../../app/store/auth.storage";
import { hasSubModuleIn } from "../../../rbac/permissionCore";
import type { ModuleHierarchy } from "../../auth/types/auth.types";
import type { OrgFilterKey } from "../types/orgHierarchy.types";

/**
 * Legacy hardcoded role → visible-filter map.
 *
 * This used to be the ONLY thing deciding which of the four org-hierarchy
 * pickers a user was shown, which meant the "Organization Hierarchy" module
 * granted in Global Settings → Admin Setting (WEB_MODULE 20, sub-modules
 * "Organization Vertical / Function / Domain / Sub Domain") had no effect on
 * the UI whatsoever — a DOMAIN_HEAD granted "Organization Domain" VIEW still
 * only ever got a Sub Domain picker, because this table said so.
 *
 * It is now only the fallback for a user whose role holds no Organization
 * Hierarchy grants at all (see `resolveOrgFilterVisibility`), so those roles
 * keep behaving exactly as before rather than losing every filter.
 */
export const ORG_FILTER_VISIBILITY: Record<string, OrgFilterKey[]> = {
  SUPER_ADMIN: ["vertical", "teamFunction", "domain", "subDomain"],
  VERTICAL_HEAD: ["teamFunction", "domain", "subDomain"],
  FUNCTION_HEAD: ["domain", "subDomain"],
  DOMAIN_HEAD: ["subDomain"],
  TEAM_LEAD: ["teamFunction"],
  TEAM_MEMBER: [ "subDomain"],
  SUB_DOMAIN_HEAD: ["domain","subDomain"],
};

/** WEB_MODULE 20 — the module the four hierarchy sub-modules hang off. */
export const ORG_HIERARCHY_MODULE = "Organization Hierarchy";

/**
 * Filter key → live WEB_SUB_MODULE name under "Organization Hierarchy".
 * These strings must match the database rows verbatim (sub_module_id 54-57);
 * a mismatch silently reads as "not granted".
 */
export const ORG_FILTER_SUB_MODULE: Record<OrgFilterKey, string> = {
  vertical: "Organization Vertical",
  teamFunction: "Organization Function",
  domain: "Organization Domain",
  subDomain: "Organization Sub Domain",
};

/** Top-down hierarchy order; the pickers always render in this sequence. */
const ORG_FILTER_ORDER: OrgFilterKey[] = [
  "vertical",
  "teamFunction",
  "domain",
  "subDomain",
];

/**
 * Which org-hierarchy pickers this user may see, driven by their real
 * "Organization Hierarchy" grants from the login payload.
 *
 * Order is always top-down, never the order the grants happen to arrive in,
 * so the cascade (`ORG_FILTER_DEPENDENCY`) stays coherent.
 *
 * A user with no Organization Hierarchy grants falls back to the legacy
 * per-role table above: revoking the whole module is not a way to leave a
 * screen with zero filters, it just means "nothing configured, behave as
 * before". Revoking individual sub-modules while keeping at least one IS
 * honoured.
 *
 * The options behind each picker are already scoped server-side to the caller
 * by GET /users/V1/getOrgHierarchyByUser, so making a level visible widens
 * what the user can filter by, not what data they can reach.
 */
export const resolveOrgFilterVisibility = (
  role: string | null | undefined,
  moduleHierarchy: ModuleHierarchy[] | undefined | null,
): OrgFilterKey[] => {
  const granted = ORG_FILTER_ORDER.filter((key) =>
    hasSubModuleIn(
      moduleHierarchy ?? [],
      role ?? null,
      ORG_HIERARCHY_MODULE,
      ORG_FILTER_SUB_MODULE[key],
    ),
  );

  if (granted.length > 0) return granted;
  return ORG_FILTER_VISIBILITY[role ?? ""] ?? [];
};

/**
 * `resolveOrgFilterVisibility` for the currently signed-in user.
 *
 * Reads the stored login payload rather than Redux so that the filter bar,
 * the "Assign Team" cascade and the Scheduler's domain-scope resolution
 * (`features/scheduler/util/orgScope.ts`) all answer from one source and
 * cannot disagree about whether a Domain picker exists.
 */
export const getOrgFilterVisibility = (
  role?: string | null,
): OrgFilterKey[] => {
  const user = authStorage.getUser();
  return resolveOrgFilterVisibility(role ?? user?.roleCode, user?.moduleHierarchy);
};
