import { useDeferredValue, useMemo, useState } from "react";
import type { FilterState, SortConfig } from "./RosterFilterDrawer";
import { TOTAL_COLS } from "./goldenGrid.constants";
import type { GoldenSetEmployee } from "./goldenGrid.types";
import { colTotals, defaultFilter, summarise } from "./goldenGrid.utils";

export function useGoldenGridFilters(
  allEmps: GoldenSetEmployee[],
  getShifts: (emp: GoldenSetEmployee) => string[],
) {
  const [filter, setFilter] = useState<FilterState>(defaultFilter());
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<SortConfig>({ field: "name", dir: "asc" });
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDeferredValue(searchRaw);

  // ── Filter + sort pipeline ────────────────────────────────────────────────
  const filtered = useMemo<GoldenSetEmployee[]>(() => {
    const result = allEmps.filter((e) => {
      if (
        search &&
        !`${e.name} ${e.olmid} ${e.role}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (filter.levels.length && !filter.levels.includes(e.level))
        return false;
      if (filter.roles.length && !filter.roles.includes(e.role)) return false;
      const shifts = getShifts(e);
      const s = summarise(shifts);
      if (s.work < filter.workRange[0] || s.work > filter.workRange[1])
        return false;
      if (s.night < filter.nightRange[0] || s.night > filter.nightRange[1])
        return false;
      if (filter.showHighLoad && s.night <= 8) return false;
      if (filter.showLowRest && s.off >= 6) return false;
      if (
        filter.shiftCodes.length &&
        !filter.shiftCodes.every((c) => shifts.includes(c))
      )
        return false;
      return true;
    });

    return [...result].sort((a, b) => {
      const sA = summarise(getShifts(a));
      const sB = summarise(getShifts(b));
      let vA: string | number;
      let vB: string | number;
      switch (sort.field) {
        case "name":
          vA = a.name;
          vB = b.name;
          break;
        case "olmid":
          vA = a.olmid;
          vB = b.olmid;
          break;
        case "role":
          vA = a.role;
          vB = b.role;
          break;
        case "level":
          vA = a.level;
          vB = b.level;
          break;
        case "work":
          vA = sA.work;
          vB = sB.work;
          break;
        case "night":
          vA = sA.night;
          vB = sB.night;
          break;
        case "off":
          vA = sA.off;
          vB = sB.off;
          break;
        case "load":
          vA = sA.loadPct;
          vB = sB.loadPct;
          break;
        default:
          vA = a.name;
          vB = b.name;
      }
      const cmp =
        typeof vA === "number"
          ? vA - (vB as number)
          : String(vA).localeCompare(String(vB));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [allEmps, search, filter, sort, getShifts]);

  const dayTotals = useMemo<Record<string, number>[]>(
    () => Array.from({ length: TOTAL_COLS }, (_, i) => colTotals(filtered, i)),
    [filtered],
  );

  // ── Active filter count ───────────────────────────────────────────────────
  const activeFilters = useMemo(() => {
    const def = defaultFilter();
    let c = 0;
    if (search) c++;
    if (filter.levels.length) c++;
    if (filter.roles.length) c++;
    if (filter.shiftCodes.length) c++;
    if (
      filter.workRange[0] !== def.workRange[0] ||
      filter.workRange[1] !== def.workRange[1]
    )
      c++;
    if (
      filter.nightRange[0] !== def.nightRange[0] ||
      filter.nightRange[1] !== def.nightRange[1]
    )
      c++;
    if (filter.showHighLoad) c++;
    if (filter.showLowRest) c++;
    return c;
  }, [filter, search]);

  return {
    searchRaw,
    setSearchRaw,
    search,
    filter,
    setFilter,
    filterOpen,
    setFilterOpen,
    sort,
    setSort,
    filtered,
    dayTotals,
    activeFilters,
  };
}
