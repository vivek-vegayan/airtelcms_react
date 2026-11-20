import { useCallback, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useGetP1FiltersQuery } from "../api/crqAnalyticsP1Api";
import type { QuickDateFilter } from "../../crqAnalytics/utils/dateRange";
import type { P1FilterParams, P1Side, P1View } from "../types/crqAnalyticsP1.types";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  resetP1Filters,
  setP1CustomEnd,
  setP1CustomStart,
  setP1Filter,
  setP1QuickFilter,
  type P1FilterKey,
} from "../slices/crqAnalyticsP1Filters.slice";
import { DAY, STAGES, ddmon, dmonhm, minuteFloor, parseDT, stageCodesOfSide, toSql } from "../utils/p1Format";

export type { P1FilterKey, P1FilterValues } from "../slices/crqAnalyticsP1Filters.slice";

/** A picked custom-range day as YYYY-MM-DD ("" when empty or invalid). */
const day = (d: Dayjs | null) => (d?.isValid() ? d.format("YYYY-MM-DD") : "");

/** Which filters each view offers. Summary never sends a stage; Teams sends Side as the stage worked. */
export const P1_VIEW_FILTERS: Record<P1View, readonly P1FilterKey[]> = {
  pendency: ["vertical", "side", "domain", "subDomain", "stage", "circle"],
  summary: ["vertical", "domain", "subDomain", "circle"],
  teams: ["vertical", "side", "domain", "subDomain", "circle"],
};

export interface P1Option {
  value: string;
  label: string;
}

export interface P1Range {
  /** Epoch ms. The range is [lo, hi). */
  lo: number;
  hi: number;
  from: string;
  to: string;
  /** "Last 7 days" / "Selected range". */
  name: string;
  /** "10 Nov, 14:05 – 17 Nov, 14:05". */
  label: string;
  /** Chip text: "last 7 days" or the custom dates. */
  short: string;
}

const PRESETS: Record<Exclude<QuickDateFilter, "custom">, { name: string; days: number }> = {
  "24h": { name: "Last 24 h", days: 1 },
  "1w": { name: "Last 7 days", days: 7 },
  "30d": { name: "Last 30 days", days: 30 },
};

/**
 * One option per distinct name. Different org records can share a name (an "Optics" domain under
 * several functions, an "OLT Access" team under two verticals), so an option's value is the CSV of
 * every id behind its name - picking "Optics" filters on all of them. The procedures take CSV ids.
 */
const optionsByName = <T,>(rows: readonly T[], id: (r: T) => number, name: (r: T) => string): P1Option[] => {
  const idsByName = new Map<string, Set<number>>();
  rows.forEach((r) => {
    const label = name(r);
    const ids = idsByName.get(label) ?? new Set<number>();
    ids.add(id(r));
    idsByName.set(label, ids);
  });
  return [...idsByName]
    .map(([label, ids]) => ({ label, value: [...ids].sort((a, b) => a - b).join(",") }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/** Is `id` one of the ids of a selected option (a CSV value)? An empty selection matches everything. */
const inSelection = (selected: string, id: number) => !selected || selected.split(",").includes(String(id));

/**
 * Filter + date-range state shared by the three Phase 1 views, so switching between Pendency,
 * Summary and Teams keeps the selection. The org tree, circles and "data as of" come from
 * CRQ_AN_SP_FILTERS.
 */
export function useP1Filters(view: P1View) {
  const filtersQuery = useGetP1FiltersQuery();
  const orgTree = useMemo(() => filtersQuery.data?.orgTree ?? [], [filtersQuery.data]);

  // Filters and date range live in Redux (crqAnalyticsP1Filters slice), shared by the three tabs.
  const dispatch = useAppDispatch();
  const { values, quickFilter, customStart: startDay, customEnd: endDay } = useAppSelector((s) => s.crqAnalyticsP1Filters);
  const customStart = useMemo<Dayjs | null>(() => (startDay ? dayjs(startDay) : null), [startDay]);
  const customEnd = useMemo<Dayjs | null>(() => (endDay ? dayjs(endDay) : null), [endDay]);
  const setQuickFilter = useCallback((v: QuickDateFilter) => dispatch(setP1QuickFilter(v)), [dispatch]);
  const setCustomStart = useCallback((d: Dayjs | null) => dispatch(setP1CustomStart(day(d))), [dispatch]);
  const setCustomEnd = useCallback((d: Dayjs | null) => dispatch(setP1CustomEnd(day(d))), [dispatch]);
  // "Now" is pinned (to the minute) so the query arguments stay stable between renders.
  // It moves when the range is changed or the refresh button is pressed.
  const [now, setNow] = useState(() => minuteFloor(Date.now()));
  const touchNow = useCallback(() => setNow(minuteFloor(Date.now())), []);
  // A new preset also moves "now", so "Last 7 days" really ends at the moment it is picked.
  const changeQuickFilter = useCallback(
    (v: QuickDateFilter) => {
      setQuickFilter(v);
      touchNow();
    },
    [setQuickFilter, touchNow],
  );

  const options = useMemo<Record<P1FilterKey, P1Option[]>>(() => {
    const inVertical = orgTree.filter((r) => inSelection(values.vertical, r.verticalId));
    const inDomain = inVertical.filter((r) => inSelection(values.domain, r.domainId));
    return {
      vertical: optionsByName(orgTree, (r) => r.verticalId, (r) => r.verticalName),
      domain: optionsByName(inVertical, (r) => r.domainId, (r) => r.domainName),
      subDomain: optionsByName(inDomain, (r) => r.subDomainId, (r) => r.subDomainName),
      side: [
        { value: "CCB", label: "CCB" },
        { value: "SE", label: "SE" },
      ],
      stage: STAGES.filter((s) => !values.side || s.side === values.side).map((s) => ({ value: s.code, label: s.label })),
      circle: (filtersQuery.data?.circles ?? []).map((c) => ({ value: c.circle, label: c.circle })),
    };
  }, [orgTree, values.vertical, values.domain, values.side, filtersQuery.data]);

  // The cascade (a parent clears its children) lives in the slice reducer.
  const setFilter = useCallback((key: P1FilterKey, value: string) => dispatch(setP1Filter({ key, value })), [dispatch]);
  const resetFilters = useCallback(() => dispatch(resetP1Filters()), [dispatch]);

  const active = P1_VIEW_FILTERS[view];

  /** The six procedure filters for the current view. */
  const filterParams = useMemo<P1FilterParams>(() => {
    const on = (k: P1FilterKey) => (active.includes(k) && values[k] ? values[k] : undefined);
    const side = on("side") as P1Side | undefined;
    return {
      vertical: on("vertical"),
      domain: on("domain"),
      subDomain: on("subDomain"),
      circle: on("circle"),
      // "Who holds it / Side" travels as the stage codes of that side.
      stage: on("stage") ?? (side ? stageCodesOfSide(side) : undefined),
    };
  }, [active, values]);

  const range = useMemo<P1Range>(() => {
    if (quickFilter === "custom" && customStart?.isValid() && customEnd?.isValid()) {
      const lo = customStart.startOf("day").valueOf();
      const last = customEnd.startOf("day").valueOf();
      // First day 00:00 to the day after the last day 00:00, never past now.
      const hi = Math.max(Math.min(last + DAY, now), lo + 60_000);
      const spansYears = dayjs(lo).year() !== dayjs(last).year();
      const fmt = (t: number) => ddmon(t) + (spansYears ? ` ${dayjs(t).year()}` : "");
      const label = `${fmt(lo)} – ${fmt(last)}`;
      return { lo, hi, from: toSql(lo), to: toSql(hi), name: "Selected range", label, short: label };
    }
    const preset = PRESETS[quickFilter === "custom" ? "1w" : quickFilter];
    const lo = now - preset.days * DAY;
    return {
      lo,
      hi: now,
      from: toSql(lo),
      to: toSql(now),
      name: preset.name,
      label: `${dmonhm(lo)} – ${dmonhm(now)}`,
      short: preset.name.toLowerCase(),
    };
  }, [quickFilter, customStart, customEnd, now]);

  /** Text of the active filters, for the drill-down subtitle and export names. */
  const filterText = useMemo(
    () =>
      active
        .filter((k) => values[k])
        .map((k) => options[k].find((o) => o.value === values[k])?.label ?? values[k])
        .join(" · "),
    [active, values, options],
  );

  return {
    view,
    active,
    orgTree,
    values,
    options,
    setFilter,
    resetFilters,
    filterParams,
    filterText,
    quickFilter,
    setQuickFilter: changeQuickFilter,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    range,
    now,
    touchNow,
    dataAsOf: parseDT(filtersQuery.data?.dataStatus?.dataAsOf),
    dataStatus: filtersQuery.data?.dataStatus ?? null,
    filtersError: filtersQuery.isError,
  };
}

export type UseP1FiltersReturn = ReturnType<typeof useP1Filters>;
