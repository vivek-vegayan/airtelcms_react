import { useCallback, useRef, useState } from "react";
import type { NormalisedEmployee } from "../../types/Futureweek.types";
import { useLazyGetFutureWeekQuery } from "../../api/rosterGenerationApiSlice";
import { normaliseRows } from "../../util/Futureweek.utils";

const PAGE_SIZE = 50;
export interface PaginatedFutureWeekState {
  employees: NormalisedEmployee[];
  isoWeek: number;
  isoYear: number;
  totalEmployees: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  isError: boolean;
  loadProgress: number;
  load: (subDomainId: number) => void;
  loadMore: () => void;
}

export function usePaginatedFutureWeek(): PaginatedFutureWeekState {
  const [triggerFetch, { isError }] = useLazyGetFutureWeekQuery();

  const [employees, setEmployees] = useState<NormalisedEmployee[]>([]);
  const [isoWeek, setIsoWeek] = useState(0);
  const [isoYear, setIsoYear] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const activeSubDomainRef = useRef<number | null>(null);
  const nextPageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const pageSlots = useRef<Map<number, NormalisedEmployee[]>>(new Map());

  const flushSlots = useCallback((totalPages: number) => {
    const merged: NormalisedEmployee[] = [];
    for (let p = 1; p <= totalPages; p++) {
      const slot = pageSlots.current.get(p);
      if (slot) merged.push(...slot);
    }
    setEmployees(merged);
  }, []);

  const load = useCallback(
    async (subDomainId: number) => {
      activeSubDomainRef.current = subDomainId;
      pageSlots.current = new Map();
      nextPageRef.current = 2;
      totalPagesRef.current = 1;

      setEmployees([]);
      setIsoWeek(0);
      setIsoYear(0);
      setTotalEmployees(0);
      setIsLoading(true);
      setIsFetchingMore(false);
      setHasMore(false);
      setLoadProgress(0);

      try {
        const first = await triggerFetch({
          subDomainId,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
        }).unwrap();

        if (activeSubDomainRef.current !== subDomainId) return;

        const total = first.totalEmployees;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

        setIsoWeek(first.isoWeek);
        setIsoYear(first.isoYear);
        setTotalEmployees(total);
        setIsLoading(false);
        setHasMore(totalPages > 1);

        totalPagesRef.current = totalPages;
        nextPageRef.current = 2;

        const firstNorm = normaliseRows(first.data ?? []);
        pageSlots.current.set(1, firstNorm);
        setEmployees([...firstNorm]);
        setLoadProgress(Math.round((1 / totalPages) * 100));
      } catch {
        if (activeSubDomainRef.current === subDomainId) {
          setIsLoading(false);
          setIsFetchingMore(false);
          setHasMore(false);
          setLoadProgress(0);
        }
      }
    },
    [triggerFetch],
  );

  const loadMore = useCallback(async () => {
    const subDomainId = activeSubDomainRef.current;
    const nextPage = nextPageRef.current;
    const totalPages = totalPagesRef.current;

    if (subDomainId === null || nextPage > totalPages) {
      setHasMore(false);
      return;
    }

    setIsFetchingMore(true);

    try {
      const page = await triggerFetch({
        subDomainId,
        pageNumber: nextPage,
        pageSize: PAGE_SIZE,
      }).unwrap();

      if (activeSubDomainRef.current !== subDomainId) return;

      const normalized = normaliseRows(page.data ?? []);
      pageSlots.current.set(nextPage, normalized);
      flushSlots(totalPages);

      const completedPages = nextPage;
      setLoadProgress(Math.round((completedPages / totalPages) * 100));

      nextPageRef.current = nextPage + 1;
      setHasMore(nextPage + 1 <= totalPages);
    } catch {
      if (activeSubDomainRef.current === subDomainId) {
        setHasMore(nextPage + 1 <= totalPages);
      }
    } finally {
      if (activeSubDomainRef.current === subDomainId) {
        setIsFetchingMore(false);
      }
    }
  }, [flushSlots, triggerFetch]);

  return {
    employees,
    isoWeek,
    isoYear,
    totalEmployees,
    isLoading,
    isFetchingMore,
    hasMore,
    isError,
    loadProgress,
    load,
    loadMore,
  };
}