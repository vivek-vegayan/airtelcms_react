import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";

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
//getting whole dashboard data 0
//something has gone wrong
export default function TeamCapacityView() {
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

  const {
    options: orgOptions,
    isLoading: isOrgLoading,
    isError: isOrgError,
  } = useOrgHierarchyFilters(orgFilters);

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
          const combinedData = responses.flat();

          console.log("TEAM CAPACITY RESPONSE:", combinedData);

          setCapacityData(combinedData);
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

        console.log("TOTAL TEAM COUNT:", total);

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

  const getStatus = (freeMin: number) => {
    if (freeMin < 0) return "HOLIDAY";
    if (freeMin === 0) return "FULL";
    if (freeMin <= 120) return "LOW";

    return "AVAILABLE";
  };

  const getColors = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return {
          bg: "#DDEFE3",
          fg: "#14532D",
        };

      case "LOW":
        return {
          bg: "#FBEBC8",
          fg: "#6E3A00",
        };

      case "FULL":
        return {
          bg: "#F6D7D2",
          fg: "#8A1C12",
        };

      case "HOLIDAY":
        return {
          bg: "#E6DDF5",
          fg: "#3F2275",
        };

      default:
        return {
          bg: "#ECEAE4",
          fg: "#57554E",
        };
    }
  };

  /* =========================================================
     ENGINEER BAR WIDTH
  ========================================================= */

  const getEngineerBarWidths = (engineer: EngineerCapacity) => {
    const total =
      (engineer.confirmedMin ?? 0) +
      (engineer.reservedMin ?? 0) +
      (engineer.freeMin ?? 0);

    console.log("Engineer capacity:", {
      total,
      confirmedMin: engineer.confirmedMin,
      reservedMin: engineer.reservedMin,
      freeMin: engineer.freeMin,
    });

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
     RENDER
  ========================================================= */

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: "#F4F3EF",
      }}
    >
      {/* =====================================================
          FILTERS
      ===================================================== */}

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          backgroundColor: "#FBFAF7",
          border: "1px solid #DEDBD2",
          borderRadius: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "flex-end" }}
          flexWrap="wrap"
        >
          {/* ORG FILTERS */}

          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
          >
            {/* Vertical */}

            <FormControl
              size="small"
              sx={{ minWidth: 190 }}
              disabled={isOrgLoading}
            >
              <InputLabel>Vertical</InputLabel>

              <Select
                value={orgFilters.vertical ?? ""}
                label="Vertical"
                onChange={(event) => {
                  const value = event.target.value;

                  handleOrgFilterChange(
                    "vertical",
                    value === "" ? undefined : Number(value),
                  );
                }}
              >
                {orgOptions.vertical.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Team Function */}

            <FormControl
              size="small"
              sx={{ minWidth: 200 }}
              disabled={!orgFilters.vertical || isOrgLoading}
            >
              <InputLabel>Team Function</InputLabel>

              <Select
                value={orgFilters.teamFunction ?? ""}
                label="Team Function"
                onChange={(event) => {
                  const value = event.target.value;

                  handleOrgFilterChange(
                    "teamFunction",
                    value === "" ? undefined : Number(value),
                  );
                }}
              >
                {orgOptions.teamFunction.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Domain */}

            <FormControl
              size="small"
              sx={{ minWidth: 180 }}
              disabled={!orgFilters.teamFunction || isOrgLoading}
            >
              <InputLabel>Domain</InputLabel>

              <Select
                value={orgFilters.domain ?? ""}
                label="Domain"
                onChange={(event) => {
                  const value = event.target.value;

                  handleOrgFilterChange(
                    "domain",
                    value === "" ? undefined : Number(value),
                  );
                }}
              >
                {orgOptions.domain.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* SubDomain */}

            <FormControl
              size="small"
              sx={{ minWidth: 190 }}
              disabled={!orgFilters.domain || isOrgLoading}
            >
              <InputLabel>SubDomain</InputLabel>

              <Select
                value={orgFilters.subDomain ?? ""}
                label="SubDomain"
                onChange={(event) => {
                  const value = event.target.value;

                  handleOrgFilterChange(
                    "subDomain",
                    value === "" ? undefined : Number(value),
                  );
                }}
              >
                {orgOptions.subDomain.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Clear */}

            {(orgFilters.vertical ||
              orgFilters.teamFunction ||
              orgFilters.domain ||
              orgFilters.subDomain) && (
              <Button
                size="small"
                variant="text"
                onClick={resetOrgFilters}
                sx={{
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </Button>
            )}
          </Stack>

          {/* FROM */}

          <Filter label="From">
            <TextField
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              size="small"
              sx={{
                minWidth: 170,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#FFFFFF",
                },
              }}
            />
          </Filter>

          {/* TO */}

          <Filter label="To">
            <TextField
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              size="small"
              sx={{
                minWidth: 170,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#FFFFFF",
                },
              }}
            />
          </Filter>

          {/* SHIFTS */}

          <Filter label="Shifts">
            <Stack direction="row" spacing={0.75}>
              {shifts.map((shift) => {
                const active = selectedShifts.includes(shift.name);

                return (
                  <Button
                    key={shift.name}
                    variant={active ? "contained" : "outlined"}
                    onClick={() => {
                      setSelectedShifts((prev) =>
                        prev.includes(shift.name)
                          ? prev.filter((name) => name !== shift.name)
                          : [...prev, shift.name],
                      );
                    }}
                    sx={{
                      minWidth: 52,
                      height: 40,
                      px: 1.5,
                      borderRadius: 1,
                      fontWeight: 600,

                      ...(active
                        ? {
                            backgroundColor: "#1C1B19",
                            color: "#FFFFFF",
                            "&:hover": {
                              backgroundColor: "#2E2D29",
                            },
                          }
                        : {
                            borderColor: "#CFCBC0",
                            color: "#3F3D37",
                            backgroundColor: "#FFFFFF",
                            "&:hover": {
                              borderColor: "#1C1B19",
                              backgroundColor: "#F4F3EF",
                            },
                          }),
                    }}
                  >
                    {shift.name}
                  </Button>
                );
              })}
            </Stack>
          </Filter>
        </Stack>
      </Paper>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}
      <Stack style={{ display: "flex", flexDirection: "row", gap: 4 }}>
        <Kpi
          title="Activities that still fit"
          value={String(totalTeamCount?.activities_that_fit ?? 0)}
          description="120-min activity, selected shifts"
        />

        <Kpi
          title="Reserved (awaiting CRQ)"
          value={String(totalTeamCount?.reserved_cnt ?? 0)}
          description="Held for up to 1 hour"
        />

        <Kpi
          title="Confirmed"
          value={String(totalTeamCount?.confirmed_cnt ?? 0)}
          description="CRQ number attached"
        />

        <Kpi
          title="Confirmed"
          value={String(totalTeamCount?.confirmed_cnt ?? 0)}
          description="Booked ÷ activity-window minutes"
        />
      </Stack>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      {/* //Remove SCroll give inside scroll within the box only */}
      <Stack
        direction={{ xs: "column", xl: "row" }}
        spacing={2}
        sx={{
          mt: 2,
        }}
      >
        {/* ===================================================
            CAPACITY GRID
        =================================================== */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            p: 2.5,
            backgroundColor: "#FFFFFF",
            border: "1px solid #DEDBD2",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontSize: 17,
              fontWeight: 600,
              color: "#1C1B19",
            }}
          >
            Capacity by shift date
          </Typography>

          {isCapacityError && (
            <Typography
              sx={{
                mb: 2,
                color: "#8A1C12",
                fontSize: 13,
              }}
            >
              Failed to load team capacity.
            </Typography>
          )}

          {/* CAPACITY GRID */}
          <Box
            sx={{
              display: "grid",

              // First column = shift name
              // Remaining columns automatically share available width
              gridTemplateColumns: `70px repeat(${days.length}, minmax(0, 1fr))`,

              gap: 0.5,
              width: "100%",
            }}
          >
            {/* Empty corner */}
            <Box />

            {/* DAYS */}
            {days.map((day) => (
              <Box
                key={day.key}
                sx={{
                  minWidth: 0,
                  textAlign: "center",
                  pb: 0.75,
                  fontFamily: "monospace",
                  fontWeight: 600,
                  color: "#57554E",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {day.weekday}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1C1B19",
                  }}
                >
                  {day.day}
                </Typography>
              </Box>
            ))}

            {/* SHIFTS */}
            {shifts
              .filter((shift) => selectedShifts.includes(shift.name))
              .map((shift) => (
                <Box
                  key={shift.name}
                  sx={{
                    display: "contents",
                  }}
                >
                  {/* SHIFT NAME */}
                  <Box
                    sx={{
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {shift.name}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#77736A",
                        fontFamily: "monospace",
                      }}
                    >
                      {shift.window}
                    </Typography>
                  </Box>

                  {/* CELLS */}
                  {days.map((day) => {
                    const item = capacityLookup[`${shift.name}_${day.key}`];

                    const freeMin = item?.free_min ?? 0;
                    const status = getStatus(freeMin);
                    const color = getColors(status);

                    return (
                      <Button
                        key={`${shift.name}_${day.key}`}
                        onClick={() => {
                          if (!item) return;
                          handleSlotClick(item);
                        }}
                        disableRipple
                        sx={{
                          width: "100%",
                          minWidth: 0,
                          height: 74,
                          p: 0.5,
                          borderRadius: 1,

                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          gap: 0.25,

                          backgroundColor: color.bg,
                          color: color.fg,

                          fontFamily: "monospace",
                          textTransform: "none",

                          "&:hover": {
                            backgroundColor: color.bg,
                            filter: "brightness(0.97)",
                          },

                          ...(selectedSlot &&
                            item &&
                            selectedSlot.shiftName === item.shiftName &&
                            selectedSlot.shiftDate?.slice(0, 10) ===
                              item.shiftDate?.slice(0, 10) && {
                              outline: "2px solid #1C1B19",
                              outlineOffset: -2,
                            }),
                        }}
                      >
                        {isCapacityLoading ? (
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "#77736A",
                            }}
                          >
                            ...
                          </Typography>
                        ) : item ? (
                          <>
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: "monospace",
                                lineHeight: 1.2,
                              }}
                            >
                              {item.free_min} min
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 10,
                                fontWeight: 600,
                                fontFamily: "monospace",
                                lineHeight: 1.2,
                              }}
                            >
                              {item.reserved_cnt}R · {item.confirmed_cnt}C
                            </Typography>
                          </>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "#77736A",
                            }}
                          >
                            No data
                          </Typography>
                        )}
                      </Button>
                    );
                  })}
                </Box>
              ))}
          </Box>

          {/* LEGEND */}
          <Box
            sx={{
              mt: 2.5,
              pt: 1.75,
              borderTop: "1px solid #E7E4DC",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "#57554E",
                mr: 0.5,
              }}
            >
              Capacity status
            </Typography>

            {[
              {
                label: "Available",
                bg: "#DDEFE3",
                fg: "#14532D",
              },
              {
                label: "Low",
                bg: "#FBEBC8",
                fg: "#6E3A00",
              },
              {
                label: "Full",
                bg: "#F6D7D2",
                fg: "#8A1C12",
              },
              {
                label: "Holiday",
                bg: "#E6DDF5",
                fg: "#3F2275",
              },
            ].map((legend) => (
              <Box
                key={legend.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: 0.75,
                    backgroundColor: legend.bg,
                    border: `1px solid ${legend.fg}25`,
                    flexShrink: 0,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#57554E",
                  }}
                >
                  {legend.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
        {/* ===================================================
    SELECTED SLOT
=================================================== */}

        <Paper
          elevation={0}
          sx={{
            width: {
              xs: "100%",
              xl: "26vw",
            },
            minWidth: {
              xl: 380,
            },

            // Fixed card height on desktop
            height: {
              xs: "auto",
              xl: "calc(100vh - 110px)",
            },

            maxHeight: {
              xs: "none",
              xl: "calc(100vh - 110px)",
            },

            p: 2.5,
            backgroundColor: "#FFFFFF",
            border: "1px solid #DEDBD2",
            borderRadius: 2,

            alignSelf: "flex-start",

            // Important for internal scrolling
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* ===================================================
      TITLE
  =================================================== */}

          <Typography
            variant="overline"
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#57554E",
              flexShrink: 0,
            }}
          >
            Selected slot
          </Typography>

          {!selectedSlot ? (
            <Typography
              sx={{
                mt: 2,
                color: "#77736A",
                fontSize: 13,
              }}
            >
              Select a capacity slot to view details.
            </Typography>
          ) : (
            <>
              {/* ===================================================
          SLOT INFORMATION
      =================================================== */}

              <Typography
                sx={{
                  mt: 1,
                  fontSize: 21,
                  fontWeight: 700,
                  color: "#1C1B19",
                  flexShrink: 0,
                }}
              >
                {selectedSlot.shiftName} shift ·{" "}
                {formatSelectedDate(selectedSlot.shiftDate)}
              </Typography>

              {/* WORK WINDOW */}

              <Typography
                sx={{
                  mt: 0.5,
                  color: "#57554E",
                  fontFamily: "monospace",
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                Work window {selectedSlotShift?.window ?? "-"}
              </Typography>

              {/* AVAILABILITY */}

              <Box
                sx={{
                  mt: 2,
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  backgroundColor:
                    selectedSlot.free_min > 0 ? "#DDEFE3" : "#F6D7D2",
                  color: selectedSlot.free_min > 0 ? "#14532D" : "#8A1C12",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {selectedSlot.free_min > 0
                    ? `Available · ${selectedSlot.free_min} min free`
                    : "Full"}
                </Typography>
              </Box>

              {/* ===================================================
          SUMMARY
      =================================================== */}

              <Grid
                container
                spacing={1}
                sx={{
                  mt: 1.5,
                  flexShrink: 0,
                }}
              >
                {/* Rostered */}

                <Grid size={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: "#F4F3EF",
                      borderRadius: 1.5,
                      minHeight: 78,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#57554E",
                      }}
                    >
                      Rostered
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        fontSize: 23,
                        fontWeight: 600,
                        color: "#1C1B19",
                      }}
                    >
                      {engineerSummary.rostered}
                    </Typography>
                  </Box>
                </Grid>

                {/* Reserved */}

                <Grid size={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: "#F4F3EF",
                      borderRadius: 1.5,
                      minHeight: 78,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#57554E",
                      }}
                    >
                      Reserved
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        fontSize: 23,
                        fontWeight: 600,
                        color: "#B77900",
                      }}
                    >
                      {engineerSummary.reserved}
                    </Typography>
                  </Box>
                </Grid>

                {/* Confirmed */}

                <Grid size={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: "#F4F3EF",
                      borderRadius: 1.5,
                      minHeight: 78,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#57554E",
                      }}
                    >
                      Confirmed
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        fontSize: 23,
                        fontWeight: 600,
                        color: "#145A8D",
                      }}
                    >
                      {engineerSummary.confirmed}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* ===================================================
          ENGINEERS HEADER
      =================================================== */}

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  mt: 2.5,
                  mb: 1.5,
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Engineers
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#77736A",
                  }}
                >
                  minutes of activity window
                </Typography>
              </Stack>

              {/* ===================================================
          ENGINEER LIST
          ONLY THIS SECTION SCROLLS
      =================================================== */}

              <Box
                sx={{
                  flex: 1,
                  minHeight: 12,
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 0.75,

                  "&::-webkit-scrollbar": {
                    width: 6,
                  },

                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "#F4F3EF",
                    borderRadius: 10,
                  },

                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#C8C5BC",
                    borderRadius: 10,
                  },

                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#AAA69C",
                  },
                }}
              >
                {isEngineerLoading ? (
                  <Typography
                    sx={{
                      color: "#77736A",
                      fontSize: 13,
                      py: 1,
                    }}
                  >
                    Loading engineers...
                  </Typography>
                ) : isEngineerError ? (
                  <Typography
                    sx={{
                      color: "#8A1C12",
                      fontSize: 13,
                      py: 1,
                    }}
                  >
                    Failed to load engineer capacity.
                  </Typography>
                ) : engineerData.length === 0 ? (
                  <Typography
                    sx={{
                      color: "#77736A",
                      fontSize: 13,
                      py: 1,
                    }}
                  >
                    No engineer data available for this slot.
                  </Typography>
                ) : (
                  <Stack spacing={1.75}>
                    {engineerData.map((engineer) => {
                      const widths = getEngineerBarWidths(engineer);

                      return (
                        <Box key={engineer.rosterId}>
                          {/* ENGINEER HEADER */}

                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography
                              sx={{
                                fontSize: 13,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <strong>{engineer.employeeName}</strong>{" "}
                              <Box
                                component="span"
                                sx={{
                                  color: "#57554E",
                                }}
                              >
                                {engineer.olmid}
                              </Box>
                              {" · "}
                              <Box
                                component="span"
                                sx={{
                                  color: "#57554E",
                                }}
                              >
                                {engineer.jobLevel}
                              </Box>
                            </Typography>

                            <Typography
                              sx={{
                                flexShrink: 0,
                                fontSize: 12,
                                fontFamily: "monospace",
                                color: "#14745F",
                              }}
                            >
                              {engineer.freeMin} min free
                            </Typography>
                          </Stack>

                          {/* CAPACITY BAR */}

                          <Box
                            sx={{
                              mt: 0.75,
                              height: 11,
                              borderRadius: 10,
                              backgroundColor: "#E7E4DC",
                              overflow: "hidden",
                              display: "flex",
                            }}
                          >
                            {/* Confirmed */}

                            {widths.confirmed > 0 && (
                              <Box
                                sx={{
                                  width: `${widths.confirmed}%`,
                                  height: "100%",
                                  backgroundColor: "#20558A",
                                }}
                              />
                            )}

                            {/* Reserved */}

                            {widths.reserved > 0 && (
                              <Box
                                sx={{
                                  width: `${widths.reserved}%`,
                                  height: "100%",
                                  backgroundColor: "#D99A22",
                                }}
                              />
                            )}

                            {/* Free */}

                            {widths.free > 0 && (
                              <Box
                                sx={{
                                  width: `${widths.free}%`,
                                  height: "100%",
                                  backgroundColor: "#E7E4DC",
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              {/* ===================================================
          ENGINEER LEGEND
      =================================================== */}

              {engineerData.length > 0 && (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    mt: 2,
                    flexWrap: "wrap",
                    flexShrink: 0,
                  }}
                >
                  <LegendItem color="#20558A" label="Confirmed" />

                  <LegendItem color="#D99A22" label="Reserved" />

                  <LegendItem color="#E7E4DC" label="Free" border />
                </Stack>
              )}

              {/* ===================================================
          ACTIVITY BUTTON
      =================================================== */}

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2.5,
                  py: 1.25,
                  backgroundColor: "#106B63",
                  borderRadius: 1.5,
                  fontWeight: 600,
                  textTransform: "none",
                  flexShrink: 0,

                  "&:hover": {
                    backgroundColor: "#0D5A53",
                  },
                }}
                onClick={() => {
                  console.log("Check activity:", selectedSlot);
                }}
              >
                Check an activity for this date
              </Button>
            </>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}

/* ============================================================
   FILTER
============================================================ */

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: "#57554E",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </Typography>

      {children}
    </Box>
  );
}

/* ============================================================
   KPI
============================================================ */

function Kpi({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1,
        p: "8px 20px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #DEDBD2",
        borderRadius: 2,
        width: "23vw",
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: "#57554E",
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: 32,
          fontWeight: 600,
          fontFamily: "monospace",
          color: "#1C1B19",
        }}
      >
        {value}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: 12,
          color: "#77736A",
        }}
      >
        {description || title}
      </Typography>
    </Paper>
  );
}

/* ============================================================
   LEGEND
============================================================ */

function LegendItem({
  color,
  label,
  border = false,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: 0.5,
          backgroundColor: color,
          border: border ? "1px solid #CFCBC0" : "none",
        }}
      />

      <Typography
        sx={{
          fontSize: 12,
          color: "#57554E",
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
