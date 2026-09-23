import {
  Box,
  Button,
  MenuItem,
  Paper,
  Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import AddIcon from "@mui/icons-material/Add";
import { useMemo, useState } from "react";
import {
  useGetAssignMatrixQuery,
  useGetAssignRulesQuery,
  useGetServiceRulesQuery,
} from "../../api/cabManagerApiSlice";
import {
  APPROVAL_AUTHORITIES,
  APPROVERS,
  ASSIGN_DOMAINS,
  ASSIGN_STAGES,
  SERVICE_CIRCLES,
  SERVICE_TYPES,
} from "../../data/cabManager.mock";
import type { ServiceApprovalRule } from "../../types/types";
import { AddServiceRuleModal } from "../../components/modals/AddServiceRuleModal";

export function AdminAssignMatrixTab() {
  const matrix      = useGetAssignMatrixQuery();
  const rules       = useGetAssignRulesQuery();
  const [addServiceOpen, setAddServiceOpen] = useState(false);

  // Server-side paging: pageIndex is 0-based both here and in Spring's Pageable,
  // so it goes over the wire as-is.
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const serviceRules = useGetServiceRulesQuery({
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });
  const serviceRuleRows = serviceRules.data?.content ?? [];
  const serviceRuleTotal = serviceRules.data?.totalElements ?? 0;

  const matrixByStage = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    matrix.data?.forEach((c) => { (map[c.stage] ??= {})[c.domain] = c.approver; });
    return map;
  }, [matrix.data]);

  const serviceRuleColumns = useMemo<MRT_ColumnDef<ServiceApprovalRule>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Rule",
        size: 90,
        Cell: ({ row }) => (
          <Typography sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontSize: 12.5 }}>
            {row.original.id}
          </Typography>
        ),
      },
      { accessorKey: "service", header: "Service Type", size: 160 },
      { accessorKey: "circle", header: "Circle", size: 100 },
      { accessorKey: "l1", header: "L1", size: 130, muiTableHeadCellProps: { sx: { color: "#2E7D32" } } },
      { accessorKey: "l2", header: "L2", size: 130, muiTableHeadCellProps: { sx: { color: "#ED6C02" } } },
      { accessorKey: "l3", header: "L3", size: 130, muiTableHeadCellProps: { sx: { color: "#C62828" } } },
      {
        accessorKey: "active",
        header: "Active",
        size: 90,
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => (row.original.active ? "Yes" : "No"),
      },
    ],
    []
  );

  const serviceRuleTable = useAppTable({
    columns: serviceRuleColumns,
    data: serviceRuleRows,
    getRowId: (row) => row.id,
    state: {
      isLoading: serviceRules.isLoading,
      showProgressBars: serviceRules.isFetching && !serviceRules.isLoading,
      pagination,
    },
    initialState: { density: "compact" },
    manualPagination: true,
    rowCount: serviceRuleTotal,
    onPaginationChange: setPagination,
    appTable: { emptyTitle: "No service approval rules configured" },
    enableTopToolbar: false,
    enableBottomToolbar: true,
    enableSorting: false,
    muiTableContainerProps: { sx: { maxHeight: "calc(100vh - 420px)", minHeight: 240 } },
    muiTableBodyRowProps: ({ row }) => ({ sx: { opacity: row.original.active ? 1 : 0.6 } }),
  });

  return (
    <Box>
      <Box sx={{ maxWidth: 620, mb: 2 }}>
        <Typography sx={{ fontWeight: 500, fontSize: 16 }}>Approval Assignment Matrix</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Define who approves each CRQ by approval stage and domain. Exception rules below override
          this matrix for specific circle and impact combinations.
        </Typography>
      </Box>

      {/* Stage × Domain matrix */}
      {/* <Paper sx={{ mb: 4, border: "1px solid", borderColor: "divider", overflow: "auto" }} elevation={0}>
        {matrix.isLoading ? (
          <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={240} /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                <TableCell>Approval Stage</TableCell>
                {ASSIGN_DOMAINS.map((d) => <TableCell key={d}>{d}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {ASSIGN_STAGES.map((s) => (
                <TableRow key={s}>
                  <TableCell sx={{ fontWeight: 500 }}>{s}</TableCell>
                  {ASSIGN_DOMAINS.map((d) => (
                    <TableCell key={d}>
                      <TextField select size="small" value={matrixByStage[s]?.[d] ?? ""} fullWidth>
                        {APPROVERS.map((a) => (
                          <MenuItem key={a.name} value={a.name}>{a.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper> */}

      {/* Exception rules */}
      {/* <Paper sx={{ mb: 4, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontWeight: 500 }}>Exception Rules <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>— {rules.data?.filter((r) => r.active).length ?? 0} active</Typography></Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Override the matrix for specific circle &amp; impact combinations.</Typography>
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon />}>Add rule</Button>
        </Box>
        {rules.isLoading ? (
          <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={180} /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                <TableCell>Rule</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Circle</TableCell>
                <TableCell>Impact</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Approver</TableCell>
                <TableCell align="center">Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.data?.map((r) => (
                <TableRow key={r.id} sx={{ opacity: r.active ? 1 : 0.6 }}>
                  <TableCell sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main" }}>{r.id}</TableCell>
                  <TableCell>{r.domain}</TableCell>
                  <TableCell>{r.circle}</TableCell>
                  <TableCell>{r.impact}</TableCell>
                  <TableCell>{r.stage}</TableCell>
                  <TableCell>{r.approver}</TableCell>
                  <TableCell align="center">{r.active ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper> */}

      {/* Impacted-party (L1/L2/L3) rules */}
      <Paper sx={{ border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            {/* Count is the server total, not an active-only tally — with the list
                server-paged we only ever hold one page here, so filtering client
                side would report "active on this page" and drift as you page. */}
            <Typography sx={{ fontWeight: 500 }}>Impacted Party Approval Flow <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>— {serviceRuleTotal} rules</Typography></Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>L1 is the primary impacted-party approver; L2/L3 are escalation tiers.</Typography>
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAddServiceOpen(true)}>
            Add service Approval
          </Button>
        </Box>
        <MaterialReactTable table={serviceRuleTable} />
      </Paper>

      <AddServiceRuleModal
        open={addServiceOpen}
        onClose={() => setAddServiceOpen(false)}
        onSuccess={() => {
          setAddServiceOpen(false);
          // Back to the first page — a new rule can land on any page once the
          // list is server-paged, and refetch alone would leave you looking at
          // a stale offset.
          setPagination((p) => ({ ...p, pageIndex: 0 }));
          serviceRules.refetch();
        }}
      />
    </Box>
  );
}
