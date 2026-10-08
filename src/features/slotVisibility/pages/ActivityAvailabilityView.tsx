import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useEffect, useMemo, useState } from "react";

import { useTabColorTokens } from "../../../style/theme";
import { ChartCard } from "../../crqAnalytics/components/ChartCard";
import { EmptyOrErrorState } from "../../crqAnalytics/components/EmptyOrErrorState";
import { MiniStat, SlotStatusChip } from "../components/slotVisibilityUi";
import {
  fromDayjs,
  toDayjs,
  useSlotTones,
  type SlotStatus,
} from "../components/slotVisibility.styles";
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

/** API status string → display label + tone bucket. */
const resolveStatus = (status: string): { label: string; tone: SlotStatus } => {
  switch (status?.trim().toUpperCase()) {
    case "AVAILABLE":
      return { label: "Available", tone: "available" };
    case "FULL":
      return { label: "Full", tone: "full" };
    case "HOLIDAY":
      return { label: "Holiday", tone: "holiday" };
    case "NO ELIGIBLE ENGINEER":
    case "NOT ELIGIBLE":
      return { label: "No eligible engineer", tone: "neutral" };
    case "NOT ROSTERED":
      return { label: "Not rostered", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
};

export default function ActivityAvailabilityView() {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const tones = useSlotTones();

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
  const [hasSearched, setHasSearched] = useState(false);

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

  const canSearch = Boolean(
    domain && layer && planType && vendor && impact && fromDate && toDate,
  );

  const handleShowAvailability = async () => {
    if (!canSearch) {
      return;
    }

    setHasSearched(true);

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

  /* =========================================================
     RENDER
  ========================================================= */

  const headCellSx = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".4px",
    textTransform: "uppercase" as const,
    color: colors.textSecondary,
    background: colors.surface2,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: "nowrap" as const,
  };

  const bodyCellSx = {
    fontSize: 13,
    color: colors.textPrimary,
    borderBottom: `1px solid ${colors.border}`,
  };

  const renderResults = () => {
    if (!hasSearched) {
      return (
        <ChartCard title="Availability" height="auto">
          <EmptyOrErrorState
            kind="empty"
            message="Choose the activity on the left and click “Show availability”."
          />
        </ChartCard>
      );
    }

    return (
      <Stack spacing={2}>
        {/* RESOLVED ACTIVITY */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" },
            gap: 1,
          }}
        >
          <MiniStat label="Domain" value={domain} />
          <MiniStat label="Layer" value={layer} />
          <MiniStat label="Plan type" value={planType} />
          <MiniStat label="Vendor" value={vendor} />
          <MiniStat label="Impact" value={impact} />
          <MiniStat label="Window" value={`${fromDate} → ${toDate}`} />
        </Box>

        <ChartCard title="Availability by shift date" height="auto">
          {isAvailabilityError ? (
            <EmptyOrErrorState kind="error" message="Failed to load availability." />
          ) : isAvailabilityLoading ? (
            <Stack spacing={1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={40} />
              ))}
            </Stack>
          ) : showAvailability.length === 0 ? (
            <EmptyOrErrorState kind="empty" message="No availability found for the selected filters." />
          ) : (
            <TableContainer sx={{ maxHeight: "calc(100vh - 360px)", borderRadius: colors.radius }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Shift date</TableCell>
                    <TableCell sx={headCellSx}>Shift</TableCell>
                    <TableCell sx={headCellSx}>Work window</TableCell>
                    <TableCell sx={headCellSx} align="right">Rostered</TableCell>
                    <TableCell sx={headCellSx} align="right">Eligible</TableCell>
                    <TableCell sx={headCellSx} align="right">Reserved</TableCell>
                    <TableCell sx={headCellSx} align="right">Confirmed</TableCell>
                    <TableCell sx={headCellSx} align="right">Still fits</TableCell>
                    <TableCell sx={headCellSx}>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {showAvailability.map((row, index) => {
                    const status = resolveStatus(row.status);

                    return (
                      <TableRow
                        key={`${row.shiftDate}-${row.shiftName}-${index}`}
                        hover
                        sx={{ "&:last-child td": { borderBottom: 0 } }}
                      >
                        <TableCell sx={{ ...bodyCellSx, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {row.shiftDate}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, fontWeight: 800 }}>{row.shiftName}</TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: colors.textSecondary, whiteSpace: "nowrap" }}>
                          {row.workWindow}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="right">{row.rostered}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">{row.eligible}</TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: tones.low.color, fontWeight: 600 }} align="right">
                          {row.reserved}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: theme.palette.info.main, fontWeight: 600 }} align="right">
                          {row.confirmed}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...bodyCellSx,
                            fontSize: 15,
                            fontWeight: 800,
                            color: row.stillFits > 0 ? tones.available.color : tones.full.color,
                          }}
                          align="right"
                        >
                          {row.stillFits}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, maxWidth: 240 }}>
                          <SlotStatusChip label={status.label} tone={tones[status.tone]} />
                          {row.reason && (
                            <Typography
                              title={row.reason}
                              sx={{
                                mt: 0.4,
                                fontSize: 11,
                                color: colors.textSecondary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {row.reason}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </ChartCard>
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" },
        gap: 2,
        alignItems: "start",
      }}
    >
      {/* =========================================================
          ACTIVITY FORM
      ========================================================= */}
      <ChartCard title="Activity" height="auto">
        <Stack spacing={1.75}>
          <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, mt: -0.75 }}>
            Same values the requester enters when booking.
          </Typography>

          {isFilterError && (
            <Typography sx={{ fontSize: 12, color: colors.danger }}>
              Failed to load activity filter values.
            </Typography>
          )}

          <OptionSelect
            label="Domain"
            value={domain}
            onChange={setDomain}
            options={filterData?.domain}
            loading={isFilterLoading}
          />

          <OptionSelect
            label="Layer"
            value={layer}
            onChange={setLayer}
            options={filterData?.layer}
            loading={isFilterLoading}
          />

          <OptionSelect
            label="Plan type"
            value={planType}
            onChange={setPlanType}
            options={filterData?.plan_type}
            loading={isFilterLoading}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <OptionSelect
              label="Vendor"
              value={vendor}
              onChange={setVendor}
              options={vendorOptions}
              loading={isFilterLoading}
            />
            <OptionSelect
              label="Impact"
              value={impact}
              onChange={setImpact}
              options={filterData?.change_impact}
              loading={isFilterLoading}
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <DatePicker
                label="From"
                value={toDayjs(fromDate)}
                onChange={(v) => setFromDate(fromDayjs(v))}
                maxDate={toDayjs(toDate) ?? undefined}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
              <DatePicker
                label="To"
                value={toDayjs(toDate)}
                onChange={(v) => setToDate(fromDayjs(v))}
                minDate={toDayjs(fromDate) ?? undefined}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>

          <Button
            fullWidth
            variant="contained"
            disabled={isAvailabilityLoading || !canSearch}
            onClick={handleShowAvailability}
            startIcon={
              isAvailabilityLoading ? <CircularProgress size={16} color="inherit" /> : <SearchRoundedIcon />
            }
            sx={{ py: 1, fontWeight: 700, textTransform: "none" }}
          >
            {isAvailabilityLoading ? "Loading..." : "Show availability"}
          </Button>

          <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>
            Up to 93 days. Vendor is matched exactly.
          </Typography>
        </Stack>
      </ChartCard>

      {/* =========================================================
          RESULTS
      ========================================================= */}
      <Box sx={{ minWidth: 0 }}>{renderResults()}</Box>
    </Box>
  );
}

/* ================================================================
   OPTION SELECT
================================================================ */

function OptionSelect({
  label,
  value,
  onChange,
  options,
  loading,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  loading: boolean;
}) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value}
      disabled={loading}
      onChange={(e) => onChange(e.target.value)}
    >
      {loading ? (
        <MenuItem value="">Loading...</MenuItem>
      ) : options?.length ? (
        options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))
      ) : (
        <MenuItem value="">No values</MenuItem>
      )}
    </TextField>
  );
}
