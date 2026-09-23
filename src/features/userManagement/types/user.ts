import {
  Shield,
  SupervisorAccount,
  Groups,
  Person,
  type SvgIconComponent,
} from "@mui/icons-material";
import type { UserListItem } from "../api/userManagementApi";

// ─── Core Types ──────────────────────────────────────────────────────────
// Normalized shape the grid/cards/filters work with, adapted from the live
// UserListItem (sp_get_users_paginated) via mapUserListItem below. There is
// no manager, device, or generic-activity data anywhere in the schema, so
// those mock-only fields have no equivalent here and were dropped.
export interface User {
  id: string;
  userId: number;
  name: string;
  employeeId: string;
  function: string;
  functionId: number | null;
  verticalName: string | null;
  role: string;
  email: string;
  joinedDate: string | null;
  active: boolean;
  phone?: string | null;
  designation?: string | null;
  lastLogin?: string | null;
}

export function mapUserListItem(item: UserListItem): User {
  return {
    id: String(item.userId),
    userId: item.userId,
    name: item.employeeName,
    employeeId: item.olmid,
    function: item.functionName ?? "Unassigned",
    functionId: item.functionId,
    verticalName: item.verticalName,
    role: item.roleCode ?? "",
    email: item.emailId,
    joinedDate: item.dateOfJoining,
    active: item.employeeStatus === "ACTIVE",
    phone: item.mobileNo,
    designation: item.designation,
    lastLogin: item.lastLogin,
  };
}

export type UserStatus = "Active" | "Inactive";

export interface RoleConfigEntry {
  label: string;
  /** Categorical accent for this role family, tuned for a light surface;
   *  RoleBadge lightens it itself for the dark theme. */
  color: string;
  icon: SvgIconComponent;
}

// Roles are real ROLE_MASTER.role_code values (SUPER_ADMIN, VERTICAL_HEAD,
// FUNCTION_HEAD, DOMAIN_HEAD, SUB_DOMAIN_HEAD, TEAM_MEMBER, CAB_*, ...) -
// an open set, not a fixed 3-value enum, so styling is resolved by a
// lookup with a fallback rather than a Record keyed by every possible role.
//
// Only a hue and an icon live here now: the `gradient`/`bg` pair that sat
// alongside them was baked for the light theme and only ever fed RoleBadge's
// saturated pill, which is tonal now and derives both surfaces from `color`.
const KNOWN_ROLE_STYLE: Record<string, Omit<RoleConfigEntry, "label">> = {
  SUPER_ADMIN: { color: "#DC2626", icon: Shield },
  VEGAYAN_SUPER_ADMIN: { color: "#DC2626", icon: Shield },
  VERTICAL_HEAD: { color: "#2563EB", icon: SupervisorAccount },
  FUNCTION_HEAD: { color: "#2563EB", icon: SupervisorAccount },
  DOMAIN_HEAD: { color: "#2563EB", icon: SupervisorAccount },
  SUB_DOMAIN_HEAD: { color: "#2563EB", icon: SupervisorAccount },
  TEAM_MEMBER: { color: "#0F9D67", icon: Person },
};

const FALLBACK_ROLE_STYLE: Omit<RoleConfigEntry, "label"> = {
  color: "#7C3AED",
  icon: Groups,
};

function roleCodeToLabel(roleCode: string): string {
  return roleCode
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getRoleConfig(roleCode: string | null | undefined): RoleConfigEntry {
  if (!roleCode) {
    return { label: "Unassigned", ...FALLBACK_ROLE_STYLE };
  }
  const style = KNOWN_ROLE_STYLE[roleCode] ?? FALLBACK_ROLE_STYLE;
  return { label: roleCodeToLabel(roleCode), ...style };
}

/** Only the presence dot on avatars still reads from here — the status pill
 *  itself is palette-driven inside StatusBadge, so it tracks the theme. */
export const STATUS_CONFIG: Record<UserStatus, { dot: string }> = {
  Active: { dot: "#22C55E" },
  Inactive: { dot: "#9CA3AF" },
};

export const getUserStatus = (u: User): UserStatus => (u.active ? "Active" : "Inactive");
