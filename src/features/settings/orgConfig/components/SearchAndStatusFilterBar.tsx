import React from "react";
import { Box, InputBase, Typography, alpha } from "@mui/material";
import { SearchOutlined, ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import type { useTabColorTokens } from "../../../../style/theme";
import type { StatusFilter } from "../types/orgConfigTypes";

interface SearchAndStatusFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  c: ReturnType<typeof useTabColorTokens>;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const SearchAndStatusFilterBar: React.FC<SearchAndStatusFilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  totalPages,
  onPageChange,
  c,
}) => {
  const searchInputSx = {
    mx: 1.5,
    mb: 0.75,
    px: 1.25,
    py: 0.75,
    borderRadius: "6px",
    border: `1px solid ${c.border}`,
    bgcolor: c.isDark ? "rgba(255,255,255,0.03)" : "rgba(13,27,42,0.025)",
    display: "flex",
    alignItems: "center",
    gap: 1,
    "&:focus-within": {
      border: `1px solid ${c.accent}`,
      boxShadow: `0 0 0 3px ${alpha(c.accent, 0.12)}`,
    },
  } as const;

  return (
    <>
      <Box sx={searchInputSx}>
        <SearchOutlined sx={{ fontSize: 14, color: c.textDim, flexShrink: 0 }} />
        <InputBase
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…"
          sx={{ fontSize: "0.78rem", color: c.textPrimary, flex: 1, "& input": { p: 0 } }}
        />
      </Box>

      <Box sx={{ mx: 1.5, mb: 1, display: "flex", gap: "4px" }}>
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = statusFilter === opt.value;
          return (
            <Box
              key={opt.value}
              component="button"
              onClick={() => onStatusFilterChange(opt.value)}
              sx={{
                flex: 1,
                border: `1px solid ${isSelected ? c.accentBorder : c.border}`,
                borderRadius: "5px",
                bgcolor: isSelected ? c.accentDim : "transparent",
                color: isSelected ? c.accent : c.textDim,
                fontSize: "0.65rem",
                fontWeight: 600,
                py: "3px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {opt.label}
            </Box>
          );
        })}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ mx: 1.5, mb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box
            component="button"
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
            sx={{
              width: 22,
              height: 22,
              border: `1px solid ${c.border}`,
              borderRadius: "4px",
              bgcolor: "transparent",
              color: c.textSecondary,
              cursor: page <= 0 ? "not-allowed" : "pointer",
              opacity: page <= 0 ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeftOutlined sx={{ fontSize: 14 }} />
          </Box>
          <Typography fontSize="0.68rem" color={c.textDim}>
            Page {page + 1} of {totalPages}
          </Typography>
          <Box
            component="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            sx={{
              width: 22,
              height: 22,
              border: `1px solid ${c.border}`,
              borderRadius: "4px",
              bgcolor: "transparent",
              color: c.textSecondary,
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRightOutlined sx={{ fontSize: 14 }} />
          </Box>
        </Box>
      )}
    </>
  );
};
