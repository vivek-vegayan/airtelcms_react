import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useEffect, useState } from "react";

import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useTabColorTokens } from "../../../style/theme";
import { ChartCard } from "../../crqAnalytics/components/ChartCard";
import { EmptyOrErrorState } from "../../crqAnalytics/components/EmptyOrErrorState";
import { SlotFilterBar, SlotLegend } from "../components/slotVisibilityUi";
import { getRoleName, useSlotTones, type SlotStatus } from "../components/slotVisibility.styles";
import {
  type AllPlans,
  useLazyGetAllPlansQuery,
} from "../api/slotVisiblityApi";

const SHOW_OPTIONS = ["All plans", "Plans with a full day", "Plans with no capacity"];

// Plan type | Time | Shifts | 14 days | 14-day fit
const GRID_COLUMNS = "minmax(220px, 2.5fr) 70px 60px repeat(14, minmax(34px, 1fr)) 72px";

interface PlanCell {
  value: number;
  status: string;
}

interface TableRow {
  plan_type: string;
  domain: string;
  shift_name: string;
  required_min: number;
  values: Record<string, PlanCell>;
}

/** One day's cell → tone bucket, label and tooltip. */
const resolveCell = (cell?: PlanCell): { tone: SlotStatus; label: string; title: string } => {
  const value = cell?.value;
  const status = cell?.status?.toUpperCase();

  const label = value === undefined ? "–" : String(value);

  if (status === "HOLIDAY" || status === "FREEZE") {
    return { tone: "holiday", label: "H", title: "Holiday / freeze" };
  }
  if (value === 0 || status === "FULL") {
    return { tone: "full", label, title: "Full" };
  }
  if (value !== undefined && value > 0 && value <= 2) {
    return { tone: "low", label, title: `${value} fit` };
  }
  if (value !== undefined && value >= 3) {
    return { tone: "available", label, title: `${value} fit` };
  }
  return { tone: "neutral", label, title: "No roster / not eligible" };
};

export default function AllPlansView() {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const tones = useSlotTones();

  const [planTypeSearch, setPlanTypeSearch] = useState("");
  const [showFilter, setShowFilter] = useState("All plans");

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return {
      date: `${year}-${month}-${day}`,
      day: String(date.getDate()).padStart(2, "0"),
      weekday: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      weekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });

  const {
    values: orgFilters,
    handleChange: handleOrgFilterChange,
    resetAll: resetOrgFilters,
  } = useOrgHierarchyState("allPlans");

  const { options: orgOptions } = useOrgHierarchyFilters(orgFilters);

  const [allPlansData, setAllPlansData] = useState<AllPlans[]>([]);

  const tableRows: TableRow[] = Array.from(
    allPlansData.reduce<Map<string, TableRow>>((map, item) => {
      const key = `${item.plan_type}-${item.shift_name}`;

      if (!map.has(key)) {
        map.set(key, {
          plan_type: item.plan_type,
          domain: item.domain,
          shift_name: item.shift_name,
          required_min: item.required_min,
          values: {},
        });
      }

      const row = map.get(key)!;

      row.values[item.shift_date] = {
        value: item.activities_that_fit,
        status: item.slot_status,
      };

      return map;
    }, new Map<string, TableRow>()),
    ([, row]) => row,
  );

  const filteredTableRows = tableRows
    .filter((plan) =>
      plan.plan_type
        .toLowerCase()
        .includes(planTypeSearch.trim().toLowerCase()),
    )
    .filter((plan) => {
      if (showFilter === "All plans") {
        return true;
      }

      const dayValues = days.map((day) => plan.values[day.date]);

      if (showFilter === "Plans with a full day") {
        // At least one day has 0 capacity / FULL
        return dayValues.some((cell) => {
          if (!cell) return false;

          return cell.value === 0 || cell.status?.toUpperCase() === "FULL";
        });
      }

      if (showFilter === "Plans with no capacity") {
        // No capacity across all 14 days
        return dayValues.every((cell) => {
          if (!cell) return true;

          return (
            cell.value === 0 ||
            cell.status?.toUpperCase() === "FULL" ||
            cell.status?.toUpperCase() === "NO ROSTER" ||
            cell.status?.toUpperCase() === "NOT ELIGIBLE"
          );
        });
      }

      return true;
    });

  const [
    getAllPlans,
    { isLoading: isAllPlansLoading, isError: isAllPlansError },
  ] = useLazyGetAllPlansQuery();

  useEffect(() => {
    if (!orgFilters.domain || !orgFilters.subDomain) {
      setAllPlansData([]);
      return;
    }

    const selectedDomain = orgOptions.domain.find(
      (option) => option.value === orgFilters.domain,
    );

    const selectedSubDomain = orgOptions.subDomain.find(
      (option) => option.value === orgFilters.subDomain,
    );

    if (!selectedDomain || !selectedSubDomain) {
      setAllPlansData([]);
      return;
    }

    const loadAllPlans = async () => {
      try {
        const response = await getAllPlans({
          teamName: selectedSubDomain.value,
        }).unwrap();
        setAllPlansData(response);
      } catch (error) {
        console.error("Failed to load all plans:", error);
        setAllPlansData([]);
      }
    };

    loadAllPlans();
  }, [
    orgFilters.domain,
    orgFilters.subDomain,
    orgOptions.domain,
    orgOptions.subDomain,
    getAllPlans,
  ]);

  const hasOrgSelection = Boolean(
    orgFilters.vertical ||
      orgFilters.teamFunction ||
      orgFilters.domain ||
      orgFilters.subDomain,
  );

  /* =========================================================
     RENDER
  ========================================================= */

  const headerTextSx = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".4px",
    textTransform: "uppercase" as const,
    color: colors.textSecondary,
    whiteSpace: "nowrap" as const,
  };

  const renderBody = () => {
    if (isAllPlansLoading) {
      return (
        <Stack spacing={1} sx={{ p: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={44} />
          ))}
        </Stack>
      );
    }

    if (isAllPlansError) {
      return <EmptyOrErrorState kind="error" message="Failed to load plan availability." />;
    }

    if (!orgFilters.subDomain) {
      return <EmptyOrErrorState kind="empty" message="Select a Sub Domain to view plan availability." />;
    }

    if (allPlansData.length === 0) {
      return <EmptyOrErrorState kind="empty" message="No plans available for the selected Sub Domain." />;
    }

    if (filteredTableRows.length === 0) {
      return (
        <EmptyOrErrorState
          kind="empty"
          message={planTypeSearch ? `No plans found for "${planTypeSearch}".` : "No plans match this view."}
        />
      );
    }

    return filteredTableRows.map((plan, rowIndex) => {
      const total = days.reduce((sum, day) => {
        const cell = plan.values[day.date];

        if (!cell) {
          return sum;
        }

        return cell.value > 0 ? sum + cell.value : sum;
      }, 0);

      return (
        <Box
          key={`${plan.plan_type}-${plan.shift_name}-${rowIndex}`}
          sx={{
            display: "grid",
            gridTemplateColumns: GRID_COLUMNS,
            gap: 0.75,
            px: 2,
            py: 1,
            alignItems: "center",
            borderBottom: `1px solid ${colors.border}`,
            "&:last-child": { borderBottom: 0 },
            "&:hover": { background: colors.selectedRow },
          }}
        >
          {/* PLAN INFORMATION */}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              title={plan.plan_type}
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: colors.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {plan.plan_type}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 11.5, color: colors.textSecondary }}>
              {plan.domain} · {plan.shift_name}
            </Typography>
          </Box>

          {/* TIME */}
          <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, whiteSpace: "nowrap" }}>
            {plan.required_min} min
          </Typography>

          {/* SHIFTS */}
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>
            {plan.shift_name}
          </Typography>

          {/* DAILY CAPACITY */}
          {days.map((day) => {
            const cell = resolveCell(plan.values[day.date]);
            const tone = tones[cell.tone];

            return (
              <Box
                key={day.date}
                title={cell.title}
                sx={{
                  height: 36,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: tone.bg,
                  border: `1px solid ${tone.border}`,
                  color: tone.color,
                  fontWeight: 800,
                  fontSize: 12.5,
                  transition: "transform .12s ease",
                  "&:hover": { transform: "scale(1.06)" },
                }}
              >
                {cell.label}
              </Box>
            );
          })}

          {/* 14 DAY TOTAL */}
          <Typography
            sx={{
              textAlign: "right",
              fontSize: 17,
              fontWeight: 900,
              color: total < 10 ? tones.full.color : colors.textPrimary,
            }}
          >
            {total}
          </Typography>
        </Box>
      );
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* =========================================================
          FILTERS
      ========================================================= */}
      <SlotFilterBar>
        <OrgHierarchyFilters
          role={getRoleName()}
          values={orgFilters}
          options={orgOptions}
          onChange={handleOrgFilterChange}
        />

        {hasOrgSelection && (
          <Button size="small" variant="text" onClick={resetOrgFilters} sx={{ textTransform: "none" }}>
            Clear
          </Button>
        )}

        <TextField
          size="small"
          type="search"
          label="Plan type"
          placeholder="Search plan type"
          value={planTypeSearch}
          onChange={(e) => setPlanTypeSearch(e.target.value)}
          sx={{ minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Show"
          value={showFilter}
          onChange={(e) => setShowFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {SHOW_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </SlotFilterBar>

      {/* =========================================================
          TABLE
      ========================================================= */}
      <ChartCard
        title="Plan availability · next 14 days"
        height="auto"
        action={
          filteredTableRows.length > 0 && (
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
              {filteredTableRows.length} plan{filteredTableRows.length === 1 ? "" : "s"}
            </Typography>
          )
        }
      >
        <Box
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: colors.radiusL,
            overflow: "auto",
            maxHeight: "calc(100vh - 340px)",
          }}
        >
          <Box sx={{ minWidth: 980 }}>
            {/* TABLE HEADER */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: GRID_COLUMNS,
                gap: 0.75,
                px: 2,
                py: 1.25,
                alignItems: "center",
                background: colors.surface2,
                borderBottom: `1px solid ${colors.border}`,
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <Typography sx={headerTextSx}>Plan type</Typography>
              <Typography sx={headerTextSx}>Time</Typography>
              <Typography sx={headerTextSx}>Shift</Typography>

              {days.map((day) => (
                <Box key={day.date} sx={{ textAlign: "center", lineHeight: 1.1 }}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: day.weekend ? colors.danger : colors.textSecondary,
                    }}
                  >
                    {day.weekday}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: day.weekend ? colors.danger : colors.textPrimary,
                    }}
                  >
                    {day.day}
                  </Typography>
                </Box>
              ))}

              <Typography sx={{ ...headerTextSx, textAlign: "right" }}>14-day fit</Typography>
            </Box>

            {renderBody()}
          </Box>
        </Box>

        {/* LEGEND */}
        <Box sx={{ mt: 1.75, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>
            Cell = activities that still fit that shift date (best allowed shift)
          </Typography>
          <SlotLegend
            items={[
              { label: "3+", tone: tones.available },
              { label: "1–2", tone: tones.low },
              { label: "Full", tone: tones.full },
              { label: "Holiday / freeze", tone: tones.holiday },
              { label: "No roster / not eligible", tone: tones.neutral },
            ]}
          />
        </Box>
      </ChartCard>
    </Box>
  );
}
