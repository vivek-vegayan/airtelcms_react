import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import { useTabColorTokens } from "../../../../style/theme";
import type {
  AuditLogFilterOptions,
  AuditLogFilters,
} from "../../types/auditLog";

interface Props {
  filters: AuditLogFilters;
  options?: AuditLogFilterOptions;
  optionsLoading: boolean;
  onChange: <K extends keyof AuditLogFilters>(
    key: K,
    value: AuditLogFilters[K],
  ) => void;
  /** Uncommitted search text — debounced by the page before it becomes a filter. */
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onClear: () => void;
  activeFilterCount: number;
}

/** Shared sizing so every control on the bar lines up on one row. */
const controlSx = {
  "& .MuiInputBase-root": { height: 32 },
  "& .MuiInputBase-input": { padding: "4px 8px", fontSize: "0.8rem" },
  "& .MuiInputLabel-root": { fontSize: "0.8rem" },
};

/**
 * Compact filter bar for the Audit Log.
 *
 * Every dropdown is populated from `/audit-logs/filters`, i.e. from values that
 * actually occur in the table — so no filter here can be set to something that
 * returns an empty page. Nothing is hardcoded: a module or action the backend
 * starts recording tomorrow appears in these lists without a frontend change.
 *
 * The org-hierarchy picker bar used elsewhere is deliberately not reused. Audit
 * rows carry no vertical/function/domain scope (the table stores module,
 * sub-module and two user ids), so those pickers would filter on nothing.
 */
const AuditLogFilterBar = ({
  filters,
  options,
  optionsLoading,
  onChange,
  searchInput,
  onSearchInputChange,
  onClear,
  activeFilterCount,
}: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const ALL = "";

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.25,
        alignItems: "center",
        p: 1.5,
        borderRadius: tk.radiusL,
        bgcolor: tk.surface,
        border: `1px solid ${tk.border}`,
      }}
    >
      {/* Global text search — matches module, sub module, action, remark and
          either user's name or OLM id, all inside the procedure. */}
      <TextField
        size="small"
        placeholder="Search action, remark, module, user…"
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        sx={{ minWidth: 240, flex: "1 1 240px", ...controlSx }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, color: tk.textDim }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        select
        size="small"
        label="Module"
        value={filters.module ?? ALL}
        disabled={optionsLoading}
        onChange={(e) => {
          const value = e.target.value || undefined;
          onChange("module", value);
          // The Sub Module list is scoped to the chosen module, so a sub module
          // picked under the previous one would silently filter to nothing.
          onChange("subModule", undefined);
        }}
        sx={{ minWidth: 165, ...controlSx }}
      >
        <MenuItem value={ALL} sx={{ fontSize: "0.8rem" }}>
          All Modules
        </MenuItem>
        {(options?.modules ?? []).map((m) => (
          <MenuItem key={m} value={m} sx={{ fontSize: "0.8rem" }}>
            {m}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Sub Module"
        value={filters.subModule ?? ALL}
        disabled={optionsLoading}
        onChange={(e) => onChange("subModule", e.target.value || undefined)}
        sx={{ minWidth: 165, ...controlSx }}
      >
        <MenuItem value={ALL} sx={{ fontSize: "0.8rem" }}>
          All Sub Modules
        </MenuItem>
        {(options?.subModules ?? []).map((s) => (
          <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>
            {s}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Action"
        value={filters.action ?? ALL}
        disabled={optionsLoading}
        onChange={(e) => onChange("action", e.target.value || undefined)}
        sx={{ minWidth: 145, ...controlSx }}
      >
        <MenuItem value={ALL} sx={{ fontSize: "0.8rem" }}>
          All Actions
        </MenuItem>
        {(options?.actions ?? []).map((a) => (
          <MenuItem key={a} value={a} sx={{ fontSize: "0.8rem" }}>
            {a}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Actor"
        value={filters.actorUserId ?? 0}
        disabled={optionsLoading}
        onChange={(e) =>
          onChange("actorUserId", Number(e.target.value) || undefined)
        }
        sx={{ minWidth: 185, ...controlSx }}
      >
        <MenuItem value={0} sx={{ fontSize: "0.8rem" }}>
          All Actors
        </MenuItem>
        {(options?.actors ?? []).map((u) => (
          <MenuItem key={u.userId} value={u.userId} sx={{ fontSize: "0.8rem" }}>
            {u.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Affected User"
        value={filters.affectedUserId ?? 0}
        disabled={optionsLoading}
        onChange={(e) =>
          onChange("affectedUserId", Number(e.target.value) || undefined)
        }
        sx={{ minWidth: 185, ...controlSx }}
      >
        <MenuItem value={0} sx={{ fontSize: "0.8rem" }}>
          All Affected Users
        </MenuItem>
        {(options?.affectedUsers ?? []).map((u) => (
          <MenuItem key={u.userId} value={u.userId} sx={{ fontSize: "0.8rem" }}>
            {u.label}
          </MenuItem>
        ))}
      </TextField>

      {/* Native date inputs rather than the MUI picker: two of them side by
          side on a filter strip need to stay 32px tall and keyboard-typeable,
          and the value posted is already the ISO string the API wants. */}
      <Tooltip title="Actions performed on or after this date">
        <TextField
          size="small"
          type="date"
          label="From"
          value={filters.fromDate ?? ""}
          onChange={(e) => onChange("fromDate", e.target.value || undefined)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 150, ...controlSx }}
        />
      </Tooltip>

      <Tooltip title="Actions performed on or before this date">
        <TextField
          size="small"
          type="date"
          label="To"
          value={filters.toDate ?? ""}
          onChange={(e) => onChange("toDate", e.target.value || undefined)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 150, ...controlSx }}
        />
      </Tooltip>

      {activeFilterCount > 0 && (
        <Chip
          size="small"
          label={`${activeFilterCount} active`}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 700,
            color: tk.accent,
            bgcolor: tk.accentDim,
            border: `1px solid ${tk.accentBorder}`,
          }}
        />
      )}

      <Button
        size="small"
        variant="text"
        disabled={activeFilterCount === 0}
        onClick={onClear}
        startIcon={<FilterAltOffRoundedIcon sx={{ fontSize: 16 }} />}
        sx={{ textTransform: "none", fontSize: "0.78rem", height: 32 }}
      >
        Clear
      </Button>
    </Box>
  );
};

export default AuditLogFilterBar;
