// src/rbac/routeAccess.ts
import {
  ALL_NAV_ITEMS,
  ROUTE_ONLY_ACCESS_ENTRIES,
  isNavItemAllowed,
  type AccessRequirement,
  type NavItem,
} from "./navRegistry";

export type RequiredAccess = AccessRequirement;

/**
 * Modules whose sub-module-level gating is known to be unreliable at the
 * route layer, so route protection falls back to module-level only for
 * them (sidebar visibility is unaffected — this only concerns direct-URL
 * enforcement in PrivateRoute):
 *
 * - "Cab Manager": child visibility is resolved by resolveCabScreens()
 *   (features/cabManager/rbac/cabScreens.ts), which prefers WEB_* sub-module
 *   grants but falls back to the ROLE_SCREENS persona table when a user's
 *   Cab Manager module carries no sub-module rows. Enforcing
 *   requiredSubModule here has no equivalent fallback, so it would lock those
 *   users out of every Cab Manager page on a direct URL.
 * - "SFTP Management": live WEB_SUB_MODULE rows are named
 *   "Dashboard/Files/Servers", not the "Windows/Linux" sub-module names
 *   referenced in navRegistry.ts, so enforcing requiredSubModule here would
 *   incorrectly block real users of this module on both of its pages.
 */
const MODULE_ONLY_GUARD = new Set(["Cab Manager", "SFTP Management"]);

const matchesPath = (pathname: string, to: string, matchPaths?: string[]): boolean => {
  const candidates = matchPaths ?? [to];
  return candidates.some((p) => pathname === p || pathname.startsWith(p + "/"));
};

interface FlatEntry extends AccessRequirement {
  to: string;
  matchPaths?: string[];
}

const flatten = (items: NavItem[]): FlatEntry[] => {
  const entries: FlatEntry[] = [];
  for (const item of items) {
    entries.push({
      to: item.to,
      matchPaths: item.matchPaths,
      requiredModule: item.requiredModule,
      requiredSubModule: item.requiredSubModule,
      requiredAnyOf: item.requiredAnyOf,
      requiredSuperAdmin: item.requiredSuperAdmin,
    });
    for (const child of item.children ?? []) {
      entries.push({
        to: child.to,
        matchPaths: child.matchPaths,
        requiredModule: child.requiredModule,
        requiredSubModule: child.requiredSubModule,
        requiredAnyOf: child.requiredAnyOf,
        requiredSuperAdmin: child.requiredSuperAdmin,
      });
    }
  }
  // Longest `to` first so a child route (more specific) is matched before its parent.
  return entries.sort((a, b) => b.to.length - a.to.length);
};

// Sidebar items plus the routes that are guarded but not shown in the sidebar
// (see ROUTE_ONLY_ACCESS_ENTRIES). Both go through the same sort, so a
// route-only entry still wins over the shorter parent path it sits under.
const FLAT_ENTRIES = [...flatten(ALL_NAV_ITEMS), ...ROUTE_ONLY_ACCESS_ENTRIES].sort(
  (a, b) => b.to.length - a.to.length,
);

/**
 * Resolves what module/sub-module a given pathname requires, using the same
 * registry (and prefix-matching convention) the sidebar is built from.
 * Returns undefined if the path isn't represented in the registry at all —
 * callers should treat that as "allowed" (a safety net for routes added
 * without a matching nav entry, rather than silently locking everyone out).
 */
export const getRequiredAccess = (pathname: string): RequiredAccess | undefined => {
  const entry = FLAT_ENTRIES.find((e) => matchesPath(pathname, e.to, e.matchPaths));
  if (!entry) return undefined;

  if (entry.requiredSubModule && MODULE_ONLY_GUARD.has(entry.requiredModule ?? "")) {
    return { requiredModule: entry.requiredModule };
  }

  return {
    requiredModule: entry.requiredModule,
    requiredSubModule: entry.requiredSubModule,
    requiredAnyOf: entry.requiredAnyOf,
    requiredSuperAdmin: entry.requiredSuperAdmin,
  };
};

/**
 * Whether the given user may open the given path. Accepts a full location
 * string (path + query + hash); only the pathname takes part in matching.
 *
 * Shared by PrivateRoute (guarding what's on screen) and LoginPage (vetting a
 * pending post-login redirect before honouring it) so the two can never drift
 * into disagreeing about the same URL.
 */
export const isPathAllowed = (
  path: string,
  hasModule: (moduleName: string) => boolean,
  hasSubModule: (moduleName: string, subModuleName: string) => boolean,
  /**
   * Optional so the existing callers (LoginPage vetting a pending redirect,
   * the Scheduler and Global Settings tab strips) keep working unchanged. They
   * gate no super-admin-only path, and omitting it fails closed rather than
   * open — a super-admin-only route is refused, never wrongly permitted.
   */
  isSuperAdmin: boolean = false,
): boolean => {
  const access = getRequiredAccess(path.split(/[?#]/)[0]);

  // Undefined means the path isn't in the nav registry at all — allow it
  // through rather than silently locking out a route nobody registered.
  if (!access) return true;

  // Delegated rather than re-implemented, so route protection and sidebar
  // visibility stay one predicate — including the requiredAnyOf case a
  // multi-module group (My Dashboard) relies on.
  return isNavItemAllowed(access, hasModule, hasSubModule, isSuperAdmin);
};

/**
 * Returns the first top-level nav item's path the user actually has access
 * to (in the registry's declared order — Dashboard first when assigned),
 * or null if the user has no accessible module at all.
 */
export const getFirstAccessiblePath = (
  hasModule: (moduleName: string) => boolean,
  hasSubModule: (moduleName: string, subModuleName: string) => boolean,
): string | null => {
  const item = ALL_NAV_ITEMS.find((i) => isNavItemAllowed(i, hasModule, hasSubModule));
  return item?.to ?? null;
};
