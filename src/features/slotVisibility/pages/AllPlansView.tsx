import {
  Box,
  Stack,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Button,
  InputLabel,
} from "@mui/material";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useEffect, useState } from "react";
import {
  type AllPlans,
  useLazyGetAllPlansQuery,
} from "../api/slotVisiblityApi";

export default function AllPlansView() {
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
    };
  });

  const {
    values: orgFilters,
    handleChange: handleOrgFilterChange,
    resetAll: resetOrgFilters,
  } = useOrgHierarchyState("allPlans");

  const {
    options: orgOptions,
    isLoading: isOrgLoading,
    isError: isOrgError,
  } = useOrgHierarchyFilters(orgFilters);

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
        console.log("Plans Data:-");
        console.log(response);
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

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: "#F4F3EF",
      }}
    >
      {/* =========================================================
          FILTERS
      ========================================================= */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "flex-end" }}
        sx={{
          py: 2,
        }}
      >
        {/* Team */}
        {/* Vertical */}

        <FormControl
          size="small"
          sx={{ minWidth: 170 }}
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
          sx={{ minWidth: 170 }}
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
          sx={{ minWidth: 170 }}
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
          sx={{ minWidth: 170 }}
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

        {/* Plan type */}
        <Filter label="Plan type">
          <TextField
            size="small"
            type="search"
            placeholder="Search plan type"
            sx={{
              minWidth: 190,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#FFFFFF",
              },
            }}
          />
        </Filter>

        {/* Show */}
        <Filter label="Show">
          <FormControl
            size="small"
            sx={{
              minWidth: 170,
            }}
          >
            <Select
              defaultValue="All plans"
              sx={{
                backgroundColor: "#FFFFFF",
              }}
            >
              <MenuItem value="All plans">All plans</MenuItem>

              <MenuItem value="Plans with a full day">
                Plans with a full day
              </MenuItem>

              <MenuItem value="Plans with no capacity">
                Plans with no capacity
              </MenuItem>
            </Select>
          </FormControl>
        </Filter>

        {/* Refreshed */}
        <Typography
          variant="body2"
          sx={{
            ml: { xs: 0, md: "auto" },
            pb: 1,
            color: "#57554E",
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          Refreshed 10:05 · all vendors
        </Typography>
      </Stack>

      {/* =========================================================
          TABLE
      ========================================================= */}

      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #DEDBD2",
          borderRadius: 2,
          overflow: "hidden",
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            maxHeight: "calc(100vh - 315px)",
            overflowY: "auto",
            overflowX: "hidden",

            "&::-webkit-scrollbar": {
              width: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#F4F3EF",
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
          {/* =====================================================
        TABLE HEADER
    ===================================================== */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 2.5fr) 70px 65px repeat(14, minmax(0, 1fr)) 75px",
              gap: 0.75,
              px: 2.5,
              py: 1.5,
              backgroundColor: "#F4F3EF",
              borderBottom: "1px solid #DEDBD2",
              alignItems: "center",
            }}
          >
            <TableHeader>Plan type</TableHeader>

            <TableHeader>Time</TableHeader>

            <TableHeader>Shifts</TableHeader>

            {days.map((day) => (
              <Box
                key={day.date}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1.1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    color:
                      day.weekday === "Sat" || day.weekday === "Sun"
                        ? "#A52A2A"
                        : "#57554E",
                  }}
                >
                  {day.weekday}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      day.weekday === "Sat" || day.weekday === "Sun"
                        ? "#A52A2A"
                        : "#1C1B19",
                  }}
                >
                  {day.day}
                </Typography>
              </Box>
            ))}

            <TableHeader align="right">14-day fit</TableHeader>
          </Box>

          {/* =====================================================
        LOADING
    ===================================================== */}

          {isAllPlansLoading && (
            <Box
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#6B6961",
                }}
              >
                Loading plans...
              </Typography>
            </Box>
          )}

          {/* =====================================================
        ERROR
    ===================================================== */}

          {isAllPlansError && !isAllPlansLoading && (
            <Box
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#B42318",
                }}
              >
                Failed to load plan availability.
              </Typography>
            </Box>
          )}

          {/* =====================================================
        NO SUBDOMAIN SELECTED
    ===================================================== */}

          {!orgFilters.subDomain && !isAllPlansLoading && !isAllPlansError && (
            <Box
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#77746C",
                }}
              >
                Select a SubDomain to view plan availability.
              </Typography>
            </Box>
          )}

          {/* =====================================================
        NO DATA
    ===================================================== */}

          {orgFilters.subDomain &&
            allPlansData.length === 0 &&
            !isAllPlansLoading &&
            !isAllPlansError && (
              <Box
                sx={{
                  py: 7,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#77746C",
                  }}
                >
                  No plans available for the selected SubDomain.
                </Typography>
              </Box>
            )}

          {/* =====================================================
        TABLE ROWS
    ===================================================== */}

          {!isAllPlansLoading &&
            !isAllPlansError &&
            tableRows.map((plan, rowIndex) => {
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
                    gridTemplateColumns:
                      "minmax(220px, 2.5fr) 70px 65px repeat(14, minmax(0, 1fr)) 75px",
                    gap: 0.75,
                    px: 2.5,
                    minHeight: 68,
                    alignItems: "center",
                    borderBottom: "1px solid #EEECE6",

                    "&:hover": {
                      backgroundColor: "#FAF9F6",
                    },
                  }}
                >
                  {/* =================================================
                PLAN INFORMATION
            ================================================= */}

                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1C1B19",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {plan.plan_type}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        fontSize: 12,
                        color: "#6B6961",
                        fontFamily: "monospace",
                      }}
                    >
                      {plan.domain} · {plan.shift_name}
                    </Typography>
                  </Box>

                  {/* =================================================
                TIME
            ================================================= */}

                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#3F3D37",
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {plan.required_min} min
                  </Typography>

                  {/* =================================================
                SHIFTS
            ================================================= */}

                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#3F3D37",
                      fontFamily: "monospace",
                    }}
                  >
                    {plan.shift_name}
                  </Typography>

                  {/* =================================================
                DAILY CAPACITY
            ================================================= */}

                  {days.map((day) => {
                    const cell = plan.values[day.date];

                    const value = cell?.value;
                    const status = cell?.status?.toUpperCase();

                    const holiday = status === "HOLIDAY" || status === "FREEZE";

                    const noRoster =
                      status === "NO ROSTER" || status === "NOT ELIGIBLE";

                    const full = value === 0 || status === "FULL";

                    const low = value !== undefined && value > 0 && value <= 2;

                    let backgroundColor = "#E8E6E1";
                    let color = "#57554E";
                    let title = "No roster / not eligible";

                    if (holiday) {
                      backgroundColor = "#E6DDF5";
                      color = "#3F2275";
                      title = "Holiday / freeze";
                    } else if (full) {
                      backgroundColor = "#F6D7D2";
                      color = "#8A1C12";
                      title = "Full";
                    } else if (low) {
                      backgroundColor = "#FBEBC8";
                      color = "#6E3A00";
                      title = `${value} fit`;
                    } else if (value !== undefined && value >= 3) {
                      backgroundColor = "#DDEFE3";
                      color = "#14532D";
                      title = `${value} fit`;
                    } else if (!noRoster) {
                      backgroundColor = "#E8E6E1";
                      color = "#57554E";
                    }

                    return (
                      <Box
                        key={day.date}
                        title={title}
                        sx={{
                          height: 40,
                          borderRadius: 1,

                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",

                          backgroundColor,
                          color,

                          fontFamily: "monospace",
                          fontWeight: 600,
                          fontSize: 13,

                          cursor: "default",

                          transition: "transform 0.12s ease",

                          "&:hover": {
                            transform: "scale(1.04)",
                          },
                        }}
                      >
                        {holiday ? "H" : value === undefined ? "–" : value}
                      </Box>
                    );
                  })}

                  {/* =================================================
                14 DAY TOTAL
            ================================================= */}

                  <Typography
                    sx={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontSize: 18,
                      fontWeight: 600,
                      color: total < 10 ? "#8A1C12" : "#1C1B19",
                    }}
                  >
                    {total}
                  </Typography>
                </Box>
              );
            })}
        </Box>

        {/* =====================================================
        LEGEND
    ===================================================== */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #EEECE6",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              color: "#57554E",
            }}
          >
            Cell = activities that still fit that shift date (best allowed
            shift)
          </Typography>

          <LegendItem backgroundColor="#DDEFE3" label="3+" />

          <LegendItem backgroundColor="#FBEBC8" label="1–2" />

          <LegendItem backgroundColor="#F6D7D2" label="Full" />

          <LegendItem backgroundColor="#E6DDF5" label="Holiday / freeze" />

          <LegendItem
            backgroundColor="#E8E6E1"
            label="No roster / not eligible"
          />
        </Box>
      </Paper>
    </Box>
  );
}

/* ================================================================
   FILTER
================================================================ */

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

/* ================================================================
   TABLE HEADER
================================================================ */

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: "#57554E",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        textAlign: align,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Typography>
  );
}

function LegendItem({
  backgroundColor,
  label,
}: {
  backgroundColor: string;
  label: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.6,
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: 0.7,
          backgroundColor,
        }}
      />

      <Typography
        sx={{
          fontSize: 11,
          color: "#57554E",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
