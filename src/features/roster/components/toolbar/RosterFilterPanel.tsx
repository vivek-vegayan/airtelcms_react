import {
  Box,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FilterListIcon from "@mui/icons-material/FilterList";
import { SHIFT_COLOR_MAP } from "../../constant/shiftPalette";

/* ─── Filter toggle button (lives in the toolbar row) ───────────────────── */
interface ToggleProps {
  open: boolean;
  onToggle: () => void;
  hasActiveFilters: boolean;
}

export const FilterToggleButton = ({
  open,
  onToggle,
  hasActiveFilters,
}: ToggleProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

  return (
    <Tooltip title="Filters">
      <IconButton
        size="small"
        onClick={onToggle}
        sx={{
          border: `1px solid ${CELL_BORDER}`,
          borderRadius: "8px",
          p: "4px",
          position: "relative",
          bgcolor: open
            ? alpha(theme.palette.primary.main, 0.08)
            : isDark
              ? "background.default"
              : "#fff",
          color: hasActiveFilters ? "primary.main" : "inherit",
        }}
      >
        <FilterListIcon sx={{ fontSize: 16 }} />
        {hasActiveFilters && (
          <Box
            sx={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 5,
              height: 5,
              borderRadius: "50%",
              bgcolor: "primary.main",
            }}
          />
        )}
      </IconButton>
    </Tooltip>
  );
};

/* ─── Collapsible filter panel ──────────────────────────────────────────── */
interface PanelProps {
  open: boolean;
  filterShift: string[];
  onFilterShiftChange: (v: string[]) => void;
  filterLevel: string[];
  onFilterLevelChange: (v: string[]) => void;
  jobLevels: string[];
}

/**
 * Shift-type + job-level multi-select panel shared by the Weekly and
 * Monthly toolbars, with removable chips for the active selections.
 */
export const RosterFilterPanel = ({
  open,
  filterShift,
  onFilterShiftChange,
  filterLevel,
  onFilterLevelChange,
  jobLevels,
}: PanelProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

  return (
    <Collapse in={open}>
      <Box
        display="flex"
        gap={1}
        mt={0.5}
        mb={0.5}
        p={1.5}
        sx={{
          border: `1px solid ${CELL_BORDER}`,
          borderRadius: "8px",
          bgcolor: isDark ? theme.palette.background.paper : "#FAFAFA",
        }}
      >
        {/* Shift type multi-select */}
        <Select
          size="small"
          displayEmpty
          multiple
          value={filterShift}
          onChange={(e) => onFilterShiftChange(e.target.value as string[])}
          renderValue={(selected) =>
            (selected as string[]).length === 0 ? (
              <em
                style={{ fontSize: 11, color: isDark ? "#6B7280" : "#9CA3AF" }}
              >
                All shift types
              </em>
            ) : (
              <Typography fontSize={11} noWrap>
                {(selected as string[])
                  .map((k) => SHIFT_COLOR_MAP[k]?.label ?? k)
                  .join(", ")}
              </Typography>
            )
          }
          sx={{
            fontSize: 11,
            borderRadius: "8px",
            height: 30,
            minWidth: 190,
            bgcolor: isDark ? "background.default" : "#fff",
          }}
          MenuProps={{
            PaperProps: { sx: { maxHeight: 280, borderRadius: "8px" } },
          }}
        >
          {Object.entries(SHIFT_COLOR_MAP)

            .map(([k, p]) => (
              <MenuItem key={k} value={k} sx={{ py: "4px" }}>
                <Checkbox
                  checked={filterShift.includes(k)}
                  size="small"
                  sx={{ p: "2px", mr: "6px" }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "2px",
                    bgcolor: p.badgeBg,
                    flexShrink: 0,
                    mr: "6px",
                  }}
                />
                <ListItemText
                  primary={`${k} – ${p.label}`}
                  primaryTypographyProps={{ fontSize: 11 }}
                />
              </MenuItem>
            ))}
        </Select>

        {/* Job level multi-select */}
        <Select
          size="small"
          displayEmpty
          multiple
          value={filterLevel}
          onChange={(e) => onFilterLevelChange(e.target.value as string[])}
          renderValue={(selected) =>
            (selected as string[]).length === 0 ? (
              <em
                style={{ fontSize: 11, color: isDark ? "#6B7280" : "#9CA3AF" }}
              >
                All job levels
              </em>
            ) : (
              <Typography fontSize={11} noWrap>
                {(selected as string[]).join(", ")}
              </Typography>
            )
          }
          sx={{
            fontSize: 11,
            borderRadius: "8px",
            height: 30,
            minWidth: 150,
            bgcolor: isDark ? "background.default" : "#fff",
          }}
          MenuProps={{
            PaperProps: { sx: { maxHeight: 280, borderRadius: "8px" } },
          }}
        >
          {jobLevels.map((lvl) => (
            <MenuItem key={lvl} value={lvl} sx={{ py: "4px" }}>
              <Checkbox
                checked={filterLevel.includes(lvl)}
                size="small"
                sx={{ p: "2px", mr: "6px" }}
              />
              <ListItemText
                primary={lvl}
                primaryTypographyProps={{ fontSize: 11 }}
              />
            </MenuItem>
          ))}
        </Select>

        {/* Active filter chip previews */}
        {(filterShift.length > 0 || filterLevel.length > 0) && (
          <Stack direction="row" flexWrap="wrap" gap="4px" alignItems="center">
            {filterShift.map((k) => (
              <Chip
                key={k}
                size="small"
                label={SHIFT_COLOR_MAP[k]?.label ?? k}
                onDelete={() =>
                  onFilterShiftChange(filterShift.filter((x) => x !== k))
                }
                sx={{
                  height: 20,
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  bgcolor: isDark
                    ? alpha(SHIFT_COLOR_MAP[k]?.badgeBg ?? "#000", 0.15)
                    : SHIFT_COLOR_MAP[k]?.cardBg,
                  color: SHIFT_COLOR_MAP[k]?.textColor,
                  border: `1px solid ${SHIFT_COLOR_MAP[k]?.cardBorder}`,
                }}
              />
            ))}
            {filterLevel.map((lvl) => (
              <Chip
                key={lvl}
                size="small"
                label={lvl}
                onDelete={() =>
                  onFilterLevelChange(filterLevel.filter((x) => x !== lvl))
                }
                sx={{ height: 20, fontSize: "0.6rem", fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Collapse>
  );
};
