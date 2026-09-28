import {
  Box,
  Stack,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Grid,
  TextField,
  Button,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  useLazyGetCheckActivityFilterQuery,
  useLazyGetShowAvailabilityQuery,
  type ShowAvailability,
} from "../api/slotVisiblityApi";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultDates = () => {
  const today = new Date();

  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 9);

  return {
    from: formatDate(today),
    to: formatDate(toDate),
  };
};

export default function ActivityAvailabilityView() {
  /* =========================================================
     FILTER VALUES
  ========================================================= */

  const [domain, setDomain] = useState("");
  const [layer, setLayer] = useState("");
  const [planType, setPlanType] = useState("");
  const [vendor, setVendor] = useState("");
  const [impact, setImpact] = useState("");

  const defaultDates = getDefaultDates();

  const [fromDate, setFromDate] = useState(defaultDates.from);
  const [toDate, setToDate] = useState(defaultDates.to);

  const [showAvailability, setShowAvailability] = useState<ShowAvailability[]>(
    [],
  );

  const [
    getShowAvailability,
    { isLoading: isAvailabilityLoading, isError: isAvailabilityError },
  ] = useLazyGetShowAvailabilityQuery();

  /* =========================================================
     FILTER OPTIONS FROM API
  ========================================================= */

  const [
    getCheckActivityFilter,
    { data: filterData, isLoading: isFilterLoading, isError: isFilterError },
  ] = useLazyGetCheckActivityFilterQuery();

  const vendorOptions = useMemo(() => {
    return Array.from(
      new Set(
        (filterData?.vendor_oem ?? []).flatMap((value) =>
          value
            .split("/")
            .map((vendor) => vendor.trim())
            .filter(Boolean),
        ),
      ),
    );
  }, [filterData?.vendor_oem]);

  const handleShowAvailability = async () => {
    if (
      !domain ||
      !layer ||
      !planType ||
      !vendor ||
      !impact ||
      !fromDate ||
      !toDate
    ) {
      return;
    }

    try {
      const response = await getShowAvailability({
        domain,
        layer,
        planType,
        changeImpact: impact,
        vendorOem: vendor,
        fromDate,
        toDate,
      }).unwrap();

      console.log("SHOW AVAILABILITY RESPONSE:", response);

      setShowAvailability(response);
    } catch (error) {
      console.error("Failed to load activity availability:", error);

      setShowAvailability([]);
    }
  };

  /* =========================================================
     LOAD FILTER VALUES
  ========================================================= */

  useEffect(() => {
    getCheckActivityFilter();
  }, [getCheckActivityFilter]);

  /* =========================================================
     SET DEFAULT VALUE AFTER API RESPONSE
  ========================================================= */

  useEffect(() => {
    if (!filterData) return;

    if (!domain && filterData.domain?.length > 0) {
      setDomain(filterData.domain[0]);
    }

    if (!layer && filterData.layer?.length > 0) {
      setLayer(filterData.layer[0]);
    }

    if (!planType && filterData.plan_type?.length > 0) {
      setPlanType(filterData.plan_type[0]);
    }

    if (!vendor && vendorOptions.length > 0) {
      setVendor(vendorOptions[0]);
    }

    if (!impact && filterData.change_impact?.length > 0) {
      setImpact(filterData.change_impact[0]);
    }
  }, [filterData, domain, layer, planType, vendor, impact, vendorOptions]);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: "#F4F3EF",
      }}
    >
      <Stack
        direction={{ xs: "column", xl: "row" }}
        spacing={2.5}
        alignItems="flex-start"
      >
        {/* =========================================================
            ACTIVITY FORM
        ========================================================= */}

        <Paper
          elevation={0}
          sx={{
            width: {
              xs: "100%",
              xl: 340,
            },
            flexShrink: 0,
            p: 2.5,
            backgroundColor: "#FFFFFF",
            border: "1px solid #DEDBD2",
            borderRadius: 2,
          }}
        >
          <Stack spacing={2}>
            {/* TITLE */}

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#1C1B19",
                }}
              >
                Activity
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  fontSize: 13,
                  color: "#57554E",
                }}
              >
                Same values the requester enters when booking.
              </Typography>
            </Box>

            {/* =====================================================
                FILTER ERROR
            ===================================================== */}

            {isFilterError && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#8A1C12",
                }}
              >
                Failed to load activity filter values.
              </Typography>
            )}

            {/* =====================================================
                DOMAIN
            ===================================================== */}

            <Field label="Domain">
              <FormControl fullWidth size="small">
                <Select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  displayEmpty
                  disabled={isFilterLoading}
                  sx={{
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {isFilterLoading ? (
                    <MenuItem value="">Loading...</MenuItem>
                  ) : filterData?.domain?.length ? (
                    filterData.domain.map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">No values</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Field>

            {/* =====================================================
                LAYER
            ===================================================== */}

            <Field label="Layer">
              <FormControl fullWidth size="small">
                <Select
                  value={layer}
                  onChange={(e) => setLayer(e.target.value)}
                  displayEmpty
                  disabled={isFilterLoading}
                  sx={{
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {isFilterLoading ? (
                    <MenuItem value="">Loading...</MenuItem>
                  ) : filterData?.layer?.length ? (
                    filterData.layer.map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">No values</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Field>

            {/* =====================================================
                PLAN TYPE
            ===================================================== */}

            <Field label="Plan type">
              <FormControl fullWidth size="small">
                <Select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  displayEmpty
                  disabled={isFilterLoading}
                  sx={{
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {isFilterLoading ? (
                    <MenuItem value="">Loading...</MenuItem>
                  ) : filterData?.plan_type?.length ? (
                    filterData.plan_type.map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">No values</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Field>

            {/* =====================================================
                VENDOR + IMPACT
            ===================================================== */}

            <Grid container spacing={1.5}>
              {/* VENDOR */}

              <Grid size={{ xs: 6 }}>
                <Field label="Vendor">
                  <FormControl fullWidth size="small">
                    <Select
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      disabled={isFilterLoading}
                      sx={{
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      {vendorOptions.map((vendorValue) => (
                        <MenuItem key={vendorValue} value={vendorValue}>
                          {vendorValue}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Field>
              </Grid>

              {/* IMPACT */}

              <Grid size={{ xs: 6 }}>
                <Field label="Impact">
                  <FormControl fullWidth size="small">
                    <Select
                      value={impact}
                      onChange={(e) => setImpact(e.target.value)}
                      displayEmpty
                      disabled={isFilterLoading}
                      sx={{
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      {isFilterLoading ? (
                        <MenuItem value="">Loading...</MenuItem>
                      ) : filterData?.change_impact?.length ? (
                        filterData.change_impact.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="">No values</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Field>
              </Grid>
            </Grid>

            <Grid container spacing={1.5}>
              {/* FROM */}

              <Grid size={{ xs: 6 }}>
                <Field label="From">
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </Field>
              </Grid>

              {/* TO */}

              <Grid size={{ xs: 6 }}>
                <Field label="To">
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </Field>
              </Grid>
            </Grid>

            {/* =====================================================
                SHOW AVAILABILITY
            ===================================================== */}

            <Button
              fullWidth
              variant="contained"
              disabled={isAvailabilityLoading}
              onClick={handleShowAvailability}
              sx={{
                height: 44,
                mt: 0.5,
                backgroundColor: "#0F5F59",
                color: "#FFFFFF",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 1,

                "&:hover": {
                  backgroundColor: "#0A4540",
                },

                "&.Mui-disabled": {
                  backgroundColor: "#A7C4C1",
                  color: "#FFFFFF",
                },
              }}
            >
              {isAvailabilityLoading ? "Loading..." : "Show availability"}
            </Button>

            <Typography
              variant="caption"
              sx={{
                fontSize: 12,
                color: "#6B6961",
              }}
            >
              Up to 93 days. Vendor is matched exactly.
            </Typography>
          </Stack>
        </Paper>

        {/* =========================================================
    RESULTS
========================================================= */}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: "100%",
          }}
        >
          {!showAvailability.length && !isAvailabilityLoading ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FFFFFF",
                border: "1px solid #DEDBD2",
                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  color: "#77736A",
                  fontSize: 13,
                }}
              >
                Select the activity filters and click{" "}
                <strong>Show availability</strong>.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {/* =====================================================
          RESOLVED ACTIVITY
      ===================================================== */}

              <Paper
                elevation={0}
                sx={{
                  p: 2.25,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DEDBD2",
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={2}>
                  <Info label="Domain" value={domain} />

                  <Info label="Layer" value={layer} />

                  <Info label="Plan type" value={planType} />

                  <Info label="Vendor" value={vendor} />

                  <Info label="Impact" value={impact} />

                  <Info
                    label="Bookable window"
                    value={`${fromDate} – ${toDate}`}
                  />
                </Grid>
              </Paper>

              {/* =====================================================
          ERROR
      ===================================================== */}

              {isAvailabilityError && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    backgroundColor: "#FFF7F5",
                    border: "1px solid #F1C5BD",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: "#8A1C12",
                      fontSize: 13,
                    }}
                  >
                    Failed to load availability.
                  </Typography>
                </Paper>
              )}

              {/* =====================================================
          AVAILABILITY TABLE
      ===================================================== */}
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DEDBD2",
                  borderRadius: 2,
                  overflow: "auto",
                }}
              >
                <Box
                  sx={{
                    minWidth: 1100,
                  }}
                >
                  {/* TABLE HEADER */}

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "140px 70px 130px repeat(4, minmax(70px, 1fr)) 100px 220px",
                      gap: 1.5,
                      px: 2.5,
                      py: 1.5,
                      backgroundColor: "#F4F3EF",
                      borderBottom: "1px solid #DEDBD2",
                    }}
                  >
                    <TableHeader>Shift date</TableHeader>

                    <TableHeader>Shift</TableHeader>

                    <TableHeader>Work window</TableHeader>

                    <TableHeader>Rostered</TableHeader>

                    <TableHeader>Eligible</TableHeader>

                    <TableHeader>Reserved</TableHeader>

                    <TableHeader>Confirmed</TableHeader>

                    <TableHeader>Still fits</TableHeader>

                    <TableHeader>Status</TableHeader>
                  </Box>

                  {/* LOADING */}

                  {isAvailabilityLoading ? (
                    <Box
                      sx={{
                        py: 5,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#77736A",
                          fontSize: 13,
                        }}
                      >
                        Loading availability...
                      </Typography>
                    </Box>
                  ) : (
                    /* TABLE ROWS */

                    showAvailability.map((row, index) => (
                      <Box
                        key={`${row.shiftDate}-${row.shiftName}-${index}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "140px 70px 130px repeat(4, minmax(70px, 1fr)) 100px 220px",
                          gap: 1.5,
                          px: 2.5,
                          minHeight: 58,
                          alignItems: "center",
                          borderBottom: "1px solid #EEECE6",

                          "&:hover": {
                            backgroundColor: "#FAF9F6",
                          },
                        }}
                      >
                        {/* SHIFT DATE */}

                        <Typography
                          sx={{
                            fontSize: 13,
                            fontFamily: "monospace",
                            fontWeight: 600,
                          }}
                        >
                          {row.shiftDate}
                        </Typography>

                        {/* SHIFT */}

                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {row.shiftName}
                        </Typography>

                        {/* WORK WINDOW */}

                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#57554E",
                            fontFamily: "monospace",
                          }}
                        >
                          {row.workWindow}
                        </Typography>

                        {/* ROSTERED */}

                        <TableValue>{row.rostered}</TableValue>

                        {/* ELIGIBLE */}

                        <TableValue>{row.eligible}</TableValue>

                        {/* RESERVED */}

                        <TableValue color="#8A5A00">{row.reserved}</TableValue>

                        {/* CONFIRMED */}

                        <TableValue color="#1C4E80">{row.confirmed}</TableValue>

                        {/* STILL FITS */}

                        <Typography
                          sx={{
                            fontSize: 16,
                            fontWeight: 600,
                            fontFamily: "monospace",
                            color: row.stillFits > 0 ? "#1F6B45" : "#8A1C12",
                          }}
                        >
                          {row.stillFits}
                        </Typography>

                        {/* STATUS */}

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <StatusChip status={row.status} />

                          {row.reason && (
                            <Typography
                              sx={{
                                mt: 0.25,
                                fontSize: 11,
                                color: "#6B6961",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={row.reason}
                            >
                              {row.reason}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))
                  )}

                  {/* NO RESULTS */}

                  {!isAvailabilityLoading &&
                    !isAvailabilityError &&
                    showAvailability.length === 0 && (
                      <Box
                        sx={{
                          py: 5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#77736A",
                            fontSize: 13,
                          }}
                        >
                          No availability found for the selected filters.
                        </Typography>
                      </Box>
                    )}
                </Box>
              </Paper>
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

/* ================================================================
   FIELD
================================================================ */

function Field({
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
   INFO
================================================================ */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <Box>
        <Typography
          sx={{
            fontSize: 12,
            color: "#57554E",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 15,
            fontWeight: 600,
            color: "#1C1B19",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Grid>
  );
}

/* ================================================================
   TABLE HEADER
================================================================ */

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: "#57554E",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </Typography>
  );
}

/* ================================================================
   TABLE VALUE
================================================================ */

function TableValue({
  children,
  color = "#1C1B19",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Typography
      sx={{
        fontSize: 13,
        fontFamily: "monospace",
        color,
      }}
    >
      {children}
    </Typography>
  );
}

/* ================================================================
   STATUS CHIP
================================================================ */

const StatusChip = ({ status }: { status: string }) => {
  const normalizedStatus = status?.trim().toUpperCase();

  let label = status;
  let backgroundColor = "#E8E6E1";
  let color = "#57554E";

  switch (normalizedStatus) {
    case "AVAILABLE":
      backgroundColor = "#DDEFE3";
      color = "#006B4F";
      label = "Available";
      break;

    case "FULL":
      backgroundColor = "#F6D7D2";
      color = "#B42318";
      label = "Full";
      break;

    case "HOLIDAY":
      backgroundColor = "#E6DDF5";
      color = "#5B2A86";
      label = "Holiday";
      break;

    case "NO ELIGIBLE ENGINEER":
    case "NOT ELIGIBLE":
      backgroundColor = "#E8E6E1";
      color = "#3F3D37";
      label = "No eligible engineer";
      break;

    case "NOT ROSTERED":
      backgroundColor = "#E8E6E1";
      color = "#3F3D37";
      label = "Not rostered";
      break;

    default:
      backgroundColor = "#E8E6E1";
      color = "#57554E";
      label = status;
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        px: 1.5,
        py: 0.5,

        borderRadius: "999px",

        backgroundColor,
        color,

        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.2,

        whiteSpace: "normal",
        maxWidth: "100%",
      }}
    >
      {label}
    </Box>
  );
};
