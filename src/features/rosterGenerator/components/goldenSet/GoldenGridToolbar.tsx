import {
  alpha,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import CloseIcon from "@mui/icons-material/Close";
import DownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RedoIcon from "@mui/icons-material/Redo";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchIcon from "@mui/icons-material/Search";
import UndoIcon from "@mui/icons-material/Undo";
import type { Dispatch, SetStateAction } from "react";
import type { SortConfig, SortField } from "./RosterFilterDrawer";
import { EDIT_MODES } from "./goldenGrid.constants";
import type { EditMode } from "./goldenGrid.types";
import { useGoldenGridTokens } from "./useGoldenGridTokens";

interface GoldenGridToolbarProps {
  searchRaw: string;
  setSearchRaw: (v: string) => void;
  activeFilters: number;
  filterOpen: boolean;
  setFilterOpen: (v: boolean) => void;
  sort: SortConfig;
  setSort: Dispatch<SetStateAction<SortConfig>>;
  setAnalyticsOpen: (v: boolean) => void;
  editing: boolean;
  canUndo: boolean;
  handleUndo: () => void;
  canRedo: boolean;
  handleRedo: () => void;
  editMode: EditMode;
  setEditMode: (m: EditMode) => void;
  clearSelection: () => void;
  changedCount: number;
  setEditing: (v: boolean) => void;
  isSaving: boolean;
  handleSaveChanges: () => void | Promise<void>;
  handleDiscard: () => void;
  downloadCsv: () => void;
  refetch: () => void;
}

export default function GoldenGridToolbar({
  searchRaw,
  setSearchRaw,
  activeFilters,
  filterOpen,
  setFilterOpen,
  sort,
  setSort,
  setAnalyticsOpen,
  editing,
  canUndo,
  handleUndo,
  canRedo,
  handleRedo,
  editMode,
  setEditMode,
  clearSelection,
  changedCount,
  setEditing,
  isSaving,
  handleSaveChanges,
  handleDiscard,
  downloadCsv,
  refetch,
}: GoldenGridToolbarProps) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      flexWrap="wrap"
      sx={{ flexShrink: 0 }}
    >
      {/* Search */}
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
        sx={{
          bgcolor: tk.surface,
          border: `1.5px solid ${tk.border}`,
          borderRadius: tk.radius,
          px: 1.25,
          py: 0.5,
          width: { xs: "100%", sm: 200 },
          transition: "border-color 0.2s,box-shadow 0.2s",
          "&:focus-within": {
            borderColor: tk.accent,
            boxShadow: `0 0 0 3px ${tk.accentDim}`,
          },
        }}
      >
        <SearchIcon sx={{ fontSize: 16, color: tk.textSecondary }} />
        <InputBase
          placeholder="Search name, ID, role…"
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
          sx={{
            fontSize: 12.5,
            width: "100%",
            fontWeight: 500,
            color: tk.textPrimary,
          }}
        />
        {searchRaw && (
          <IconButton
            size="small"
            onClick={() => setSearchRaw("")}
            sx={{ p: 0.25 }}
          >
            <CloseIcon sx={{ fontSize: 13 }} />
          </IconButton>
        )}
      </Stack>

      {/* Filter */}
      <Badge badgeContent={activeFilters || undefined} color="primary">
        <Button
          size="small"
          variant={filterOpen ? "contained" : "outlined"}
          startIcon={<FilterListIcon sx={{ fontSize: 15 }} />}
          onClick={() => setFilterOpen(true)}
          disableElevation
          sx={{
            fontSize: 12,
            height: 34,
            borderRadius: tk.radius,
            fontWeight: 600,
          }}
        >
          Filters
        </Button>
      </Badge>

      {/* Quick-sort chips */}
      <Stack
        direction="row"
        gap={0.5}
        sx={{ display: { xs: "none", md: "flex" } }}
      >
        {(["name", "work", "night"] as SortField[]).map((f) => (
          <Chip
            key={f}
            label={f.charAt(0).toUpperCase() + f.slice(1)}
            size="small"
            variant={sort.field === f ? "filled" : "outlined"}
            color={sort.field === f ? "primary" : "default"}
            icon={
              sort.field === f ? (
                sort.dir === "asc" ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )
              ) : undefined
            }
            onClick={() =>
              setSort((s) => ({
                field: f,
                dir: s.field === f && s.dir === "asc" ? "desc" : "asc",
              }))
            }
            sx={{
              fontSize: 11,
              height: 26,
              fontWeight: 600,
              borderRadius: "6px",
              cursor: "pointer",
            }}
          />
        ))}
      </Stack>

      <Box flex={1} />

      {/* Analytics */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<BarChartIcon sx={{ fontSize: 15 }} />}
        onClick={() => setAnalyticsOpen(true)}
        sx={{
          fontSize: 12,
          height: 34,
          borderRadius: tk.radius,
          fontWeight: 600,
        }}
      >
        Analytics
      </Button>

      {/* Undo / Redo */}
      {editing && (
        <>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton
                size="small"
                onClick={handleUndo}
                disabled={!canUndo}
                sx={{
                  border: `1.5px solid ${tk.border}`,
                  borderRadius: tk.radius,
                  width: 34,
                  height: 34,
                }}
              >
                <UndoIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton
                size="small"
                onClick={handleRedo}
                disabled={!canRedo}
                sx={{
                  border: `1.5px solid ${tk.border}`,
                  borderRadius: tk.radius,
                  width: 34,
                  height: 34,
                }}
              >
                <RedoIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
        </>
      )}

      {/* Edit mode tabs */}
      {editing && (
        <Stack
          direction="row"
          sx={{
            border: `1.5px solid ${tk.border}`,
            borderRadius: tk.radius,
            overflow: "hidden",
          }}
        >
          {EDIT_MODES.map((m, idx) => (
            <Tooltip key={m.id} title={m.tooltip} arrow>
              <Box
                onClick={() => {
                  setEditMode(m.id);
                  clearSelection();
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.25,
                  py: 0.6,
                  cursor: "pointer",
                  bgcolor: editMode === m.id ? tk.accentDim : "transparent",
                  color: editMode === m.id ? tk.accent : tk.textSecondary,
                  borderRight:
                    idx < EDIT_MODES.length - 1
                      ? `1px solid ${tk.border}`
                      : "none",
                  transition: "all .15s",
                  "&:hover": { bgcolor: tk.accentDim },
                }}
              >
                {m.icon}
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1,
                    ml: 0.3,
                  }}
                >
                  {m.label}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Stack>
      )}

      {/* Unsaved badge */}
      {editing && changedCount > 0 && (
        <Chip
          label={`${changedCount} row${changedCount !== 1 ? "s" : ""} changed`}
          size="small"
          color="warning"
          sx={{
            height: 26,
            fontSize: 10.5,
            borderRadius: "6px",
            fontWeight: 650,
          }}
        />
      )}

      {/* Edit toggle */}
      <Button
        size="small"
        variant="outlined"
        color={editing ? "error" : "inherit"}
        startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
        onClick={() => {
          if (editing) {
            setEditing(false);
            clearSelection();
          } else {
            setEditing(true);
            setEditMode("select");
          }
        }}
        disableElevation
        sx={{
          fontSize: 12,
          height: 34,
          borderRadius: tk.radius,
          fontWeight: 600,
        }}
      >
        {editing ? "Exit edit" : "Edit"}
      </Button>

      {/* Save */}
      {editing && (
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={
            isSaving ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <SaveOutlinedIcon sx={{ fontSize: 15 }} />
            )
          }
          onClick={handleSaveChanges}
          disabled={isSaving || changedCount === 0}
          disableElevation
          sx={{
            fontSize: 12,
            height: 34,
            borderRadius: tk.radius,
            fontWeight: 600,
          }}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      )}

      {/* Discard */}
      {editing && changedCount > 0 && (
        <Tooltip title="Discard all unsaved changes">
          <IconButton
            size="small"
            onClick={handleDiscard}
            sx={{
              border: `1.5px solid ${alpha(theme.palette.error.main, 0.4)}`,
              borderRadius: tk.radius,
              width: 34,
              height: 34,
              color: "error.main",
            }}
          >
            <CloseIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* CSV export */}
      <Tooltip title="Export visible rows as CSV">
        <IconButton
          size="small"
          onClick={downloadCsv}
          sx={{
            border: `1.5px solid ${tk.border}`,
            borderRadius: tk.radius,
            width: 34,
            height: 34,
          }}
        >
          <DownloadOutlinedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>

      {/* Reload */}
      <Tooltip title="Reload data">
        <IconButton
          size="small"
          onClick={() => refetch()}
          sx={{
            border: `1.5px solid ${tk.border}`,
            borderRadius: tk.radius,
            width: 34,
            height: 34,
          }}
        >
          <RefreshIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
