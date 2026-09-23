import { Box, Skeleton, Stack, useTheme } from "@mui/material";
import { useLoadingVisibility } from "./LoadingProvider";

/** Shared shimmer palette so every skeleton in the app pulses identically. */
export function useShimmerSx() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return {
    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
    "&::after": {
      background: isDark
        ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
        : "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
    },
  };
}

/**
 * Shared "should this component's own skeleton render" guard: skeletons are
 * the lowest-priority loader, so they self-suppress whenever a Global or
 * Page loader is already covering the screen (avoids the "Backdrop over
 * shimmering skeletons" bug from the pre-refactor dashboard/UserManagement).
 */
export function useSkeletonVisible(active: boolean): boolean {
  const { globalActive, pageActive } = useLoadingVisibility();
  return active && !globalActive && !pageActive;
}

export function StatsSkeleton({ count = 6 }: { count?: number }) {
  const shimmerSx = useShimmerSx();
  return (
    <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            flex: "1 1 220px",
            minWidth: 200,
            p: 2.25,
            borderRadius: "18px",
            border: "1px solid",
            borderColor: "divider",
            background: "background.paper",
          }}
        >
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: "12px", ...shimmerSx }} />
          <Skeleton variant="text" width="50%" height={34} sx={{ mt: 1.5, ...shimmerSx }} />
          <Skeleton variant="text" width="70%" height={18} sx={shimmerSx} />
        </Box>
      ))}
    </Stack>
  );
}

export function TableSkeleton({
  rows = 6,
  columnHeaders = ["User", "Employee ID", "Department", "Role", "Status", "Actions"],
}: {
  rows?: number;
  columnHeaders?: string[];
}) {
  const shimmerSx = useShimmerSx();
  return (
    <Box
      sx={{
        borderRadius: "18px",
        border: "1px solid",
        borderColor: "divider",
        background: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", gap: 2, px: 3, py: 1.5, bgcolor: "action.hover" }}>
        {columnHeaders.map((h) => (
          <Skeleton key={h} variant="text" width={100} height={16} sx={shimmerSx} />
        ))}
      </Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Stack
          key={i}
          direction="row"
          alignItems="center"
          gap={2}
          px={3}
          py={1.75}
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
        >
          <Skeleton variant="circular" width={40} height={40} sx={shimmerSx} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="30%" height={16} sx={shimmerSx} />
            <Skeleton variant="text" width="45%" height={14} sx={shimmerSx} />
          </Box>
          <Skeleton variant="rounded" width={90} height={22} sx={{ borderRadius: 999, ...shimmerSx }} />
          <Skeleton variant="rounded" width={70} height={22} sx={{ borderRadius: 999, ...shimmerSx }} />
          <Skeleton variant="text" width={60} height={16} sx={shimmerSx} />
        </Stack>
      ))}
    </Box>
  );
}

/** Generic card-shaped skeleton for dashboard-style widgets (e.g. profile, attendance, holidays cards). */
export function CardSkeleton({ lines = 3, height = 18 }: { lines?: number; height?: number }) {
  const shimmerSx = useShimmerSx();
  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: "18px",
        border: "1px solid",
        borderColor: "divider",
        background: "background.paper",
      }}
    >
      <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: "12px", mb: 1.5, ...shimmerSx }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "50%" : "80%"}
          height={height}
          sx={shimmerSx}
        />
      ))}
    </Box>
  );
}
