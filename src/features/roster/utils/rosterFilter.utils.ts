import { resolveShiftKeyFromDisplay } from "../constant/shiftPalette";

export interface RosterUserFilters {
  /** All terms must match somewhere in the user record (AND logic). */
  searchTerms: string[];
  /** Job levels to keep; empty = all. */
  filterLevel: string[];
  /** Shift keys to keep; user must have at least one matching day. */
  filterShift: string[];
  /** The visible date columns (YYYY-MM-DD) used for the shift filter. */
  dates: string[];
}

/**
 * Shared user filtering for the Weekly and Monthly roster views.
 * Exact same semantics both views previously implemented independently.
 */
export function filterRosterUsers<
  T extends { jobLevel: string; roster?: Record<string, any> },
>(users: T[], { searchTerms, filterLevel, filterShift, dates }: RosterUserFilters): T[] {
  return users.filter((user) => {
    if (searchTerms.length > 0) {
      const haystack = JSON.stringify(user).toLowerCase();
      if (!searchTerms.every((t) => haystack.includes(t.toLowerCase())))
        return false;
    }
    if (filterLevel.length && !filterLevel.includes(user.jobLevel))
      return false;
    if (filterShift.length) {
      const hasMatch = dates.some((d) =>
        filterShift.includes(
          resolveShiftKeyFromDisplay(user.roster?.[d]?.shiftDisplay),
        ),
      );
      if (!hasMatch) return false;
    }
    return true;
  });
}
