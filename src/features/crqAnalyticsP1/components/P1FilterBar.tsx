import { Box, Button, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography, useTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { RefreshIconButton } from "../../../components/ui/RefreshIconButton";
import { useApiRefresh, type ApiTag } from "../../../hooks/useApiRefresh";
import { QUICK_DATE_OPTIONS } from "../../crqAnalytics/utils/dateRange";
import type { P1FilterKey, UseP1FiltersReturn } from "../hooks/useP1Filters";
import { ddmon, hm } from "../utils/p1Format";

// Every analytics endpoint provides this tag, so one invalidation reloads whichever view is open.
const ANALYTICS_TAGS: ApiTag[] = ["CrqAnalytics"];

const FILTER_META: Record<P1FilterKey, { label: string; all: string; width: number }> = {
  vertical: { label: "Vertical", all: "All verticals", width: 170 },
  side: { label: "Who holds it", all: "CCB + SE", width: 130 },
  domain: { label: "Domain", all: "All domains", width: 165 },
  subDomain: { label: "Team", all: "All teams", width: 180 },
  stage: { label: "Stage", all: "All stages", width: 185 },
  circle: { label: "Circle", all: "All circles", width: 120 },
};

/**
 * Filters + date range of the Phase 1 views, in the same glass bar as the other analytics tabs.
 * Options come from CRQ_AN_SP_FILTERS; each view shows only the filters its procedures use.
 */
export function P1FilterBar({ f, note }: { f: UseP1FiltersReturn; note?: string }) {
  const theme = useTheme();
  const { refresh, isRefreshing } = useApiRefresh({ tags: ANALYTICS_TAGS, onRefresh: f.touchNow });
  const anySet = f.active.some((k) => f.values[k]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
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
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        {f.active.map((key) => {
          const meta = FILTER_META[key];
          return (
            <TextField
              key={key}
              select
              size="small"
              label={key === "side" && f.view === "teams" ? "Side" : meta.label}
              value={f.values[key]}
              onChange={(e) => f.setFilter(key, e.target.value)}
              sx={{ minWidth: meta.width }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">{meta.all}</MenuItem>
              {f.options[key].map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          );
        })}
        {anySet && (
          <Button size="small" onClick={f.resetFilters} sx={{ textTransform: "none" }}>
            Clear filters
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <RefreshIconButton onClick={refresh} busy={isRefreshing} title="Refresh analytics" />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        <ToggleButtonGroup size="small" color="primary" exclusive value={f.quickFilter} onChange={(_e, v) => v && f.setQuickFilter(v)}>
          {QUICK_DATE_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: "none", px: 1.75 }}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {f.quickFilter === "custom" && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <DatePicker
                label="From"
                value={f.customStart}
                onChange={f.setCustomStart}
                maxDate={f.customEnd ?? dayjs()}
                slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
              />
              <DatePicker
                label="To"
                value={f.customEnd}
                onChange={f.setCustomEnd}
                minDate={f.customStart ?? undefined}
                maxDate={dayjs()}
                slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
              />
            </Box>
          </LocalizationProvider>
        )}

        <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
          Showing{" "}
          <Box component="b" sx={{ color: "text.primary" }}>
            {f.range.label}
          </Box>
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 11.5, color: f.dataStatus?.lastRunStatus === "ERROR" ? "error.main" : "text.secondary" }}>
          {f.filtersError
            ? "Filters could not be loaded"
            : f.dataAsOf
              ? `Data as of ${ddmon(f.dataAsOf)}, ${hm(f.dataAsOf)}${f.dataStatus?.lastRunStatus === "ERROR" ? " · last refresh failed" : ""}`
              : "Loading…"}
        </Typography>
      </Box>

      {note && <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>{note}</Typography>}
    </Box>
  );
}
