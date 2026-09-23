import { useState, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Popover,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Button,
  Divider,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FilterListIcon from "@mui/icons-material/FilterList";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

export interface FilterState {
  level: string[];       // multi-check: "L1" | "L2" | "L3"
  activity: string;      // radio: "All" | "With CRQs" | "Without"
}

export interface MetaColDef {
  key: string;
  label: string;
  width: number;
  sortable?: boolean;
  sortAscLabel?: string;
  sortDescLabel?: string;
  filterType?: "check" | "radio";
  filterOptions?: string[];
}

interface RosterMetaHeadProps {
  col: MetaColDef;
  sort: SortState;
  filter: FilterState;
  onSort: (key: string, dir: SortDir) => void;
  onFilter: (key: string, value: string[] | string) => void;
}

export const RosterMetaHead = ({
  col,
  sort,
  filter,
  onSort,
  onFilter,
}: RosterMetaHeadProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [popOpen, setPopOpen] = useState(false);

  const isActive = sort.key === col.key;
  const hasFilter =
    (col.key === "level" && filter.level.length > 0) ||
    (col.key === "activity" && filter.activity !== "All");

  const cycleSort = () => {
    if (!col.sortable) return;
    if (!isActive) {
      onSort(col.key, "asc");
    } else if (sort.dir === "asc") {
      onSort(col.key, "desc");
    } else {
      onSort("", "asc"); // clear
    }
  };

  const SortIcon = () => {
    if (!col.sortable) return null;
    if (!isActive)
      return (
        <UnfoldMoreIcon
          sx={{ fontSize: 13, color: "text.disabled", opacity: 0.5 }}
        />
      );
    return sort.dir === "asc" ? (
      <ArrowUpwardIcon
        sx={{ fontSize: 13, color: theme.palette.primary.main }}
      />
    ) : (
      <ArrowDownwardIcon
        sx={{ fontSize: 13, color: theme.palette.primary.main }}
      />
    );
  };

  return (
    <>
      <Box
        component="th"
        sx={{
          width: col.width,
          minWidth: col.width,
          px: 1,
          py: 0.75,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.8)
            : "#F9FAFB",
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderRight: `1px solid ${theme.palette.divider}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
          userSelect: "none",
        }}
      >
        <Stack direction="row" alignItems="center" gap={0.25}>
          {/* Label + sort click */}
          <Stack
            direction="row"
            alignItems="center"
            gap={0.4}
            onClick={cycleSort}
            sx={{
              flex: 1,
              cursor: col.sortable ? "pointer" : "default",
              borderRadius: 1,
              px: 0.5,
              py: 0.25,
              "&:hover": col.sortable
                ? {
                    bgcolor: isDark
                      ? alpha("#fff", 0.04)
                      : alpha("#000", 0.04),
                  }
                : {},
            }}
          >
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: isActive
                  ? theme.palette.primary.main
                  : "text.secondary",
                lineHeight: 1,
              }}
            >
              {col.label}
            </Typography>
            <SortIcon />
          </Stack>

          {/* Filter button */}
          {col.filterType && (
            <Tooltip title="Filter">
              <IconButton
                ref={anchorRef}
                size="small"
                onClick={() => setPopOpen(true)}
                sx={{
                  p: 0.25,
                  width: 20,
                  height: 20,
                  color: hasFilter
                    ? theme.palette.primary.main
                    : "text.disabled",
                  bgcolor: hasFilter
                    ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08)
                    : "transparent",
                  "&:hover": {
                    color: "text.secondary",
                    bgcolor: isDark
                      ? alpha("#fff", 0.06)
                      : alpha("#000", 0.05),
                  },
                }}
              >
                <FilterListIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Sort labels (only show on active) */}
        {isActive && col.sortable && (
          <Typography
            sx={{
              fontSize: "0.58rem",
              color: theme.palette.primary.main,
              mt: 0.2,
              px: 0.5,
              fontWeight: 600,
            }}
          >
            {sort.dir === "asc" ? col.sortAscLabel : col.sortDescLabel}
          </Typography>
        )}
      </Box>

      {/* Filter popover */}
      <Popover
        open={popOpen}
        anchorEl={anchorRef.current}
        onClose={() => setPopOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 1,
            }}
          >
            Filter by {col.label}
          </Typography>

          {col.filterType === "check" && (
            <Stack gap={0.25}>
              {(col.filterOptions || []).map((opt) => {
                const checked = filter.level.includes(opt);
                return (
                  <FormControlLabel
                    key={opt}
                    control={
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? filter.level.filter((l) => l !== opt)
                            : [...filter.level, opt];
                          onFilter("level", next);
                        }}
                        sx={{ p: 0.5 }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        {opt}
                      </Typography>
                    }
                    sx={{ mx: 0 }}
                  />
                );
              })}
            </Stack>
          )}

          {col.filterType === "radio" && (
            <RadioGroup
              value={filter.activity}
              onChange={(e) => onFilter("activity", e.target.value)}
            >
              {(col.filterOptions || []).map((opt) => (
                <FormControlLabel
                  key={opt}
                  value={opt}
                  control={<Radio size="small" sx={{ p: 0.5 }} />}
                  label={
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      {opt}
                    </Typography>
                  }
                  sx={{ mx: 0 }}
                />
              ))}
            </RadioGroup>
          )}

          <Divider sx={{ my: 1 }} />
          <Button
            size="small"
            fullWidth
            variant="text"
            color="inherit"
            onClick={() => {
              if (col.key === "level") onFilter("level", []);
              if (col.key === "activity") onFilter("activity", "All");
              setPopOpen(false);
            }}
            sx={{ fontSize: "0.7rem", fontWeight: 600, py: 0.25 }}
          >
            Clear filter
          </Button>
        </Box>
      </Popover>
    </>
  );
};