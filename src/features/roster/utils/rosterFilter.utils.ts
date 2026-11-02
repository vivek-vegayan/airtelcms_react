import { resolveShiftKeyFromDisplay } from "../constant/shiftPalette";

export interface RosterUserFilters {
  /** A user is kept if any term matches one of SEARCH_FIELDS (OR logic). */
  searchTerms: string[];
  /** Job levels to keep; empty = all. */
  filterLevel: string[];
  /** Shift keys to keep; user must have at least one matching day. */
  filterShift: string[];
  /** The visible date columns (YYYY-MM-DD) used for the shift filter. */
  dates: string[];
}

/** Fields the employee search matches against. */
const SEARCH_FIELDS = ["employeeName", "olmid", "mobileNo", "officeLocation"] as const;

/**
 * Shared user filtering for the Weekly and Monthly roster views.
 * Exact same semantics both views previously implemented independently.
 */
export function filterRosterUsers<
  T extends { jobLevel: string; roster?: Record<string, any> },
>(users: T[], { searchTerms, filterLevel, filterShift, dates }: RosterUserFilters): T[] {
  return users.filter((user) => {
    if (searchTerms.length > 0) {
      const values = SEARCH_FIELDS.map((f) =>
        String((user as Record<string, unknown>)[f] ?? "").toLowerCase(),
      );
      const matches = searchTerms.some((t) => {
        const term = t.toLowerCase();
        return values.some((v) => v.includes(term));
      });
      if (!matches) return false;
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
