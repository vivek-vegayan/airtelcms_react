import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetCrqStageHistoryQuery } from "../api/crqreviewApiSlice";

/**
 * Returns `crq` with its stage `history[]` filled in, loading it on demand.
 *
 * The stage listings no longer embed history (attaching it for every CRQ in
 * the domain/sub-domain was what made them slow), so anything on a listing
 * page that reads `crq.history` - an expanded card, a review dialog - runs
 * the CRQ through this hook first. A CRQ that already carries history (the
 * cockpit's single-CRQ response) is returned untouched and nothing is
 * fetched.
 *
 * `enabled` defers the request until the history is actually needed, e.g. a
 * dialog's `open` flag. While loading, `crq` is returned as-is, so callers
 * fall back to the legacy per-stage status fields exactly as they did for
 * responses without history.
 */
export function useCrqWithHistory<T extends { crqNo?: string | null; history?: unknown } | null | undefined>(
  crq: T,
  enabled = true,
) {
  const crqNo = crq?.crqNo ?? null;
  const hasHistory = Array.isArray(crq?.history);
  const shouldFetch = enabled && !!crqNo && !hasHistory;

  const { data, isFetching, isError } = useGetCrqStageHistoryQuery(
    shouldFetch ? (crqNo as string) : skipToken,
  );

  const merged = useMemo(
    () => (crq && shouldFetch && data ? ({ ...crq, history: data } as T) : crq),
    [crq, shouldFetch, data],
  );

  return {
    crq: merged,
    history: hasHistory ? (crq!.history as typeof data) : data,
    isLoading: shouldFetch && isFetching && !data,
    isError: shouldFetch && isError,
  };
}
