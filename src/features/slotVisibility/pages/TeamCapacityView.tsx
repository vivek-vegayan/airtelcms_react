import {
  Box,
  Button,
  ButtonBase,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import { useEffect, useMemo, useState } from "react";

import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useTabColorTokens } from "../../../style/theme";
import { getCardSx } from "../../dashboard/constants/dashboard.styles";
import { StatCard } from "../../dashboard/components/StatCard";
import type { StatCardConfig } from "../../dashboard/types/dashboard.types";
import { ChartCard } from "../../crqAnalytics/components/ChartCard";
import { EmptyOrErrorState } from "../../crqAnalytics/components/EmptyOrErrorState";
import { MiniStat, SlotFilterBar, SlotLegend, SlotStatusChip } from "../components/slotVisibilityUi";
import {
  fromDayjs,
  getRoleName,
  toDayjs,
  useSlotTones,
  type SlotStatus,
} from "../components/slotVisibility.styles";

import {
  useLazyGetTeamCapacityCountQuery,
  useLazyGetTotalTeamCountQuery,
  useLazyGetEngineerCapacityQuery,
  type TeamCapacityCount,
  type EngineerCapacity,
  type TotalTeamCount,
} from "../api/slotVisiblityApi";

const shifts = [
  { name: "A", window: "07:30–15:30" },
  { name: "B", window: "14:30–21:30" },
  { name: "G", window: "10:00–18:00" },
  { name: "LG", window: "11:30–19:30" },
  { name: "N", window: "00:00–06:00 +1" },
];

interface TeamCapacityViewProps {
  onCheckActivity: () => void;
}

export default function TeamCapacityView({
  onCheckActivity,
}: TeamCapacityViewProps) {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const tones = useSlotTones();

  /* =========================================================
     STATE
  ========================================================= */

  // All shifts selected by default
  const [selectedShifts, setSelectedShifts] = useState<string[]>(
    shifts.map((shift) => shift.name),
  );
  //From and To date by default will be From current date and to + 9 days
  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getDefaultDates = () => {
    const today = new Date();

    const to = new Date(today);
    to.setDate(to.getDate() + 9);

    return {
      from: getDateString(today),
      to: getDateString(to),
    };
  };

  const defaultDates = getDefaultDates();

  const [fromDate, setFromDate] = useState(defaultDates.from);
  const [toDate, setToDate] = useState(defaultDates.to);
  // Team capacity data
  const [capacityData, setCapacityData] = useState<TeamCapacityCount[]>([]);
  const [isCapacityLoading, setIsCapacityLoading] = useState(false);
  const [isCapacityError, setIsCapacityError] = useState(false);

  const [totalTeamCount, setTotalTeamCount] = useState<TotalTeamCount | null>(
    null,
  );

  // Selected slot
  const [selectedSlot, setSelectedSlot] = useState<TeamCapacityCount | null>(
    null,
  );

  // Engineer capacity for selected slot
  const [engineerData, setEngineerData] = useState<EngineerCapacity[]>([]);
  const [isEngineerLoading, setIsEngineerLoading] = useState(false);
  const [isEngineerError, setIsEngineerError] = useState(false);

  const [getTeamCapacityCount] = useLazyGetTeamCapacityCountQuery();
  const [getTotalTeamCount] = useLazyGetTotalTeamCountQuery();
  const [getEngineerCapacity] = useLazyGetEngineerCapacityQuery();

  /* =========================================================
     ORG FILTERS
  ========================================================= */

  const {
    values: orgFilters,
    handleChange: handleOrgFilterChange,
    resetAll: resetOrgFilters,
  } = useOrgHierarchyState("teamCapacity");

  const { options: orgOptions } = useOrgHierarchyFilters(orgFilters);

  /* =========================================================
     SELECTED TEAM
  ========================================================= */

  const selectedTeamName = useMemo(() => {
    if (!orgFilters.subDomain) {
      return "";
    }

    return (
      orgOptions.subDomain.find(
        (option) => option.value === orgFilters.subDomain,
      )?.label ?? ""
    );
  }, [orgFilters.subDomain, orgOptions.subDomain]);

  /* =========================================================
     DAYS
  ========================================================= */

  const days = useMemo(() => {
    const result: {
      key: string;
      day: string;
      weekday: string;
      weekend: boolean;
    }[] = [];

    if (!fromDate || !toDate) {
      return result;
    }

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);

    const current = new Date(start);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");

      result.push({
        key: `${year}-${month}-${day}`,
        day: String(current.getDate()).padStart(2, "0"),
        weekday: current
          .toLocaleDateString("en-US", {
            weekday: "short",
          })
          .toUpperCase(),
        weekend: current.getDay() === 0 || current.getDay() === 6,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [fromDate, toDate]);

  /* =========================================================
     TEAM CAPACITY LOOKUP
  ========================================================= */

  const capacityLookup = useMemo(() => {
    const lookup: Record<string, TeamCapacityCount> = {};

    capacityData.forEach((item) => {
      if (!item.shiftDate || !item.shiftName) {
        return;
      }

      const date = item.shiftDate.slice(0, 10);

      lookup[`${item.shiftName}_${date}`] = item;
    });

    return lookup;
  }, [capacityData]);

  /* =========================================================
     FETCH TEAM CAPACITY

     API requires shiftName, therefore one request is made
     for each selected shift and responses are combined.
  ========================================================= */

  useEffect(() => {
    if (
      !orgFilters.subDomain ||
      !fromDate ||
      !toDate ||
      selectedShifts.length === 0
    ) {
      setCapacityData([]);
      setSelectedSlot(null);
      setEngineerData([]);
      return;
    }

    const selectedSubDomain = orgOptions.subDomain.find(
      (option) => option.value === orgFilters.subDomain,
    );

    if (!selectedSubDomain) {
      setCapacityData([]);
      setSelectedSlot(null);
      setEngineerData([]);
      return;
    }

    let cancelled = false;

    const fetchCapacity = async () => {
      setIsCapacityLoading(true);
      setIsCapacityError(false);

      setSelectedSlot(null);
      setEngineerData([]);

      try {
        const responses = await Promise.all(
          selectedShifts.map((shiftName) =>
            getTeamCapacityCount({
              fromDate,
              toDate,
              teamName: selectedSubDomain.label,
              shiftName,
            }).unwrap(),
          ),
        );

        if (!cancelled) {
          setCapacityData(responses.flat());
        }
      } catch (error) {
        console.error("Failed to fetch team capacity:", error);

        if (!cancelled) {
          setCapacityData([]);
          setIsCapacityError(true);
        }
      } finally {
        if (!cancelled) {
          setIsCapacityLoading(false);
        }
      }
    };

    fetchCapacity();

    return () => {
      cancelled = true;
    };
  }, [
    orgFilters.subDomain,
    fromDate,
    toDate,
    selectedShifts,
    orgOptions.subDomain,
    getTeamCapacityCount,
  ]);

  useEffect(() => {
    if (
      !orgFilters.subDomain ||
      !fromDate ||
      !toDate ||
      selectedShifts.length === 0
    ) {
      setTotalTeamCount(null);
      return;
    }

    const selectedSubDomain = orgOptions.subDomain.find(
      (option) => option.value === orgFilters.subDomain,
    );

    if (!selectedSubDomain) {
      setTotalTeamCount(null);
      return;
    }

    let cancelled = false;

    const fetchTotalTeamCount = async () => {
      try {
        const responses = await Promise.all(
          selectedShifts.map((shiftName) =>
            getTotalTeamCount({
              fromDate,
              toDate,
              teamName: selectedSubDomain.label,
              shiftName,
            }).unwrap(),
          ),
        );

        if (cancelled) return;

        const total = responses.reduce(
          (acc, item) => ({
            activities_that_fit:
              acc.activities_that_fit + (item.activities_that_fit ?? 0),

            reserved_cnt: acc.reserved_cnt + (item.reserved_cnt ?? 0),

            confirmed_cnt: acc.confirmed_cnt + (item.confirmed_cnt ?? 0),
          }),
          {
            activities_that_fit: 0,
            reserved_cnt: 0,
            confirmed_cnt: 0,
          },
        );

        setTotalTeamCount(total);
      } catch (error) {
        console.error("Failed to fetch total team count:", error);

        if (!cancelled) {
          setTotalTeamCount(null);
        }
      }
    };

    fetchTotalTeamCount();

    return () => {
      cancelled = true;
    };
  }, [
    orgFilters.subDomain,
    fromDate,
    toDate,
    selectedShifts,
    orgOptions.subDomain,
    getTotalTeamCount,
  ]);

  /* =========================================================
     GET ENGINEER CAPACITY FOR SELECTED SLOT
  ========================================================= */

  const handleSlotClick = async (item: TeamCapacityCount) => {
    if (!item.shiftDate || !item.shiftName || !item.teamName) {
      return;
    }

    setSelectedSlot(item);
    setEngineerData([]);
    setIsEngineerLoading(true);
    setIsEngineerError(false);

    try {
      const response = await getEngineerCapacity({
        shiftDate: item.shiftDate.slice(0, 10),
        teamName: item.teamName,
        shiftName: item.shiftName,
      }).unwrap();

      setEngineerData(response);
    } catch (error) {
      console.error("Failed to fetch engineer capacity:", error);
      setEngineerData([]);
      setIsEngineerError(true);
    } finally {
      setIsEngineerLoading(false);
    }
  };

  /* =========================================================
     SELECTED SHIFT WINDOW
  ========================================================= */

  const selectedSlotShift = useMemo(() => {
    if (!selectedSlot) {
      return null;
    }

    return (
      shifts.find((shift) => shift.name === selectedSlot.shiftName) ?? null
    );
  }, [selectedSlot]);

  const engineerSummary = useMemo(() => {
    const rostered = engineerData.length;

    const reserved = engineerData.reduce(
      (total, engineer) => total + (engineer.reservedCnt ?? 0),
      0,
    );

    const confirmed = engineerData.reduce(
      (total, engineer) => total + (engineer.confirmedCnt ?? 0),
      0,
    );

    return {
      rostered,
      reserved,
      confirmed,
    };
  }, [engineerData]);

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatSelectedDate = (date: string) => {
    const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatus = (freeMin: number): SlotStatus => {
    if (freeMin < 0) return "holiday";
    if (freeMin === 0) return "full";
    if (freeMin <= 120) return "low";

    return "available";
  };

  /* =========================================================
     ENGINEER BAR WIDTH
  ========================================================= */

  const getEngineerBarWidths = (engineer: EngineerCapacity) => {
    const total =
      (engineer.confirmedMin ?? 0) +
      (engineer.reservedMin ?? 0) +
      (engineer.freeMin ?? 0);

    if (total <= 0) {
      return {
        confirmed: 0,
        reserved: 0,
        free: 100,
      };
    }

    return {
      confirmed: ((engineer.confirmedMin ?? 0) / total) * 100,
      reserved: ((engineer.reservedMin ?? 0) / total) * 100,
      free: ((engineer.freeMin ?? 0) / total) * 100,
    };
  };

  /* =========================================================
     DERIVED VIEW VALUES
  ========================================================= */

  const visibleShifts = shifts.filter((shift) =>
    selectedShifts.includes(shift.name),
  );

  const hasOrgSelection = Boolean(
    orgFilters.vertical ||
      orgFilters.teamFunction ||
      orgFilters.domain ||
      orgFilters.subDomain,
  );

  const confirmedColor = theme.palette.info.main;
  const reservedColor = theme.palette.warning.main;

  const kpis: StatCardConfig[] = [
    {
      key: "fit",
      label: "Activities that still fit",
      display: totalTeamCount?.activities_that_fit ?? "—",
      sub: "120-min activity, selected shifts",
      tone: "success",
      icon: "event",
    },
    {
      key: "reserved",
      label: "Reserved",
      display: totalTeamCount?.reserved_cnt ?? "—",
      sub: "Awaiting CRQ · held up to 1 hour",
      tone: "warning",
      icon: "clock",
    },
    {
      key: "confirmed",
      label: "Confirmed",
      display: totalTeamCount?.confirmed_cnt ?? "—",
      sub: "CRQ number attached",
      tone: "info",
      icon: "trending",
    },
    {
      key: "team",
      label: "Team",
      display: selectedTeamName || "—",
      sub: `${selectedShifts.length} shift${selectedShifts.length === 1 ? "" : "s"} · ${days.length} day${days.length === 1 ? "" : "s"}`,
      tone: "accent",
      icon: "calendar",
    },
  ];

  const isSlotSelected = (item?: TeamCapacityCount) =>
    Boolean(
      selectedSlot &&
        item &&
        selectedSlot.shiftName === item.shiftName &&
        selectedSlot.shiftDate?.slice(0, 10) === item.shiftDate?.slice(0, 10),
    );

  /* =========================================================
     RENDER
  ========================================================= */

  const renderGrid = () => {
    if (!orgFilters.subDomain) {
      return <EmptyOrErrorState kind="empty" message="Select a Sub Domain to view team capacity." />;
    }

    if (selectedShifts.length === 0) {
      return <EmptyOrErrorState kind="empty" message="Select at least one shift." />;
    }

    if (isCapacityError) {
      return <EmptyOrErrorState kind="error" message="Failed to load team capacity." />;
    }

    return (
      <Box sx={{ overflowX: "auto", pb: 0.5 }}>
        <Box
          sx={{
            display: "grid",
            // First column = shift name; days share the remaining width.
            gridTemplateColumns: `84px repeat(${days.length}, minmax(64px, 1fr))`,
            gap: 0.75,
            minWidth: 84 + days.length * 70,
          }}
        >
          {/* Empty corner */}
          <Box />

          {/* DAYS */}
          {days.map((day) => (
            <Box key={day.key} sx={{ textAlign: "center", pb: 0.5 }}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".5px",
                  color: day.weekend ? colors.danger : colors.textSecondary,
                }}
              >
                {day.weekday}
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: day.weekend ? colors.danger : colors.textPrimary,
                }}
              >
                {day.day}
              </Typography>
            </Box>
          ))}

          {/* SHIFTS */}
          {visibleShifts.map((shift) => (
            <Box key={shift.name} sx={{ display: "contents" }}>
              {/* SHIFT NAME */}
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary }}>
                  {shift.name}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: colors.textSecondary, whiteSpace: "nowrap" }}>
                  {shift.window}
                </Typography>
              </Box>

              {/* CELLS */}
              {days.map((day) => {
                const key = `${shift.name}_${day.key}`;

                if (isCapacityLoading) {
                  return <Skeleton key={key} variant="rounded" height={64} sx={{ borderRadius: "10px" }} />;
                }

                const item = capacityLookup[key];
                const tone = tones[item ? getStatus(item.free_min ?? 0) : "neutral"];
                const selected = isSlotSelected(item);

                return (
                  <ButtonBase
                    key={key}
                    disabled={!item}
                    onClick={() => item && handleSlotClick(item)}
                    sx={{
                      height: 64,
                      minWidth: 0,
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 0.25,
                      background: tone.bg,
                      color: tone.color,
                      border: `1px solid ${selected ? theme.palette.primary.main : tone.border}`,
                      boxShadow: selected ? `0 0 0 2px ${theme.palette.primary.main}` : "none",
                      transition: "transform .15s ease, box-shadow .15s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: selected
                          ? `0 0 0 2px ${theme.palette.primary.main}`
                          : colors.shadowCard,
                      },
                      "&.Mui-disabled": { opacity: 0.7 },
                    }}
                  >
                    {item ? (
                      <>
                        <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
                          {item.free_min}
                          <Box component="span" sx={{ fontSize: 10, fontWeight: 600, ml: 0.25 }}>
                            min
                          </Box>
                        </Typography>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2, opacity: 0.85 }}>
                          {item.reserved_cnt}R · {item.confirmed_cnt}C
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: 11, fontWeight: 600 }}>—</Typography>
                    )}
                  </ButtonBase>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderEngineers = () => {
    if (isEngineerLoading) {
      return (
        <Stack spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={36} />
          ))}
        </Stack>
      );
    }

    if (isEngineerError) {
      return <EmptyOrErrorState kind="error" message="Failed to load engineer capacity." />;
    }

    if (engineerData.length === 0) {
      return <EmptyOrErrorState kind="empty" message="No engineer data available for this slot." />;
    }

    return (
      <Stack spacing={1.5}>
        {engineerData.map((engineer) => {
          const widths = getEngineerBarWidths(engineer);

          return (
            <Box key={engineer.rosterId}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                <Typography
                  sx={{
                    fontSize: 13,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: colors.textPrimary,
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {engineer.employeeName}
                  </Box>{" "}
                  <Box component="span" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                    {engineer.olmid} · {engineer.jobLevel}
                  </Box>
                </Typography>

                <Typography sx={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: tones.available.color }}>
                  {engineer.freeMin} min free
                </Typography>
              </Stack>

              <Box
                sx={{
                  mt: 0.75,
                  height: 8,
                  borderRadius: colors.radiusPill,
                  background: colors.trackOff,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                {widths.confirmed > 0 && <Box sx={{ width: `${widths.confirmed}%`, background: confirmedColor }} />}
                {widths.reserved > 0 && <Box sx={{ width: `${widths.reserved}%`, background: reservedColor }} />}
              </Box>
            </Box>
          );
        })}
      </Stack>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* =====================================================
          FILTERS
      ===================================================== */}
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

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <DatePicker
              label="From"
              value={toDayjs(fromDate)}
              onChange={(v) => setFromDate(fromDayjs(v))}
              maxDate={toDayjs(toDate) ?? undefined}
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
            <DatePicker
              label="To"
              value={toDayjs(toDate)}
              onChange={(v) => setToDate(fromDayjs(v))}
              minDate={toDayjs(fromDate) ?? undefined}
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
          </Box>
        </LocalizationProvider>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>Shifts</Typography>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={selectedShifts}
            onChange={(_e, value: string[]) => setSelectedShifts(value)}
          >
            {shifts.map((shift) => (
              <ToggleButton
                key={shift.name}
                value={shift.name}
                title={`${shift.name} shift · ${shift.window}`}
                sx={{ px: 1, py: 0.25, height: 30, minWidth: 34, fontSize: 12, fontWeight: 700 }}
              >
                {shift.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </SlotFilterBar>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" },
          gap: "10px",
        }}
      >
        {kpis.map((kpi) => (
          <StatCard key={kpi.key} config={kpi} colors={colors} size="small" />
        ))}
      </Box>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 380px" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* CAPACITY GRID */}
        <ChartCard
          title="Capacity by shift date"
          height="auto"
          action={
            <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
              Free min · R reserved · C confirmed
            </Typography>
          }
        >
          {renderGrid()}

          <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${colors.border}` }}>
            <SlotLegend
              title="Capacity status"
              items={[
                { label: "Available", tone: tones.available },
                { label: "Low (≤ 120 min)", tone: tones.low },
                { label: "Full", tone: tones.full },
                { label: "Holiday", tone: tones.holiday },
                { label: "No data", tone: tones.neutral },
              ]}
            />
          </Box>
        </ChartCard>

        {/* SELECTED SLOT */}
        <Box
          sx={{
            ...getCardSx(colors),
            // A sticky side panel shouldn't lift on hover like the other cards.
            "&:hover": { borderColor: colors.borderHover },
            p: "16px 18px",
            display: "flex",
            flexDirection: "column",
            position: { xl: "sticky" },
            top: { xl: 8 },
            maxHeight: { xl: "calc(100vh - 140px)" },
            overflow: "hidden",
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, flexShrink: 0 }}>
            Selected slot
          </Typography>

          {!selectedSlot ? (
            <EmptyOrErrorState kind="empty" message="Click a capacity cell to see who is rostered on it." />
          ) : (
            <>
              <Box sx={{ mt: 1.5, flexShrink: 0 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
                  {selectedSlot.shiftName} shift · {formatSelectedDate(selectedSlot.shiftDate)}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12.5, color: colors.textSecondary }}>
                  Work window {selectedSlotShift?.window ?? "-"}
                </Typography>
                <Box sx={{ mt: 1.25 }}>
                  <SlotStatusChip
                    tone={selectedSlot.free_min > 0 ? tones.available : tones.full}
                    label={selectedSlot.free_min > 0 ? `Available · ${selectedSlot.free_min} min free` : "Full"}
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, flexShrink: 0 }}>
                <MiniStat label="Rostered" value={engineerSummary.rostered} />
                <MiniStat label="Reserved" value={engineerSummary.reserved} color={tones.low.color} />
                <MiniStat label="Confirmed" value={engineerSummary.confirmed} color={confirmedColor} />
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 2.5, mb: 1.25, flexShrink: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>Engineers</Typography>
                <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>minutes of activity window</Typography>
              </Stack>

              {/* Only the engineer list scrolls */}
              <Box sx={{ flex: 1, minHeight: 40, overflowY: "auto", overflowX: "hidden", pr: 0.5 }}>
                {renderEngineers()}
              </Box>

              {engineerData.length > 0 && (
                <Box sx={{ mt: 1.5, flexShrink: 0 }}>
                  <SlotLegend
                    items={[
                      { label: "Confirmed", tone: { color: confirmedColor, bg: confirmedColor, border: confirmedColor } },
                      { label: "Reserved", tone: { color: reservedColor, bg: reservedColor, border: reservedColor } },
                      { label: "Free", tone: { color: colors.textSecondary, bg: colors.trackOff, border: colors.trackOffBorder } },
                    ]}
                  />
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                startIcon={<EventAvailableRoundedIcon />}
                onClick={onCheckActivity}
                sx={{ mt: 2, py: 1, fontWeight: 700, textTransform: "none", flexShrink: 0 }}
              >
                Check an activity for this date
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
