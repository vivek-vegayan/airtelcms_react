import type { Role } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
//  Cab Manager RBAC registry
//
//  Backend structure (all managed with the existing platform tooling):
//   · Module            — "Cab Manager", created in Global Settings → Admin
//                         Settings and returned inside the login RBAC payload
//                         (drives hasModule("Cab Manager") in the sidebar).
//   · Roles             — the CAB_* role codes below, created via Global
//                         Settings (create-new-role) and granted permissions
//                         on the "Cab Manager" module there.
//   · User–role         — assigned per user through Team Management
//                         (the user's roleCode arrives at login).
//
//  This file is the single client-side mapping from the authenticated user's
//  roleCode to the Cab Manager persona role. Which screens a user actually
//  sees is resolved in ./cabScreens.ts — from the assigned sub-modules first,
//  with the persona's ROLE_SCREENS list (data/cabManager.mock.ts) used only
//  as a fallback for users whose module carries no sub-module rows.
// ─────────────────────────────────────────────────────────────────────────────

/** Module name exactly as returned by the login RBAC payload. */
export const CAB_MODULE_NAME = "Cab Manager";

/** Fallback persona when the logged-in user's roleCode has no CAB mapping. */
export const DEFAULT_CAB_ROLE: Role = "stakeholder";

/**
 * Auth roleCode → Cab Manager persona role.
 * Keys are matched case-insensitively (normalised to UPPER_SNAKE-ish upper case).
 */
const AUTH_ROLE_TO_CAB_ROLE: Record<string, Role> = {
  // Dedicated Cab Manager roles (Global Settings → create-new-role)
  CAB_ADMIN: "admin",
  CAB_REQUESTER: "requester",
  CAB_STAKEHOLDER: "stakeholder",
  CAB_ENGINEER: "cabEngineer",
  CAB_MEMBER: "cabMember",
  CAB_SE: "se",

  // Existing platform roles
  SUPER_ADMIN: "admin",

  // Native persona codes, in case the API returns them verbatim
  ADMIN: "admin",
  REQUESTER: "requester",
  STAKEHOLDER: "stakeholder",
  CABENGINEER: "cabEngineer",
  CABMEMBER: "cabMember",
  SE: "se",
};

/** Resolve the logged-in user's auth roleCode to a Cab Manager persona role. */
export function resolveCabRole(roleCode: string | null | undefined): Role {
  if (!roleCode) return DEFAULT_CAB_ROLE;
  return AUTH_ROLE_TO_CAB_ROLE[roleCode.trim().toUpperCase()] ?? DEFAULT_CAB_ROLE;
}
