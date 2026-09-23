import { Box, Skeleton, Stack } from "@mui/material";

/**
 * First-paint placeholder for the directory.
 *
 * Deliberately local rather than the shared `StatsSkeleton`/`TableSkeleton`:
 * those are sized for the older 18px-radius, 220px-wide stat cards, so the
 * page visibly re-flowed the moment real data arrived. These match the tiles
 * and rows that actually replace them, so the load settles in place.
 */
export default function LoadingState() {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* Stat strip */}
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5, flexShrink: 0 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={96}
            sx={{ flex: "1 1 158px", minWidth: 150, borderRadius: "12px" }}
          />
        ))}
      </Stack>

      {/* Toolbar */}
      <Skeleton variant="rounded" height={58} sx={{ borderRadius: "12px", mb: 1.25, flexShrink: 0 }} />

      {/* Table */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2.25,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Skeleton variant="text" width={110} height={18} />
        </Box>
        {Array.from({ length: 7 }).map((_, i) => (
          <Stack
            key={i}
            direction="row"
            alignItems="center"
            gap={2}
            px={2.25}
            py={1.5}
            sx={{ borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Skeleton variant="circular" width={38} height={38} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" width="28%" height={15} />
              <Skeleton variant="text" width="42%" height={13} />
            </Box>
            <Skeleton
              variant="rounded"
              width={104}
              height={22}
              sx={{ borderRadius: 999, display: { xs: "none", md: "block" } }}
            />
            <Skeleton variant="rounded" width={76} height={22} sx={{ borderRadius: 999 }} />
            <Skeleton
              variant="text"
              width={64}
              height={15}
              sx={{ display: { xs: "none", lg: "block" } }}
            />
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
