import {
  Box,
  Button,
  CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  useAddCabRejectReasonMutation,
  useDeleteCabRejectReasonMutation,
  useGetCabRejectReasonsQuery,
  useUpdateCabRejectReasonMutation,
} from "../../api/cabManagerApiSlice";
import type { CabRejectReason } from "../../types/types";

export function AdminReasonsTab() {

  const { data, isLoading } = useGetCabRejectReasonsQuery();
  const [addReason, { isLoading: isAdding }] = useAddCabRejectReasonMutation();
  const [updateReason, { isLoading: isUpdating }] = useUpdateCabRejectReasonMutation();
  const [deleteReason, { isLoading: isDeleting }] = useDeleteCabRejectReasonMutation();

  const [newReason, setNewReason] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CabRejectReason | null>(null);

  const handleAdd = async () => {
    const reasonText = newReason.trim();
    if (!reasonText) return;
    try {
      const result = await addReason({ reasonText }).unwrap();
      toast.success(result.message);
      setNewReason("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add rejection reason.");
    }
  };

  const startEdit = (row: CabRejectReason) => {
    setEditingId(row.reasonId);
    setEditingText(row.reasonText);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    const reasonText = editingText.trim();
    if (!reasonText || editingId == null) return;
    try {
      const result = await updateReason({ reasonId: editingId, reasonText }).unwrap();
      toast.success(result.message);
      cancelEdit();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update rejection reason.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteReason(deleteTarget.reasonId).unwrap();
      toast.success(result.message);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete rejection reason.");
    }
  };

  const columns = useMemo<MRT_ColumnDef<CabRejectReason>[]>(
    () => [
      {
        accessorKey: "reasonId",
        header: "ID",
        size: 90,
        grow: false,
        Cell: ({ row }) => (
          <Typography sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontSize: 12.5 }}>
            #{row.original.reasonId}
          </Typography>
        ),
      },
      {
        accessorKey: "reasonText",
        header: "Reason",
        grow: true,
        Cell: ({ row }) =>
          editingId === row.original.reasonId ? (
            <TextField
              size="small"
              autoFocus
              fullWidth
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
            />
          ) : (
            <Typography variant="body2" sx={{ fontSize: 13.5 }}>{row.original.reasonText}</Typography>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 130,
        grow: false,
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) =>
          editingId === row.original.reasonId ? (
            <Stack direction="row" spacing={0.5} justifyContent="center">
              <Tooltip title="Save">
                <span>
                  <IconButton size="small" color="primary" onClick={() => void saveEdit()} disabled={isUpdating}>
                    {isUpdating ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={cancelEdit}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Stack direction="row" spacing={0.5} justifyContent="center">
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => startEdit(row.original)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(row.original)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ),
      },
    ],
    [editingId, editingText, isUpdating]
  );

  const table = useAppTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.reasonId),
    state: { isLoading },
    appTable: {
      emptyTitle: "No rejection reasons configured yet",
      emptyDescription: "Add the first one above.",
    },
    layoutMode: "grid",
    initialState: { density: "comfortable" },
    enableTopToolbar: false,
    // Scroll-only, no paging: every reason renders and the container scrolls.
    // enablePagination defaults to true, so leaving it on while the bottom
    // toolbar is hidden would cap the list at 10 rows with no way to reach the
    // rest. This list stays short and is edited inline, so paging it would just
    // get in the way.
    enablePagination: false,
    enableBottomToolbar: false,
    enableSorting: false,
    muiTableContainerProps: { sx: { maxHeight: "calc(100vh - 360px)", minHeight: 240 } },
    muiTableBodyRowProps: { hover: true },
  });

  return (
    <Box>
      <Paper sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }} elevation={0}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Box sx={{ minWidth: 260 }}>
            <Typography sx={{ fontWeight: 500 }}>
              Rejection Reason Configuration
              <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
                — {data?.length ?? 0} reasons
              </Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              These reasons populate the dropdown shown when a CRQ is rejected.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ flex: 1, maxWidth: 560 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Type a new rejection reason…"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); }}
            />
            <Button
              variant="contained"
              startIcon={isAdding ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
              onClick={() => void handleAdd()}
              disabled={isAdding || !newReason.trim()}
              sx={{ whiteSpace: "nowrap" }}
            >
              Add reason
            </Button>
          </Stack>
        </Stack>

        <MaterialReactTable table={table} />
      </Paper>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete rejection reason?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            "{deleteTarget?.reasonText}" will be removed and no longer selectable when rejecting a CRQ.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => void confirmDelete()} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
