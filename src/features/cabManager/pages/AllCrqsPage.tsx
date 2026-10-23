import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  SvgIcon,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { alpha } from "@mui/material/styles";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  useGetAllCrqsQuery,
  useGetCabServicesQuery,
  useGetCircleDropdownQuery,
} from "../api/cabManagerApiSlice";
import { AllCrqDetailDrawer } from "../components/shared/AllCrqDetailDrawer";
// import { NewCrqModal } from "../components/modals/NewCrqModal";
import { ImpactChip, StatusChip, getStageLabel } from "../components/shared/Chips";
import { errMsg } from "../components/shared/errMsg";
import { ExportExcelButton } from "../components/shared/ExportExcelButton";
import { exportRowsToExcel, type ExcelColumn } from "../../crqAnalytics/utils/excelExport";
import type {
  Circle, Crq, CrqFilters, CrqServiceApprovalStatusFilter, Domain, ImpactCode,
} from "../types/types";

const ALL_CRQS_EXPORT_COLUMNS: ExcelColumn[] = [
  { header: "CRQ No", key: "crqNo", width: 20 },
  { header: "Domain", key: "domainName", width: 16 },
  { header: "Circle", key: "circleCode", width: 12 },
  { header: "Stage", key: "currentStage", width: 22 },
  { header: "Stage Status", key: "stageStatus", width: 18 },
  { header: "Service", key: "serviceCode", width: 18 },
  { header: "Impact", key: "changeImpact", width: 10 },
  { header: "Approval Status", key: "serviceApprovalStatus", width: 18 },
];



const DOMAINS: Domain[] = ["IP Core", "Optics", "Packet", "Embedded", "Mobility"];

// Status buckets resolved by sp_get_cab_crqs:
//   PENDING    -> PENDING
//   COMPLETED  -> APPROVED + REJECTED
//   RESCHEDULE -> RESCHEDULE / RESCHEDULED
const STATUS_FILTERS: {
  label: string;
  value: CrqServiceApprovalStatusFilter;
  icon: typeof SvgIcon;
  tone: "warning" | "success" | "info";
}[] = [
  { label: "Pending", value: "PENDING", icon: HourglassTopRoundedIcon, tone: "warning" },
  { label: "Completed", value: "COMPLETED", icon: TaskAltRoundedIcon, tone: "success" },
  { label: "Reschedule", value: "RESCHEDULE", icon: EventRepeatRoundedIcon, tone: "info" },
];

const DEFAULT_FILTERS: CrqFilters = {
  serviceApprovalStatus: "PENDING",
  domain: "All Domains",
  circle: "All Circles",
  impact: "All Impact",
  serviceCode: "All Services",
  search: "All Search",
};

export function AllCrqsPage() {

  const { data: services } = useGetCabServicesQuery();
  // Same source as the Admin "Add Service Approval" circle dropdown:
  // GET /cab/admin/circledropdown.
  const { data: circles } = useGetCircleDropdownQuery();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [filters, setFilters] = useState<CrqFilters>(DEFAULT_FILTERS);
  // const [selected, setSelected] = useState<string | null>(null);

  const [selected, setSelected] = useState<{
  serviceApprovalId: number;
  crqNo: string;
} | null>(null);

  // const [openNew, setOpenNew] = useState(false);

  const { data, isFetching, isError, error, refetch } = useGetAllCrqsQuery(filters);
  // const { data: services } = useGetCabServicesQuery();
  // const serviceNameByCode = useMemo(
  //   () => new Map((services ?? []).map((s) => [s.serviceCode, s.serviceName])),
  //   [services],
  // );

  const setF = <K extends keyof CrqFilters>(k: K, v: CrqFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const searchTerm = filters.search && filters.search !== "All Search" ? filters.search : "";

  // The rows-per-page ladder that used to be built here — the standard
  // sizes plus the real row count — is now what every table in the app
  // gets from useAppTable.

  const hasActiveFilters = useMemo(
    () =>
      (Object.keys(DEFAULT_FILTERS) as (keyof CrqFilters)[]).some(
        (k) => filters[k] !== DEFAULT_FILTERS[k]
      ),
    [filters]
  );

  const columns = useMemo<MRT_ColumnDef<Crq>[]>(
    () => [
      {
        accessorKey: "crqNo",
        header: "CRQ No",
        size: 130,
        Cell: ({ row }) => (
          <Box>
            <Typography sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12.5, color: "primary.main", fontWeight: 500 }}>
              {row.original.crqNo}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "domainName",
        header: "Domain",
        size: 150,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2">{row.original.domainName}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Circle {row.original.circleCode}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "currentStage",
        header: "Stage",
        size: 150,
        Cell: ({ row }) => (
          <Typography variant="body2">
             {getStageLabel(row.original.currentStage)}
          </Typography>
        ),
      },
      {
        accessorKey: "stageStatus",
        header: "Stage Status",
        size: 160,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            color="warning"
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: "serviceCode",
        header: "Service",
        size: 150,
        Cell: ({ row }) => (
          <Typography variant="body2">
            {/* {serviceNameByCode.get(row.original.serviceCode) ?? row.original.serviceCode} */}
             {row.original.serviceCode}
          </Typography>
        ),
      },
      {
        accessorKey: "changeImpact",
        header: "Impact",
        size: 110,
        Cell: ({ cell }) => {
          const impact = cell.getValue<ImpactCode | undefined>();
          return impact ? (
            <ImpactChip impact={impact} />
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>—</Typography>
          );
        },
      },
      {
        accessorKey: "serviceApprovalStatus",
        header: "Approval Status",
        size: 170,
        Cell: ({ cell }) => (
          <StatusChip status={cell.getValue<string>()} />
        ),
      }

    ],
    [navigate],
  );

  const table = useAppTable({
    columns,
    data: data ?? [],
    state: { isLoading: isFetching },
    // Sits inside the page's own bordered Paper, so the table does not draw
    // a second frame of its own. Height comes from the shared fit.
    appTable: { frame: false },
    initialState: { density: "compact" },
    enableTopToolbar: false,
    muiTableBodyRowProps: ({ row }) => ({
      hover: true,
      onClick: () =>
        setSelected({
          serviceApprovalId: row.original.serviceApprovalId,
          crqNo: row.original.crqNo,
        }),
      sx: {
        cursor: "pointer",
        "&:hover td": {
          backgroundColor: alpha(
            theme.palette.primary.main,
            isDark ? 0.08 : 0.04
          ),
        },
        transition: "background-color 100ms ease",
      },
    }),
  });

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={3} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 500, letterSpacing: "-0.3px" }}>All CRQs</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Track every change request across domains, circles, and approval status.
          </Typography>
        </Box>
      </Stack>

      <Paper sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }} elevation={0}>
        {/* Filter bar */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center" }}>
          <TextField select size="small" label="Domain" value={filters.domain ?? "All Domains"} onChange={(e) => setF("domain", e.target.value as Domain)} sx={{ minWidth: 130 }}>
            <MenuItem value="All Domains">All Domains</MenuItem>
            {DOMAINS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Circle" value={filters.circle ?? "All Circles"} onChange={(e) => setF("circle", e.target.value as Circle)} sx={{ minWidth: 115 }}>
            <MenuItem value="All Circles">All Circles</MenuItem>
            {(circles ?? []).map((c) => (
              <MenuItem key={c.circleCode} value={c.circleCode}>{c.circleCode}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Impact" value={filters.impact ?? "All Impact"} onChange={(e) => setF("impact", e.target.value as ImpactCode)} sx={{ minWidth: 115 }}>
            <MenuItem value="All Impact">All Impact</MenuItem>
            <MenuItem value="SA">SA — Service Affecting</MenuItem>
            <MenuItem value="NSA">NSA — Non Service Affecting</MenuItem>
          </TextField>
          <TextField select size="small" label="Service" value={filters.serviceCode ?? "All Services"} onChange={(e) => setF("serviceCode", e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="All Services">All Services</MenuItem>
            {(services ?? []).map((s) => (
              <MenuItem key={s.serviceCode} value={s.serviceCode}>{s.serviceCode}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Approval Service Status"
            value={filters.serviceApprovalStatus ?? "PENDING"}
            onChange={(e) => setF("serviceApprovalStatus", e.target.value as CrqServiceApprovalStatusFilter)}
            sx={{ minWidth: 175 }}
            SelectProps={{
              renderValue: (v) => {
                const s = STATUS_FILTERS.find((o) => o.value === v) ?? STATUS_FILTERS[0];
                const Icon = s.icon;
                return (
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Icon sx={{ fontSize: 16, color: `${s.tone}.main` }} />
                    <span>{s.label}</span>
                  </Stack>
                );
              },
            }}
          >
            {STATUS_FILTERS.map((s) => {
              const Icon = s.icon;
              return (
                <MenuItem key={s.value} value={s.value}>
                  <Icon sx={{ fontSize: 16, color: `${s.tone}.main`, mr: 1 }} />
                  {s.label}
                </MenuItem>
              );
            })}
          </TextField>
          <TextField
            size="small"
            placeholder="Search CRQ …"
            value={searchTerm}
            onChange={(e) => setF("search", e.target.value.trim() ? e.target.value : "All Search")}
            aria-label="Search CRQs"
            sx={{
              // Small base width so the bar stays on the filter row at 125% scaling;
              // it still grows into any spare space on wider screens.
              flex: "1 1 140px",
              minWidth: 140,
              maxWidth: 280,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: isDark ? alpha(theme.palette.common.white, 0.03) : theme.palette.grey[50],
                transition: "background-color 120ms ease, box-shadow 120ms ease",
                "&:hover": {
                  backgroundColor: isDark ? alpha(theme.palette.common.white, 0.05) : theme.palette.grey[100],
                },
                "&.Mui-focused": {
                  backgroundColor: isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.common.white,
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="Clear search"
                    onClick={() => setF("search", "All Search")}
                    edge="end"
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          {hasActiveFilters && (
            <Button size="small" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear</Button>
          )}
          <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
            <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>{data?.length ?? 0}</Box> of {data?.length ?? 0} CRQs
          </Typography>
          {/* Exports the filtered result set (all pages), with stage labels as shown. */}
          <ExportExcelButton
            onExport={() =>
              exportRowsToExcel(
                table.getPrePaginationRowModel().rows.map((r) => ({
                  ...r.original,
                  currentStage: getStageLabel(r.original.currentStage),
                })),
                ALL_CRQS_EXPORT_COLUMNS,
                "All CRQs",
                "All_CRQs",
              )
            }
            disabled={isFetching || !data?.length}
          />
        </Box>

        {/* Errors */}
        {isError && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => void refetch()}>Retry</Button>}
          >
            {errMsg(error)}
          </Alert>
        )}

        {/* Table */}
        <MaterialReactTable table={table} />
      </Paper>

      {/* <AllCrqDetailDrawer crqId={selected} onClose={() => setSelected(null)} /> */}

      <AllCrqDetailDrawer
        serviceApprovalId={selected?.serviceApprovalId ?? null}
        crqNo={selected?.crqNo ?? null}
        onClose={() => setSelected(null)}
      />

      {/* <NewCrqModal open={openNew} onClose={() => setOpenNew(false)} /> */}
    </Box>
  );
}










// import {
//   Alert,
//   Box,
//   Button,
//   Chip,
//   MenuItem,
//   Paper,
//   Stack,
//   TextField,
//   Typography,
//   useTheme,
// } from "@mui/material";
// import { alpha } from "@mui/material/styles";
// import {
//   MaterialReactTable,
//   //   type MRT_ColumnDef,
// } from "material-react-table";
// import { useMemo, useState } from "react";
// import { useNavigate } from "react-router";
// import { useGetAllCrqsQuery } from "../api/cabManagerApiSlice";
// import { AllCrqDetailDrawer } from "../components/shared/AllCrqDetailDrawer";
// // import { NewCrqModal } from "../components/modals/NewCrqModal";
// import { SlaBar, StageChip, StatusChip } from "../components/shared/Chips";
// import { errMsg } from "../components/shared/errMsg";
// import { ASSIGN_CIRCLES, STAGES } from "../data/cabManager.mock";
// import type {
//   Circle, Crq, CrqFilters, CrqStage, Domain, ImpactCode,
// } from "../types/types";

// const DOMAINS: Domain[] = ["IP Core", "Optics", "Packet", "Embedded", "Mobility"];

// const STAGE_FILTERS: { label: string; value: CrqStage | "All Stages" }[] = [
//   { label: "All Stages", value: "All Stages" },
//   ...STAGES.map((s) => ({ label: s, value: s as CrqStage })),
// ];

// const DEFAULT_FILTERS: CrqFilters = {
//   stage: "All Stages",
//   domain: "All Domains",
//   circle: "All Circles",
//   impact: "All Impact",
//   status: "All Status",
//   search: "All Search",
// };

// export function AllCrqsPage() {
//   const navigate = useNavigate();
//   const theme = useTheme();
//   const isDark = theme.palette.mode === "dark";
//   const [filters, setFilters] = useState<CrqFilters>(DEFAULT_FILTERS);
//   // const [selected, setSelected] = useState<string | null>(null);

//   const [selected, setSelected] = useState<{
//   serviceApprovalId: number;
//   crqNo: string;
// } | null>(null);

//   // const [openNew, setOpenNew] = useState(false);

//   const { data, isLoading, isError, error, refetch } = useGetAllCrqsQuery(filters);

//   const setF = <K extends keyof CrqFilters>(k: K, v: CrqFilters[K]) =>
//     setFilters((f) => ({ ...f, [k]: v }));

//   const hasActiveFilters = useMemo(
//     () =>
//       (Object.keys(DEFAULT_FILTERS) as (keyof CrqFilters)[]).some(
//         (k) => filters[k] !== DEFAULT_FILTERS[k]
//       ),
//     [filters]
//   );

//   const columns = useMemo<MRT_ColumnDef<Crq>[]>(
//     () => [
//       {
//         accessorKey: "crqNo",
//         header: "CRQ ID",
//         size: 130,
//         Cell: ({ row }) => (
//           <Box>
//             <Typography sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12.5, color: "primary.main", fontWeight: 500 }}>
//               {row.original.crqNo}
//             </Typography>
//           </Box>
//         ),
//       },
//       {
//         accessorKey: "domainName",
//         header: "Domain",
//         size: 150,
//         Cell: ({ row }) => (
//           <Box>
//             <Typography variant="body2">{row.original.domainName}</Typography>
//             <Typography variant="caption" sx={{ color: "text.secondary" }}>
//               Circle {row.original.circleCode}
//             </Typography>
//           </Box>
//         ),
//       },
//       {
//         accessorKey: "currentStage",
//         header: "Stage",
//         size: 130,
//         filterVariant: "select",
//         filterSelectOptions: [...STAGES],
//         Cell: ({ cell }) => <StageChip stage={cell.getValue<CrqStage>()} />,
//       },
//       {
//         accessorKey: "slaPercentage",
//         header: "SLA",
//         size: 130,
//         Cell: ({ cell }) => <SlaBar sla={cell.getValue<number>()} />,
//       },
//       {
//         accessorKey: "approverName",
//         header: "Approver",
//         size: 130,
//       },
//       {
//         accessorKey: "assignStartTime",
//         header: "Scheduled",
//         size: 120,
//         Cell: ({ row }) => (
//           <Typography variant="body2">{row.original.assignStartTime}</Typography>
//         ),
//       },
//       {
//         accessorKey: "currentStatus",
//         header: "Status",
//         size: 130,
//         Cell: ({ cell }) => <StatusChip status={cell.getValue<Crq["currentStatus"]>()} />,
//       },
//     ],
//     [navigate],
//   );

//   const table = useAppTable({
//     columns,
//     data: data ?? [],
//     state: { isLoading },
//     initialState: { density: "compact", pagination: { pageSize: 10, pageIndex: 0 } },
//     enableTopToolbar: false,
//     enableStickyHeader: true,
//     paginationDisplayMode: "pages",
//     muiTablePaperProps: { elevation: 0, sx: { boxShadow: "none" } },
//     muiTableContainerProps: { sx: { maxHeight: "calc(100vh - 420px)", minHeight: 240 } },
//     muiTableHeadCellProps: {
//       sx: {
//         fontSize: 10,
//         fontWeight: 700,
//         letterSpacing: "0.07em",
//         textTransform: "uppercase",
//         color: "text.secondary",
//         py: 0.75,
//         backgroundColor: isDark ? alpha(theme.palette.primary.main, 0.12) : theme.palette.grey[50],
//         borderBottom: `1px solid ${theme.palette.divider}`,
//       },
//     },
//     muiTableBodyCellProps: { sx: { py: 1, fontSize: 12.5 } },
//     muiTableBodyRowProps: ({ row }) => ({
//       hover: true,
//       onClick: () => setSelected(row.original.crqNo),
//       sx: {
//         cursor: "pointer",
//         "&:hover td": { backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04) },
//         transition: "background-color 100ms ease",
//       },
//     }),
//     muiBottomToolbarProps: {
//       sx: {
//         borderTop: `1px solid ${theme.palette.divider}`,
//         backgroundColor: isDark ? "rgba(255,255,255,0.02)" : theme.palette.grey[50],
//         px: 1,
//       },
//     },
//     muiPaginationProps: {
//       shape: "rounded",
//       size: "small",
//       sx: { "& .MuiButtonBase-root": { fontSize: 12 } },
//     },
//   });

//   return (
//     <Box>
//       {/* Header */}
//       <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={3} sx={{ mb: 3 }}>
//         <Box>
//           <Typography variant="h4" sx={{ fontWeight: 500, letterSpacing: "-0.3px" }}>All CRQs</Typography>
//           <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
//             Track every change request across domains, circles, and stages of the approval workflow.
//           </Typography>
//         </Box>
//       </Stack>

//       <Paper sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }} elevation={0}>
//         {/* Filter bar */}
//         <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
//           <Stack direction="row" spacing={0.5}>
//             {STAGE_FILTERS.map((s) => {
//               const active = (filters.stage ?? "All Stages") === s.value;
//               return (
//                 <Chip
//                   key={s.value}
//                   label={s.label}
//                   size="small"
//                   onClick={() => setF("stage", s.value)}
//                   variant={active ? "filled" : "outlined"}
//                   color={active ? "primary" : "default"}
//                 />
//               );
//             })}
//           </Stack>
//           <Box sx={{ width: 1, height: 20, bgcolor: "divider", mx: 0.5 }} />
//           <TextField select size="small" label="Domain" value={filters.domain ?? "All Domains"} onChange={(e) => setF("domain", e.target.value as Domain)} sx={{ minWidth: 140 }}>
//             <MenuItem value="All Domains">All Domains</MenuItem>
//             {DOMAINS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
//           </TextField>
//           <TextField select size="small" label="Circle" value={filters.circle ?? "All Circles"} onChange={(e) => setF("circle", e.target.value as Circle)} sx={{ minWidth: 130 }}>
//             <MenuItem value="All Circles">All Circles</MenuItem>
//             {ASSIGN_CIRCLES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
//           </TextField>
//           <TextField select size="small" label="Impact" value={filters.impact ?? "All Impact"} onChange={(e) => setF("impact", e.target.value as ImpactCode)} sx={{ minWidth: 120 }}>
//             <MenuItem value="All Impact">All Impact</MenuItem>
//             <MenuItem value="SA">SA — Service Affecting</MenuItem>
//             <MenuItem value="NSA">NSA — Non Service Affecting</MenuItem>
//           </TextField>
//           <TextField select size="small" label="Status" value={filters.status ?? "All Status"} onChange={(e) => setF("status", e.target.value as CrqFilters["status"])} sx={{ minWidth: 140 }}>
//             <MenuItem value="All Status">All Status</MenuItem>
//             <MenuItem value="active">Active CRQs</MenuItem>
//             <MenuItem value="escalated">Escalated CRQs</MenuItem>
//             <MenuItem value="delegated">Delegated CRQs</MenuItem>
//             <MenuItem value="rejected">Rejected CRQs</MenuItem>
//           </TextField>
//           <TextField size="small" placeholder="Search CRQ, hostname, approver…" value={filters.search ?? "All Search"} onChange={(e) => setF("search", e.target.value)} sx={{ minWidth: 240, flex: 1 }} />
//           {hasActiveFilters && (
//             <Button size="small" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear</Button>
//           )}
//           <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
//             <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>{data?.length ?? 0}</Box> of {data?.length ?? 0} CRQs
//           </Typography>
//         </Box>

//         {/* Errors */}
//         {isError && (
//           <Alert
//             severity="error"
//             action={<Button color="inherit" size="small" onClick={() => void refetch()}>Retry</Button>}
//           >
//             {errMsg(error)}
//           </Alert>
//         )}

//         {/* Table */}
//         <MaterialReactTable table={table} />
//       </Paper>

//       <AllCrqDetailDrawer crqId={selected} onClose={() => setSelected(null)} />
//       {/* <NewCrqModal open={openNew} onClose={() => setOpenNew(false)} /> */}
//     </Box>
//   );
// }
