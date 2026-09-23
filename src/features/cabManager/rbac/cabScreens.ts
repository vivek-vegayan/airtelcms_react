import type { Role } from "../types/types";
import { ROLE_SCREENS } from "../data/cabManager.mock";
import { CAB_MODULE_NAME } from "./cabRoles";

// ─────────────────────────────────────────────────────────────────────────────
//  Which Cab Manager screens the current user may see.
//
//  Single source of truth for both places that render a Cab Manager screen
//  list — the sidebar children (src/rbac/useSidebarNav.tsx) and the in-page
//  tab strip (../pages/CabManagerMainPageTab.tsx) — so the two can never
//  disagree about a screen.
//
//  Resolution order:
//   1. WEB_SUB_MODULE grants from the login RBAC payload (what an admin
//      actually assigns in Global Settings → Admin Settings). This is what
//      every other module keys off, so assigning "All CRQs" to a role now
//      shows the page for that role.
//   2. If the user's Cab Manager module carries no recognised sub-module
//      rows at all (older deployments, module granted without a hierarchy),
//      fall back to the hardcoded ROLE_SCREENS persona table so those users
//      keep the tabs they had before.
// ─────────────────────────────────────────────────────────────────────────────

/** Screen id (ROLE_SCREENS / CAB_MANAGER_TAB_MAP key) → WEB_SUB_MODULE name. */
export const CAB_SCREEN_SUB_MODULES: Record<string, string> = {
  dashboard:      "Dashboard",
  cabPlanning:    "Cab Planning",
  cabSessions:    "Cab Sessions",
  mycrqs:         "My CRQs",
  allcrqs:        "All CRQs",
  journey:        "CRQ Journey",
  implementation: "Implementation",
  admin:          "Admin Config",
};

/** Declared render order — matches the child order in navRegistry.tsx. */
const SCREEN_ORDER: string[] = [
  "dashboard",
  "cabPlanning",
  "cabSessions",
  "mycrqs",
  "allcrqs",
  "journey",
  "implementation",
  "admin",
];

/**
 * Screens hidden no matter what is granted.
 * "dashboard" hidden since 2026-08-24 (commit "Hide dashboard from cab
 * manager tabs"); "implementation" hidden since 2026-09-10. Their routes
 * stay mounted, so remove an id from this set to bring the tab back
 * everywhere at once.
 */
const HIDDEN_SCREENS = new Set<string>(["dashboard", "implementation"]);

export type HasSubModule = (moduleName: string, subModuleName: string) => boolean;

/** Screen ids the given user may see, in render order. */
export const resolveCabScreens = (
  role: Role,
  hasSubModule: HasSubModule,
): string[] => {
  const granted = SCREEN_ORDER.filter((screen) =>
    hasSubModule(CAB_MODULE_NAME, CAB_SCREEN_SUB_MODULES[screen]),
  );

  const screens =
    granted.length > 0 ? granted : ROLE_SCREENS[role] ?? ROLE_SCREENS.cabMember;

  return screens.filter((screen) => !HIDDEN_SCREENS.has(screen));
};
