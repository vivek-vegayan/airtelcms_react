import { Box, MenuItem, TextField, ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { QUICK_DATE_OPTIONS } from "../utils/dateRange";
import { CIRCLE_OPTIONS, type UseAnalyticsFiltersReturn } from "../hooks/useAnalyticsFilters";
import { useApiRefresh, type ApiTag } from "../../../hooks/useApiRefresh";

// Every analytics endpoint provides this one tag, so a single invalidation
// reloads whichever dashboard is mounted around this bar.
const ANALYTICS_TAGS: ApiTag[] = ["CrqAnalytics"];

type Props = Pick<
  UseAnalyticsFiltersReturn,
  | "roleName"
  | "orgValues"
  | "orgOptions"
  | "onOrgFilterChange"
  | "circle"
  | "setCircle"
  | "quickFilter"
  | "setQuickFilter"
  | "customStart"
  | "setCustomStart"
  | "customEnd"
  | "setCustomEnd"
>;

export function AnalyticsFilterBar({
  roleName,
  orgValues,
  orgOptions,
  onOrgFilterChange,
  circle,
  setCircle,
  quickFilter,
  setQuickFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
}: Props) {
  const theme = useTheme();
  const { refresh, isRefreshing } = useApiRefresh({ tags: ANALYTICS_TAGS });

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        p: "14px 18px",
        borderRadius: "14px",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
            : "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === "dark" ? "0 8px 28px rgba(0,0,0,0.4)" : "0 8px 28px rgba(16,40,70,0.06)",
      }}
    >
      <OrgHierarchyFilters
        role={roleName}
        values={orgValues}
        options={orgOptions}
        onChange={onOrgFilterChange}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        refreshTooltip="Refresh analytics"
      />

      <TextField
        select
        size="small"
        label="Circle"
        value={circle}
        onChange={(e) => setCircle(e.target.value)}
        sx={{ minWidth: 110 }}
      >
        {CIRCLE_OPTIONS.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>

      <ToggleButtonGroup
        size="small"
        color="primary"
        exclusive
        value={quickFilter}
        onChange={(_e, v) => v && setQuickFilter(v)}
      >
        {QUICK_DATE_OPTIONS.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: "none", px: 1.75 }}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {quickFilter === "custom" && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <DatePicker
              label="Start date"
              value={customStart}
              onChange={setCustomStart}
              maxDate={customEnd ?? undefined}
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
            <DatePicker
              label="End date"
              value={customEnd}
              onChange={setCustomEnd}
              minDate={customStart ?? undefined}
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
          </Box>
        </LocalizationProvider>
      )}
    </Box>
  );
}
