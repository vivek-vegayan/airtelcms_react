import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Search,
  Close,
  Tune,
  Sort,
  RestartAlt,
  ViewList,
  GridView,
  DensitySmall,
  DensityMedium,
  UnfoldLess,
  UnfoldMore,
} from "@mui/icons-material";
import { getRoleConfig } from "../types/user";

export type SortKey = "name-asc" | "name-desc" | "joined-new" | "joined-old" | "role";

export interface FilterOption {
  value: number;
  label: string;
}

export interface UserFilters {
  search: string;
  roleCode: string | "All";
  functionId: number | "All";
  statusFilter: "All" | "Active" | "Inactive";
  sortBy: SortKey;
}

export const DEFAULT_FILTERS: UserFilters = {
  search: "",
  roleCode: "All",
  functionId: "All",
  statusFilter: "All",
  sortBy: "name-asc",
};

interface SearchToolbarProps {
  filters: UserFilters;
  onChange: (patch: Partial<UserFilters>) => void;
  onReset: () => void;
  departments: FilterOption[];
  roles: string[];
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  /** Row density of the grid — a user preference, distinct from `dense` below,
   *  which is a response to the window being short. */
  density?: "compact" | "comfortable";
  onDensityChange?: (density: "compact" | "comfortable") => void;
  /** Whether the stats strip above is currently shown. */
  statsShown?: boolean;
  onToggleStats?: () => void;
  /** Short-viewport mode: tighter padding/margins so the data region keeps
   *  its height. */
  dense?: boolean;
}

const fieldSx = {
  minWidth: 140,
  "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12.5, height: 34 },
};

export default function SearchToolbar({
  filters,
  onChange,
  onReset,
  departments,
  roles,
  viewMode,
  onViewModeChange,
  density = "compact",
  onDensityChange,
  statsShown = true,
  onToggleStats,
  dense = false,
}: SearchToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Debounce search text before it drives the server query, so keystrokes
  // don't each trigger a network round trip.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== filters.search) onChange({ search: searchInput });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = document.activeElement as HTMLElement | null;
      // Also skip textareas and rich-text hosts — the old check only looked at
      // INPUT, so "/" typed into a multiline field stole focus to the search box.
      const typing =
        !!el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const departmentLabel =
    filters.functionId === "All"
      ? null
      : departments.find((d) => d.value === filters.functionId)?.label ?? `#${filters.functionId}`;

  // Every filter currently narrowing the grid, as a removable chip. Before,
  // department and status lived behind a collapsed "Advanced Filters" panel
  // with only a count badge, so a filtered-looking empty grid gave no clue
  // which filter was responsible.
  const activeChips: { key: string; label: string; clear: () => void }[] = [
    filters.search
      ? { key: "search", label: `Search: "${filters.search}"`, clear: () => setSearchInput("") }
      : null,
    filters.roleCode !== "All"
      ? {
          key: "role",
          label: `Role: ${getRoleConfig(filters.roleCode).label}`,
          clear: () => onChange({ roleCode: "All" }),
        }
      : null,
    departmentLabel
      ? {
          key: "dept",
          label: `Department: ${departmentLabel}`,
          clear: () => onChange({ functionId: "All" }),
        }
      : null,
    filters.statusFilter !== "All"
      ? {
          key: "status",
          label: `Status: ${filters.statusFilter}`,
          clear: () => onChange({ statusFilter: "All" }),
        }
      : null,
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const activeAdvancedCount =
    (filters.functionId !== "All" ? 1 : 0) + (filters.statusFilter !== "All" ? 1 : 0);

  return (
    <Box
      sx={{
        p: dense ? 1 : 1.25,
        mb: dense ? 1 : 1.25,
        flexShrink: 0,
        borderRadius: "12px",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <TextField
          inputRef={searchRef}
          placeholder="Search by name, OLM ID or email…"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary", fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchInput ? (
                  <IconButton size="small" onClick={() => setSearchInput("")} aria-label="Clear search">
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                ) : (
                  <Tooltip title="Press / to search">
                    <Box
                      sx={{
                        px: 0.8,
                        py: 0.2,
                        borderRadius: "6px",
                        bgcolor: "action.hover",
                        color: "text.secondary",
                        fontSize: 11,
                        fontWeight: 600,
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      /
                    </Box>
                  </Tooltip>
                )}
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            minWidth: 200,
            "& .MuiOutlinedInput-root": { borderRadius: "999px", fontSize: 12.5, height: 34 },
          }}
        />

        <FormControl size="small" sx={fieldSx}>
          <Select
            value={filters.roleCode}
            onChange={(e) => onChange({ roleCode: e.target.value })}
            displayEmpty
            aria-label="Filter by role"
          >
            <MenuItem value="All">All Roles</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r} value={r}>
                {getRoleConfig(r).label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ ...fieldSx, minWidth: 168 }}>
          <Select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as SortKey })}
            aria-label="Sort"
            startAdornment={
              <InputAdornment position="start">
                <Sort sx={{ fontSize: 16, color: "text.secondary" }} />
              </InputAdornment>
            }
          >
            <MenuItem value="name-asc">Name (A–Z)</MenuItem>
            <MenuItem value="name-desc">Name (Z–A)</MenuItem>
            <MenuItem value="joined-new">Joined (Newest)</MenuItem>
            <MenuItem value="joined-old">Joined (Oldest)</MenuItem>
            <MenuItem value="role">Role</MenuItem>
          </Select>
        </FormControl>

        <Button
          size="small"
          variant={advancedOpen ? "contained" : "outlined"}
          disableElevation
          startIcon={<Tune sx={{ fontSize: 15 }} />}
          onClick={() => setAdvancedOpen((p) => !p)}
          sx={{
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            height: 34,
            ...(advancedOpen ? {} : { borderColor: "divider", color: "text.secondary" }),
          }}
        >
          Filters
          {activeAdvancedCount > 0 && (
            <Chip
              label={activeAdvancedCount}
              size="small"
              sx={{
                ml: 0.75,
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: advancedOpen ? "rgba(255,255,255,0.25)" : "primary.main",
                color: "#fff",
              }}
            />
          )}
        </Button>

        <Stack direction="row" alignItems="center" gap={0.5} ml={{ xs: 0, md: "auto" }}>
          {onToggleStats && (
            <Tooltip title={statsShown ? "Hide summary cards" : "Show summary cards"}>
              <IconButton
                size="small"
                onClick={onToggleStats}
                aria-label={statsShown ? "Hide summary cards" : "Show summary cards"}
                sx={{
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: "divider",
                  width: 34,
                  height: 34,
                  color: statsShown ? "primary.main" : "text.secondary",
                }}
              >
                {statsShown ? <UnfoldLess sx={{ fontSize: 17 }} /> : <UnfoldMore sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>
          )}

          {onDensityChange && (
            <Tooltip title={density === "compact" ? "Switch to comfortable rows" : "Switch to compact rows"}>
              <IconButton
                size="small"
                onClick={() => onDensityChange(density === "compact" ? "comfortable" : "compact")}
                aria-label="Toggle row density"
                sx={{
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: "divider",
                  width: 34,
                  height: 34,
                  color: density === "compact" ? "primary.main" : "text.secondary",
                }}
              >
                {density === "compact" ? (
                  <DensitySmall sx={{ fontSize: 17 }} />
                ) : (
                  <DensityMedium sx={{ fontSize: 17 }} />
                )}
              </IconButton>
            </Tooltip>
          )}

          <Stack direction="row" gap={0.25} sx={{ p: 0.25, borderRadius: "9px", bgcolor: "action.hover" }}>
          <Tooltip title="List view">
            <IconButton
              size="small"
              onClick={() => onViewModeChange("list")}
              aria-label="List view"
              sx={{
                borderRadius: "7px",
                bgcolor: viewMode === "list" ? "background.paper" : "transparent",
                color: viewMode === "list" ? "primary.main" : "text.secondary",
                boxShadow: viewMode === "list" ? (isDark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(15,23,42,0.12)") : "none",
              }}
            >
              <ViewList fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Grid view">
            <IconButton
              size="small"
              onClick={() => onViewModeChange("grid")}
              aria-label="Grid view"
              sx={{
                borderRadius: "7px",
                bgcolor: viewMode === "grid" ? "background.paper" : "transparent",
                color: viewMode === "grid" ? "primary.main" : "text.secondary",
                boxShadow: viewMode === "grid" ? (isDark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(15,23,42,0.12)") : "none",
              }}
            >
              <GridView fontSize="small" />
            </IconButton>
          </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      <Collapse in={advancedOpen}>
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          gap={1}
          mt={1.25}
          pt={1.25}
          sx={{ borderTop: "1px dashed", borderColor: "divider" }}
        >
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary" }}>
            DEPARTMENT
          </Typography>
          <FormControl size="small" sx={fieldSx}>
            <Select
              value={filters.functionId}
              onChange={(e) => onChange({ functionId: e.target.value as number | "All" })}
              aria-label="Filter by department"
            >
              <MenuItem value="All">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary" }}>
            STATUS
          </Typography>
          <FormControl size="small" sx={fieldSx}>
            <Select
              value={filters.statusFilter}
              onChange={(e) => onChange({ statusFilter: e.target.value as UserFilters["statusFilter"] })}
              aria-label="Filter by status"
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Collapse>

      {activeChips.length > 0 && (
        <>
          <Divider sx={{ mt: 1.25 }} />
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={0.75} sx={{ pt: 1.25 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", mr: 0.25 }}>
              FILTERED BY
            </Typography>
            {activeChips.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                size="small"
                onDelete={c.clear}
                deleteIcon={<Close sx={{ fontSize: 13 }} />}
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 600,
                  maxWidth: 260,
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.09),
                  color: isDark ? theme.palette.primary.light : theme.palette.primary.dark,
                  "& .MuiChip-deleteIcon": { color: "inherit", opacity: 0.7 },
                }}
              />
            ))}
            <Tooltip title="Clear all filters">
              <Button
                size="small"
                onClick={onReset}
                startIcon={<RestartAlt sx={{ fontSize: 14 }} />}
                sx={{ fontSize: 11, fontWeight: 700, textTransform: "none", minWidth: 0, px: 1 }}
              >
                Clear all
              </Button>
            </Tooltip>
          </Stack>
        </>
      )}
    </Box>
  );
}
