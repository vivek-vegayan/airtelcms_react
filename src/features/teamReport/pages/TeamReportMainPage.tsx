import { type JSX, type ReactNode, useEffect, useState } from "react";
import { Box, Button, Chip, Paper, Tab, Tabs, alpha, useTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import dayjs, { type Dayjs } from "dayjs";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";
import { ReportTable } from "../components/ReportTable";
import type { ReportDateRange } from "../types/teamReport.types";

interface TeamReportMainPageProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

interface ReportTab {
  key: string;
  label: string;
  url: string;
  renderCell?: (key: string, value: string | number | null) => ReactNode | undefined;
}

const renderCrqRemark = (key: string, value: string | number | null) =>
  key === "Remark" && value ? (
    <Chip size="small" label={String(value)} color={value === "Done" ? "success" : "warning"} variant="outlined" />
  ) : undefined;

// One entry per report. Every report shares the page's date range and the
// same (actor, start, end, offset, limit) procedure shape, so adding one is
// just a new entry here plus its backend endpoint.
const REPORT_TABS: ReportTab[] = [
  { key: "leave", label: "Leaves Reports", url: "/team-report/leave" },
  { key: "work-status", label: "WFH & WFO Status", url: "/team-report/work-status" },
  { key: "week-off", label: "Week Offs Per Employee", url: "/team-report/week-off" },
  { key: "shift-swap", label: "Shift Swap Report", url: "/team-report/shift-swap" },
  { key: "shift-change", label: "Shift Change Report", url: "/team-report/shift-change" },
  { key: "crq", label: "CRQ Report", url: "/crq-analytics-new/crq-report", renderCell: renderCrqRemark },
];

const ISO_DATE = "YYYY-MM-DD";

// Same pointer-under-the-selected-tab indicator the other workspaces use.
const pointerIndicator = (color: string) => ({
  display: "flex",
  justifyContent: "center",
  backgroundColor: "transparent",
  "&::after": {
    content: '""',
    width: 0,
    height: 0,
    borderRight: "8px solid transparent",
    borderLeft: "8px solid transparent",
    borderBottom: `10px solid ${color}`,
    position: "absolute",
    bottom: 0,
  },
});

export default function TeamReportMainPage({ setDynamicHeaderText, setDynamicHeaderIcon }: TeamReportMainPageProps) {
  const theme = useTheme();
  const [activeReport, setActiveReport] = useState(REPORT_TABS[0].key);
  const [start, setStart] = useState<Dayjs | null>(dayjs());
  const [end, setEnd] = useState<Dayjs | null>(dayjs());
  // Only the range last applied with SHOW is queried, so picking dates
  // doesn't fire a request per click.
  const [applied, setApplied] = useState<ReportDateRange>(() => ({
    startDate: dayjs().format(ISO_DATE),
    endDate: dayjs().format(ISO_DATE),
  }));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setDynamicHeaderText("Users All Reports");
    setDynamicHeaderIcon(<GroupsRoundedIcon sx={{ color: "white" }} />);
  }, [setDynamicHeaderText, setDynamicHeaderIcon]);

  const canShow = !!start?.isValid() && !!end?.isValid() && !start.isAfter(end, "day");

  const handleShow = () => {
    if (!canShow) return;
    const next = { startDate: start!.format(ISO_DATE), endDate: end!.format(ISO_DATE) };
    if (next.startDate === applied.startDate && next.endDate === applied.endDate) {
      setRefreshKey((k) => k + 1);
    } else {
      setApplied(next);
    }
  };

  const report = REPORT_TABS.find((t) => t.key === activeReport) ?? REPORT_TABS[0];

  return (
    <Box
      sx={{
        maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        pl: 8,
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          mt: "45px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
              : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}`,
          boxShadow: theme.palette.mode === "dark" ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <Tabs
          value="user-reports"
          sx={{
            px: 2,
            "& .MuiTab-root": { fontWeight: 500, fontSize: 14 },
            "& .Mui-selected": { fontWeight: 600 },
            "& .MuiTabs-indicator": pointerIndicator(theme.palette.primary.main),
          }}
        >
          <Tab label="User Reports" value="user-reports" />
        </Tabs>
      </Box>

      <Box sx={{ px: { xs: 1, md: 4 }, py: 2, display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={start}
              onChange={setStart}
              maxDate={end ?? undefined}
              slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
            />
            <DatePicker
              label="End Date"
              value={end}
              onChange={setEnd}
              minDate={start ?? undefined}
              slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
            />
          </LocalizationProvider>
          <Button variant="outlined" disabled={!canShow} onClick={handleShow} sx={{ px: 3 }}>
            Show
          </Button>
        </Box>

        <Paper
          variant="outlined"
          sx={{ bgcolor: alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.12 : 0.08), borderRadius: 1 }}
        >
          <Tabs
            value={report.key}
            onChange={(_e, v) => setActiveReport(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": { fontWeight: 500, fontSize: 13.5 },
              "& .Mui-selected": {
                bgcolor: "background.paper",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                borderBottom: "none",
              },
              "& .MuiTabs-indicator": pointerIndicator(alpha(theme.palette.primary.main, 0.5)),
            }}
          >
            {REPORT_TABS.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ minWidth: 0 }}>
          {/* Keyed on report + range so switching either remounts the table on its first page. */}
          <ReportTable
            key={`${report.key}_${applied.startDate}_${applied.endDate}`}
            url={report.url}
            title={report.label}
            range={applied}
            refreshKey={refreshKey}
            renderCell={report.renderCell}
          />
        </Box>
      </Box>
    </Box>
  );
}
