import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Grid,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  TablePagination,
  Skeleton,
  Divider,
  alpha,
  LinearProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon,
  PeopleAlt as PeopleIcon,
  CheckCircleOutline as ActiveIcon,
  HighlightOff as InactiveIcon,
  AvTimer as AvTimerIcon,
} from "@mui/icons-material";

import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { authStorage } from "../../../app/store/auth.storage";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useApiRefresh } from "../../../hooks/useApiRefresh";
import {
  useLazyGetLoginDetailsQuery,
  type LoginLog,
} from "../api/userMgmtDataApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Generate a deterministic hue from a string (for avatar colors) */
function getAvatarHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function formatDate(dt: string): string {
  if (!dt) return "—";
  const d = new Date(dt.replace(" ", "T"));
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function calcDurationSeconds(loginTime: string, logoutTime: string): number {
  const a = new Date(loginTime.replace(" ", "T"));
  const b = new Date(logoutTime.replace(" ", "T"));
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000));
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "< 1s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Return a color for session duration (short=green, medium=amber, long=blue) */
function getDurationColor(seconds: number): { bg: string; color: string } {
  if (seconds < 300) return { bg: "#e8f5e9", color: "#2e7d32" }; // <5m — green
  if (seconds < 3600) return { bg: "#fff8e1", color: "#f57f17" }; // <1h — amber
  return { bg: "#e3f2fd", color: "#1565c0" }; // ≥1h — blue
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportCSV(data: LoginLog[]) {
  const headers = [
    "ID",
    "Username",
    "UserID",
    "Login Time",
    "Logout Time",
    "Duration",
    "Status",
    "Token ID",
  ];
  const rows = data.map((r) => {
    const dur =
      r.logoutTime && r.status === "LOGOUT"
        ? formatDuration(calcDurationSeconds(r.loginTime, r.logoutTime))
        : "active";
    return [
      r.id,
      r.username,
      r.userId,
      r.loginTime,
      r.logoutTime || "",
      dur,
      r.status,
      r.tokenId,
    ]
      .map((v) => `"${v}"`)
      .join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `login-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: "LOGIN" | "LOGOUT" }> = ({ status }) => {
  const isActive = status === "LOGIN";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.2,
        py: 0.3,
        borderRadius: "20px",
        bgcolor: isActive ? alpha("#22c55e", 0.12) : alpha("#94a3b8", 0.12),
        border: `1px solid ${isActive ? alpha("#22c55e", 0.35) : alpha("#94a3b8", 0.3)}`,
      }}
    >
      {/* Pulse dot for active sessions */}
      {isActive && (
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "#22c55e",
            boxShadow: `0 0 0 2px ${alpha("#22c55e", 0.3)}`,
            animation: "pulse 1.8s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { boxShadow: `0 0 0 2px ${alpha("#22c55e", 0.3)}` },
              "50%": { boxShadow: `0 0 0 5px ${alpha("#22c55e", 0.08)}` },
            },
          }}
        />
      )}
      {!isActive && (
        <Box
          sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#94a3b8" }}
        />
      )}
      <Typography
        variant="caption"
        fontWeight={600}
        sx={{
          fontSize: 10.5,
          letterSpacing: "0.05em",
          color: isActive ? "#16a34a" : "#64748b",
        }}
      >
        {isActive ? "ACTIVE" : "LOGGED OUT"}
      </Typography>
    </Box>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accentColor: string;
  loading?: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const UserLogs: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000)
    .toISOString()
    .slice(0, 10);

  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";
  const { values, handleChange } = useOrgHierarchyState("userLogs");
  const { options } = useOrgHierarchyFilters(values);
  const subDomainId = values?.subDomain;

  const [startDate, setStartDate] = useState(threeDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [hasFetched, setHasFetched] = useState(false);
  const [triggerLoginDetails, { data: logs = [], isFetching: loading }] =
    useLazyGetLoginDetailsQuery();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LOGIN" | "LOGOUT">(
    "ALL",
  );

  const handleFetchData = async () => {
    if (subDomainId == null) return;
    try {
      const targetOlmId = loggedUser?.olmId || "";
      await triggerLoginDetails({
        startDate,
        endDate,
        subDomainId: Number(subDomainId),
        page: 0,
        size: 200,
        olmId: targetOlmId,
      }).unwrap();
      setHasFetched(true);
      setPage(0);
    } catch (err) {
      console.error("Failed to fetch logs: ", err);
    }
  };

  // Re-runs the same lazy query the Fetch button triggers, with whatever scope
  // and date range is on screen - this list is a live audit trail, so a reload
  // is the point rather than a cache-invalidation nicety.
  const { refresh, isRefreshing } = useApiRefresh({
    onRefresh: () => void handleFetchData(),
    isFetching: loading,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter((l) => {
      const matchesSearch =
        !q ||
        l.username.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.tokenId.toLowerCase().includes(q) ||
        String(l.id).includes(q) ||
        String(l.userId).includes(q);
      const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, search, statusFilter]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  const metrics = useMemo(() => {
    const total = logs.length;
    const active = logs.filter((l) => l.status === "LOGIN").length;
    const logoutCount = logs.filter((l) => l.status === "LOGOUT").length;
    const durations = logs
      .filter((l) => l.status === "LOGOUT" && l.logoutTime)
      .map((l) => calcDurationSeconds(l.loginTime, l.logoutTime));
    const avgSec =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    return {
      total,
      active,
      logoutCount,
      avgDuration: avgSec > 0 ? formatDuration(avgSec) : "—",
    };
  }, [logs]);

  return (
    <Box>
      {/* ── Filters ── */}
      <Box sx={{ borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <OrgHierarchyFilters
              role={roleName}
              values={values}
              options={options}
              onChange={handleChange}
              onRefresh={refresh}
              isRefreshing={isRefreshing}
              refreshDisabled={subDomainId == null}
              refreshTooltip={
                subDomainId != null ? "Reload login logs" : "Pick a Sub Domain first"
              }
            />
          </Box>

          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: endDate }}
            sx={{ width: { xs: "100%", md: 160 } }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: startDate }}
            sx={{ width: { xs: "100%", md: 160 } }}
          />

          <Tooltip
            title={
              subDomainId == null
                ? "Please select a Sub Domain from the hierarchy first"
                : ""
            }
            placement="top"
          >
            <span>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFetchData}
                disabled={loading || subDomainId == null}
                startIcon={<FilterListIcon />}
                sx={{ height: 40, whiteSpace: "nowrap" }}
              >
                Apply Filters
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Metric Cards ── */}
      {/* {hasFetched && (
        <Grid container spacing={2} mt={0.5} mb={2}>
          {[
            {
              label: "Total Sessions",
              value: metrics.total,
              sub: "in selected range",
              icon: <PeopleIcon />,
              accentColor: "#6366f1",
            },
            {
              label: "Active Sessions",
              value: metrics.active,
              sub: "currently logged in",
              icon: <ActiveIcon />,
              accentColor: "#22c55e",
            },
            {
              label: "Completed",
              value: metrics.logoutCount,
              sub: "logged out",
              icon: <InactiveIcon />,
              accentColor: "#64748b",
            },
            {
              label: "Avg. Duration",
              value: metrics.avgDuration,
              sub: "per session",
              icon: <AvTimerIcon />,
              accentColor: "#f59e0b",
            },
          ].map((m) => (
            <Grid 
            // item xs={6} sm={3} 
            size={{ xs: 6, sm: 3 }}
            key={m.label}>
              <MetricCard {...m} loading={loading} />
            </Grid>
          ))}
        </Grid>
      )} */}

      {/* ── Log Table ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          mt: hasFetched ? 0 : 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Loading bar */}
        {loading && <LinearProgress sx={{ height: 2 }} />}

        {/* Toolbar */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            // background:
            //   "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,0.4) 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.primary"
              >
                Login Sessions
              </Typography>
              {hasFetched && !loading && (
                <Chip
                  label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    bgcolor: alpha("#6366f1", 0.1),
                    color: "#6366f1",
                    fontWeight: 600,
                    fontSize: 10,
                  }}
                />
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              {/* Quick status filter pills */}
              {hasFetched && (
                <Stack direction="row" spacing={0.5}>
                  {(["ALL", "LOGIN", "LOGOUT"] as const).map((s) => (
                    <Box
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(0);
                      }}
                      sx={{
                        px: 1.5,
                        py: 0.4,
                        borderRadius: "20px",
                        cursor: "pointer",
                        border: "1px solid",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        transition: "all 0.15s",
                        borderColor:
                          statusFilter === s
                            ? s === "LOGIN"
                              ? "#22c55e"
                              : s === "LOGOUT"
                                ? "#94a3b8"
                                : "#6366f1"
                            : "divider",
                        bgcolor:
                          statusFilter === s
                            ? s === "LOGIN"
                              ? alpha("#22c55e", 0.1)
                              : s === "LOGOUT"
                                ? alpha("#94a3b8", 0.1)
                                : alpha("#6366f1", 0.1)
                            : "transparent",
                        color:
                          statusFilter === s
                            ? s === "LOGIN"
                              ? "#16a34a"
                              : s === "LOGOUT"
                                ? "#475569"
                                : "#4f46e5"
                            : "text.secondary",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                    >
                      {s === "ALL"
                        ? `All (${logs.length})`
                        : s === "LOGIN"
                          ? `Active (${metrics.active})`
                          : `Ended (${metrics.logoutCount})`}
                    </Box>
                  ))}
                </Stack>
              )}

              <TextField
                placeholder="Search users, IDs…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                size="small"
                sx={{ width: 200 }}
                disabled={!hasFetched}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "text.disabled" }}
                      />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, fontSize: 13 },
                }}
              />

              <Tooltip title="Export CSV">
                <span>
                  <IconButton
                    size="small"
                    disabled={filtered.length === 0 || loading || !hasFetched}
                    onClick={() => exportCSV(filtered)}
                    sx={{
                      bgcolor: alpha("#6366f1", 0.08),
                      color: "#6366f1",
                      "&:hover": { bgcolor: alpha("#6366f1", 0.16) },
                      "&.Mui-disabled": { opacity: 0.4 },
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Table */}
        <TableContainer sx={{height: "calc(100vh - 270px)"}}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ borderBottom: "2px solid", borderColor: "divider" }}>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: "#f8fafc",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: 10.5,
                    letterSpacing: "0.07em",
                    py: 1.2,
                  },
                }}
              >
                <TableCell>USER</TableCell>
                <TableCell>LOGIN TIME</TableCell>
                <TableCell>LOGOUT TIME</TableCell>
                <TableCell>DURATION</TableCell>
                <TableCell>STATUS</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Skeleton */}
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton
                          variant="text"
                          height={28}
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {/* Empty pre-fetch */}
              {!loading && !hasFetched && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 8, border: 0 }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          bgcolor: alpha("#6366f1", 0.08),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 0.5,
                        }}
                      >
                        <FilterListIcon
                          sx={{ color: "#6366f1", fontSize: 22 }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                      >
                        No data yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Select Org Hierarchy and date range, then click "Apply
                        Filters"
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}

              {/* Empty post-fetch */}
              {!loading && hasFetched && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 8, border: 0 }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.secondary"
                      >
                        No sessions match your filters
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Try changing the date range or clearing your search
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {!loading &&
                hasFetched &&
                paginated.map((row, idx) => {
                  const isActive = row.status === "LOGIN";
                  const durationSec =
                    !isActive && row.logoutTime
                      ? calcDurationSeconds(row.loginTime, row.logoutTime)
                      : null;
                  const durColor =
                    durationSec !== null ? getDurationColor(durationSec) : null;
                  const hue = getAvatarHue(row.username);

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        "&:last-child td": { border: 0 },
                        bgcolor: isActive
                          ? alpha("#22c55e", 0.025)
                          : "transparent",
                        borderLeft: isActive
                          ? `3px solid ${alpha("#22c55e", 0.5)}`
                          : "3px solid transparent",
                        transition: "background 0.15s",
                        "&:hover": {
                          bgcolor: isActive
                            ? alpha("#22c55e", 0.05)
                            : alpha("#6366f1", 0.03),
                        },
                        "& td": {
                          py: 1.2,
                          borderBottom: "1px solid",
                          borderColor: alpha("#e2e8f0", 0.8),
                        },
                      }}
                    >
                      {/* User */}
                      <TableCell sx={{ pl: isActive ? 1.5 : 2 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.2}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 11,
                              fontWeight: 700,
                            //   background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), hsl(${(hue + 40) % 360}, 65%, 45%))`,
                              color: "#fff",
                              boxShadow: `0 2px 6px hsl(${hue}, 60%, 50%, 0.35)`,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(row.username)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              lineHeight={1.2}
                              color="text.primary"
                            >
                              {row.username}
                            </Typography>
                            {/* <Typography
                              variant="caption"
                              color="text.disabled"
                              fontFamily="'Fira Code', monospace"
                              sx={{ fontSize: 10 }}
                            >
                              uid:{row.userId}
                            </Typography> */}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Login time */}
                      <TableCell>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.7}
                        >
                          <Box
                            sx={{
                              p: 0.4,
                              borderRadius: 1,
                              bgcolor: alpha("#22c55e", 0.1),
                              display: "flex",
                            }}
                          >
                            <LoginIcon
                              sx={{ fontSize: 11, color: "#16a34a" }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            fontFamily="'Fira Code', monospace"
                            color="text.primary"
                            sx={{ fontSize: 11 }}
                          >
                            {formatDate(row.loginTime)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Logout time */}
                      <TableCell>
                        {row.logoutTime ? (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.7}
                          >
                            <Box
                              sx={{
                                p: 0.4,
                                borderRadius: 1,
                                bgcolor: alpha("#94a3b8", 0.1),
                                display: "flex",
                              }}
                            >
                              <LogoutIcon
                                sx={{ fontSize: 11, color: "#64748b" }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              fontFamily="'Fira Code', monospace"
                              color="text.secondary"
                              sx={{ fontSize: 11 }}
                            >
                              {formatDate(row.logoutTime)}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Duration */}
                      <TableCell>
                        {durationSec !== null && durColor ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1,
                              py: 0.3,
                              borderRadius: 1.5,
                              bgcolor: durColor.bg,
                              border: `1px solid ${alpha(durColor.color, 0.2)}`,
                            }}
                          >
                            <AccessTimeIcon
                              sx={{ fontSize: 11, color: durColor.color }}
                            />
                            <Typography
                              variant="caption"
                              fontFamily="'Fira Code', monospace"
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: durColor.color,
                              }}
                            >
                              {formatDuration(durationSec)}
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1,
                              py: 0.3,
                              borderRadius: 1.5,
                              bgcolor: alpha("#22c55e", 0.08),
                            }}
                          >
                            <Box
                              sx={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                bgcolor: "#22c55e",
                                animation: "ping 1.5s ease-in-out infinite",
                                "@keyframes ping": {
                                  "0%, 100%": {
                                    opacity: 1,
                                    transform: "scale(1)",
                                  },
                                  "50%": {
                                    opacity: 0.5,
                                    transform: "scale(1.4)",
                                  },
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: "#16a34a",
                              }}
                            >
                              ongoing
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {!loading && hasFetched && filtered.length > 0 && (
          <>
            <Divider />
            <Box sx={{ bgcolor: "#f8fafc" }}>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Rows:"
                sx={{
                  px: 1,
                  "& .MuiTablePagination-toolbar": { minHeight: 44 },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    {
                      fontSize: 12,
                      color: "text.secondary",
                    },
                }}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default UserLogs;
