import React from "react";
import { Box, Skeleton, useTheme } from "@mui/material";

/**
 * Placeholder shaped like the real page (info strip + flow card), so the
 * layout doesn't jump when the journey lands.
 */
export const CrqFlowSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const card = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "14px",
    boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 3px rgba(16,40,70,0.05)",
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* info strip */}
      <Box sx={{ ...card, overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Skeleton variant="text" width={150} height={22} />
          <Skeleton variant="rounded" width={96} height={24} sx={{ borderRadius: "999px" }} />
          <Skeleton variant="rounded" width={150} height={12} sx={{ ml: "auto", borderRadius: "999px" }} />
        </Box>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
            gap: 2,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1 }}>
              <Skeleton variant="rounded" width={26} height={26} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton variant="text" width="60%" height={12} />
                <Skeleton variant="text" width="85%" height={16} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* flow canvas */}
      <Box sx={{ ...card, p: "12px 14px 16px" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Skeleton variant="text" width={140} height={22} />
          <Box sx={{ ml: "auto", display: "flex", gap: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="text" width={72} height={16} />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 1.3fr 0.9fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Skeleton variant="rounded" width="100%" height={78} sx={{ borderRadius: "11px" }} />
            <Skeleton variant="rounded" width="100%" height={78} sx={{ borderRadius: "11px" }} />
          </Box>
          <Skeleton variant="rounded" width="100%" height={150} sx={{ borderRadius: "14px" }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Skeleton variant="rounded" width="100%" height={58} sx={{ borderRadius: "11px" }} />
            <Skeleton variant="rounded" width="100%" height={58} sx={{ borderRadius: "11px" }} />
            <Skeleton variant="rounded" width="100%" height={58} sx={{ borderRadius: "11px" }} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Skeleton variant="rounded" width={150} height={78} sx={{ borderRadius: "11px" }} />
          <Skeleton variant="rounded" width={154} height={78} sx={{ borderRadius: "11px" }} />
        </Box>
      </Box>
    </Box>
  );
};
