import { useEffect, useRef } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

interface ScrollSentinelProps {
  onVisible: () => void;
  /** Pass the scrollable TableContainer ref so the observer uses it as root */
  rootRef?: React.RefObject<HTMLElement | null>;
  /** Prevent firing while a fetch is already in flight */
  disabled?: boolean;
  loadedCount?: number;
  totalCount?: number | null;
}


export function ScrollSentinel({
  onVisible,
  rootRef,
  disabled = false,
  loadedCount,
  totalCount,
}: ScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || disabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !disabled) {
          onVisible();
        }
      },
      {
        threshold: 0.1,
        root: rootRef?.current ?? null,
        rootMargin: "0px 0px 160px 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, disabled, rootRef]);

  return (
    <Box ref={sentinelRef} sx={{ py: 1.25 }}>
      {disabled && (
        <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
          <CircularProgress size={14} thickness={4} />
          <Typography sx={{ fontSize: 11, color: "text.disabled" }}>
            Loading more…{" "}
            {totalCount != null && `(${loadedCount ?? 0} / ${totalCount})`}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

interface AllLoadedProps {
  loadedCount: number;
  totalCount: number | null;
}

/** Shown in place of the sentinel when all pages have been fetched. */
export function AllLoadedRow({ loadedCount, totalCount }: AllLoadedProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      gap={0.75}
      sx={{ py: 1.25 }}
    >
      <CheckCircleOutlineIcon sx={{ fontSize: 13, color: "success.main", opacity: 0.7 }} />
      <Typography sx={{ fontSize: 11, color: "text.disabled" }}>
        {totalCount !== null
          ? `All ${totalCount} employees loaded`
          : `All ${loadedCount} employees loaded`}
      </Typography>
    </Stack>
  );
}