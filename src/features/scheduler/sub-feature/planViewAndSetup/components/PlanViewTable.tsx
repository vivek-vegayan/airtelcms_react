import React, { useMemo, useState } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../../../components/ui/AppTable";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";

import { useActivity } from "../hooks/useActivity";
import { useGetPlanViewQuery, type PlanViewRow } from "../api/planApiSlice";
import { useDownloadPlanActivityTemplate } from "../hooks/useDownloadPlanActivityTemplate";
import { PlanEditDialog, type FilterOption } from "./PlanEditDialog";
import { PlanAddDialog } from "./PlanAddDialog";
import { UploadPlanActivityDialog } from "./excelUpload/UploadPlanActivityDialog";

interface Props {
  verticalId?: number;
  functionId?: number;
  domainId?: number;
  subDomainId?: number;
  chmDomainOptions?: FilterOption[];
  chmSubDomainOptions?: FilterOption[];
  selectedChmDomain?: number;
  selectedChmSubDomain?: number;
}

// ── Badges ─────────────────────────────────────────────────────────────────

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "1px 7px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const STATUS_COLOR: Record<string, { fg: string; bg: string; dot: string }> = {
  Active: { fg: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  Inactive: { fg: "#374151", bg: "#f3f4f6", dot: "#9ca3af" },
  Draft: { fg: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
};

const StatusBadge: React.FC<{ value: string }> = ({ value }) => {
  const c = STATUS_COLOR[value] ?? {
    fg: "#374151",
    bg: "#f3f4f6",
    dot: "#9ca3af",
  };
  return (
    <span style={{ ...badge, color: c.fg, backgroundColor: c.bg, gap: 5 }}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: c.dot,
          flexShrink: 0,
        }}
      />
      {value || "—"}
    </span>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────

export const PlanViewTable: React.FC<Props> = ({
  verticalId,
  functionId,
  domainId,
  subDomainId,
  chmDomainOptions = [],
  chmSubDomainOptions = [],
  selectedChmDomain,
  selectedChmSubDomain,
}) => {
  const { handleOpenPlanDialog } = useActivity();
  const [addPlanDialogOpen, setAddPlanDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { download: downloadTemplate, isDownloading: isDownloadingTemplate } = useDownloadPlanActivityTemplate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // State for the Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<PlanViewRow | null>(
    null,
  );

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetPlanViewQuery(
    {
      verticalId,
      functionId,
      domainId,
      subDomainId,
      page: pagination.pageIndex,
      size: pagination.pageSize,
    },
    {
      skip: subDomainId === undefined,
    },
  );

  const apiRows = data?.content ?? [];

  const handleOpenEdit = (rowData: PlanViewRow) => {
    setSelectedRowData(rowData);
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedRowData(null);
  };

  const handleAddPlanSuccess = () => {
    refetch();
  };

  const handleOpenAddPlanDialog = () => setAddPlanDialogOpen(true);
  const handleCloseAddPlanDialog = () => setAddPlanDialogOpen(false);

  const handleOpenUploadDialog = () => setUploadDialogOpen(true);
  const handleCloseUploadDialog = () => setUploadDialogOpen(false);
  const handleUploadSuccess = () => refetch();

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch {
      // download error surfaced via RTK Query state elsewhere
    }
  };


  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = useMemo<MRT_ColumnDef<PlanViewRow>[]>(
    () => [
      {
        accessorKey: "planType",
        header: "Plan Type",
        size: 180,
        Cell: ({ row }) => (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => handleOpenPlanDialog(row.original)}
          >
            {row.original.planType}
          </Typography>
        ),
      },
      {
        accessorKey: "networkDomain",
        header: "Network Domain",
        size: 100,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12 }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "layer",
        header: "Layer",
        size: 100,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "planVendor",
        header: "Vendor / OEM",
        size: 160,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12 }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "changeImpact",
        header: "Impact",
        size: 90,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12 }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        filterVariant: "select",
        filterSelectOptions: ["Active", "Inactive", "Draft"],
        Cell: ({ cell }) => <StatusBadge value={cell.getValue<string>()} />,
      },
    ],
    [handleOpenPlanDialog],
  );

  // ── Table instance ─────────────────────────────────────────────────────────

  const table = useAppTable({
    columns,
    data: apiRows,
    state: {
      isLoading,
      showProgressBars: isFetching && !isLoading,
      pagination,
    },
    initialState: {
      density: "compact",
      showGlobalFilter: true,
    },
    manualPagination: true,
    rowCount: data?.totalElements ?? 0,
    onPaginationChange: setPagination,
    enableFacetedValues: true,

    // ── Enable Action Column (Edit) ──────────────────────────────────────────
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row }) => (
      <Tooltip title="Edit Row">
        <IconButton
          size="small"
          onClick={() => handleOpenEdit(row.original)}
          sx={{ color: "text.secondary" }}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),

    renderToolbarInternalActions: () => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title="Refresh">
          <span>
            <IconButton
              size="small"
              onClick={refetch}
              disabled={isFetching}
              sx={{ p: "5px" }}
            >
              <RefreshIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate}
          sx={{
            fontSize: 12,
            py: 0.5,
            px: 1.5,
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {isDownloadingTemplate ? "Downloading…" : "Download Template"}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
          onClick={handleOpenUploadDialog}
          sx={{
            fontSize: 12,
            py: 0.5,
            px: 1.5,
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Upload Excel
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          onClick={handleOpenAddPlanDialog}
          disableElevation
          sx={{
            fontSize: 12,
            py: 0.5,
            px: 1.5,
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          New Plan
        </Button>
      </Box>
    ),

    muiTableContainerProps: {
      sx: { maxHeight: "calc(100vh - 360px)", minHeight: 240 },
    },
    muiTableBodyRowProps: {
      sx: {
        "&:hover td": {
          backgroundColor: alpha(
            theme.palette.primary.main,
            isDark ? 0.08 : 0.04,
          ),
        },
        transition: "background-color 100ms ease",
      },
    },
    muiTopToolbarProps: {
      sx: {
        px: 1.5,
        py: 0.75,
        minHeight: 46,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        "& .MuiTextField-root": { minWidth: 200 },
      },
    },
    muiSearchTextFieldProps: {
      size: "small",
      placeholder: "Search…",
      variant: "outlined",
      sx: {
        "& .MuiOutlinedInput-root": {
          fontSize: 12,
          borderRadius: 1.5,
          height: 30,
        },
      },
    },
    muiLinearProgressProps: { color: "primary", sx: { height: 2 } },
    muiSkeletonProps: { height: 22, sx: { borderRadius: 1 } },

    renderEmptyRowsFallback: () => (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          py: 5,
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 34, color: "text.disabled" }} />
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          No plans found
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mb: 2 }}>
          {subDomainId
            ? "Try adjusting your search or filters."
            : "Select a Sub Domain to load data."}
        </Typography>
        {subDomainId != null && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={handleOpenAddPlanDialog}
            disableElevation
            sx={{
              fontSize: 12,
              py: 0.5,
              px: 1.5,
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Add First Plan
          </Button>
        )}
      </Box>
    ),
  });

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (subDomainId === undefined) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 5, borderRadius: 2, textAlign: "center" }}
      >
        <InfoOutlinedIcon
          sx={{ fontSize: 36, color: "text.disabled", mb: 1 }}
        />
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Select a Sub Domain
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Use the filters above to pick a Sub Domain and load its plans.
        </Typography>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        sx={{ borderRadius: 2 }}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refetch}
          >
            Retry
          </Button>
        }
      >
        {(error as any)?.data?.message ??
          "Failed to load plans. Please try again."}
      </Alert>
    );
  }

  return (
    <>
      <MaterialReactTable table={table} />

      {/* Edit Dialog Component */}
      <PlanEditDialog
        open={editDialogOpen}
        onClose={handleCloseEdit}
        data={selectedRowData}
        chmDomainOptions={chmDomainOptions}
        chmSubDomainOptions={chmSubDomainOptions}
      />

      {/* Add Plan Dialog Component */}
      <PlanAddDialog
        open={addPlanDialogOpen}
        onClose={handleCloseAddPlanDialog}
        onSuccess={handleAddPlanSuccess}
        chmDomainOptions={chmDomainOptions}
        chmSubDomainOptions={chmSubDomainOptions}
        selectedChmDomain={selectedChmDomain}
        selectedChmSubDomain={selectedChmSubDomain}
      />

      {/* Bulk Upload Plan + Activity Dialog Component */}
      <UploadPlanActivityDialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
};
