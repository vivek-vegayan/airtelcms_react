// Single dynamic registry describing, per sub-module, how the Reject dialog
// should collect a remark. useNotificationAction.ts owns the actual API
// dispatch (RTK Query hooks must be called unconditionally at hook top
// level), but every subModule -> "which mutation to call" mapping lives in
// one lookup table there, keyed off the same subModule strings this file
// exposes - adding a new actionable sub-module means adding one entry here
// and one case there, nothing in the UI components.

const MANAGER_ROLES = new Set([
  "TEAM_LEAD",
  "DOMAIN_HEAD",
  "FUNCTION_HEAD",
  "VERTICAL_HEAD",
  "SUPER_ADMIN",
  "SUB_DOMAIN_HEAD",
]);

export function getRoleTier(roleCode: string): "MANAGER" | "MEMBER" {
  return MANAGER_ROLES.has(roleCode) ? "MANAGER" : "MEMBER";
}

export type RejectInputKind = "TEXT" | "CAB_REASON_LIST";

export interface SubModuleActionMeta {
  subModule: string;
  rejectInput: RejectInputKind;
  rejectRequired: boolean;
}

const SUB_MODULE_ACTIONS: Record<string, SubModuleActionMeta> = {
  SHIFT_SWAP: { subModule: "SHIFT_SWAP", rejectInput: "TEXT", rejectRequired: true },
  SHIFT_CHANGE: { subModule: "SHIFT_CHANGE", rejectInput: "TEXT", rejectRequired: true },
  LEAVE: { subModule: "LEAVE", rejectInput: "TEXT", rejectRequired: true },
  CAB_APPROVER: { subModule: "CAB_APPROVER", rejectInput: "CAB_REASON_LIST", rejectRequired: true },
  RESCHEDULE: { subModule: "RESCHEDULE", rejectInput: "TEXT", rejectRequired: true },
};

export function getSubModuleActionMeta(
  subModule: string | null | undefined,
): SubModuleActionMeta | null {
  if (!subModule) return null;
  return SUB_MODULE_ACTIONS[subModule] ?? null;
}

export function isActionableSubModuleSupported(subModule: string | null | undefined): boolean {
  return getSubModuleActionMeta(subModule) !== null;
}
