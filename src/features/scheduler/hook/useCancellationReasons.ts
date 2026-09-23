import { useCallback, useMemo } from "react";
import {
  useGetCancellationReasonsQuery,
  type CancellationReasonOption,
} from "../api/cancellationReasonApiSlice";

export interface UseCancellationReasonsResult {
  /** Raw reason/owner pairs, in the order the procedure returned them. */
  reasons: CancellationReasonOption[];
  /** The same rows shaped for a <Select> / StageFieldConfig.options. */
  options: { label: string; value: string }[];
  /** The rollback owner a reason maps to, "" while loading or if unknown. */
  ownerFor: (reason?: string | null) => string;
  isLoading: boolean;
  isError: boolean;
}

/**
 * The cancellation reason list and its reason -> rollback owner mapping,
 * shared by both review dialogs (GenericFormPanel's config-driven fields and
 * the Plan & Inventory FormPanel).
 *
 * Both dialogs mount this hook, but RTK Query de-duplicates: one request per
 * session, then cache. It replaces the MOCK_CANCELLATION_REASONS constants
 * that used to hardcode three placeholder reasons.
 */
export const useCancellationReasons = (
  { skip = false }: { skip?: boolean } = {},
): UseCancellationReasonsResult => {
  const { data, isLoading, isError } = useGetCancellationReasonsQuery(undefined, {
    skip,
  });

  const reasons = useMemo(() => data ?? [], [data]);

  const options = useMemo(
    () =>
      reasons.map((r) => ({
        label: r.cancellationReason,
        value: r.cancellationReason,
      })),
    [reasons],
  );

  const ownerFor = useCallback(
    (reason?: string | null) =>
      reasons.find((r) => r.cancellationReason === reason)
        ?.cancellationRollbackOwner ?? "",
    [reasons],
  );

  return { reasons, options, ownerFor, isLoading, isError };
};

export default useCancellationReasons;
