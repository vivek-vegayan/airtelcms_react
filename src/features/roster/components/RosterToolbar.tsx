import {
  Paper,
  Stack,
  Typography,
  Button,
  CircularProgress,
  useTheme,
  Box,
  Chip,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useState } from "react";
import { CompactShiftCountBar } from "./RosterShiftCountBar";
import { RosterSearchInput } from "./toolbar/RosterSearchInput";
import { HighlightShiftSelect } from "./toolbar/HighlightShiftSelect";
import {
  FilterToggleButton,
  RosterFilterPanel,
} from "./toolbar/RosterFilterPanel";
import { DetailedViewToggle } from "./toolbar/DetailedViewToggle";

/* ─── Props ───────────────────────────────────────────────────────────── */
export interface RosterSwapControls {
  isSwapMode: boolean;
  onToggleSwapMode: () => void;
  selectedSwapCount: number;
  onApplySwap: () => void;
  isSwapping: boolean;
}

interface Props {
  domainId?: number;
  subDomainId?: number;
  searchTerms: string[];
  onSearchChange: (terms: string[]) => void;
  isDetailed: boolean;
  onToggleDetailed: () => void;
  filterShift: string[];
  onFilterShiftChange: (v: string[]) => void;
  filterLevel: string[];
  onFilterLevelChange: (v: string[]) => void;
  jobLevels: string[];
  highlightShift: string;
  onHighlightShiftChange: (v: string) => void;
  /** Weekly-only shift-swap controls; omit to hide the swap buttons. */
  swap?: RosterSwapControls;
  /** Unique id for the search input element (one per view). */
  searchInputId?: string;
}

/* ─── Component ───────────────────────────────────────────────────────── */
/**
 * Toolbar shared by the Weekly and Monthly roster views: today's shift
 * count, multi-term search, highlight picker, filters and density toggle.
 * The Weekly view additionally passes `swap` for the shift-swap buttons.
 */
export const RosterToolbar = ({
  domainId,
  subDomainId,
  searchTerms,
  onSearchChange,
  isDetailed,
  onToggleDetailed,
  filterShift,
  onFilterShiftChange,
  filterLevel,
  onFilterLevelChange,
  jobLevels,
  highlightShift,
  onHighlightShiftChange,
  swap,
  searchInputId = "roster-search-input",
}: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bgColor = isDark ? theme.palette.background.paper : "#F3F4F6";

  const [inputVal, setInputVal] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const hasSearch = searchTerms.length > 0 || inputVal.trim().length > 0;
  const hasActiveFilters = Boolean(
    searchTerms.length || filterShift.length || filterLevel.length,
  );

  return (
    <Box sx={{ mb: 0.5 }}>
      {/* ══════════ MAIN TOOLBAR ROW ══════════ */}
      <Paper
        elevation={0}
        sx={{
          p: 0.75,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
        }}
      >
        {/* LEFT: shift count + search + highlight + filters */}
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          bgcolor={bgColor}
          borderRadius={6}
          px={1.75}
          py={0.75}
          border={`0.5px solid ${theme.palette.divider}`}
          flexWrap="wrap"
        >
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            <Typography
              sx={{
                fontSize: "0.525rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "text.primary",
                lineHeight: 1,
              }}
            >
              Today's shift count :
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CompactShiftCountBar
                domainId={domainId}
                subDomainId={subDomainId}
              />
            </Stack>
          </Box>

          <RosterSearchInput
            inputId={searchInputId}
            searchTerms={searchTerms}
            onTermsChange={onSearchChange}
            inputValue={inputVal}
            onInputChange={setInputVal}
          />

          {hasSearch && (
            <Typography
              sx={{ fontSize: "0.6rem", color: "text.disabled", mt: 0.25 }}
            >
              {searchTerms.length} filter{searchTerms.length !== 1 ? "s" : ""}{" "}
              active · Press Enter or comma to add
            </Typography>
          )}

          <HighlightShiftSelect
            value={highlightShift}
            onChange={onHighlightShiftChange}
          />

          <FilterToggleButton
            open={showFilters}
            onToggle={() => setShowFilters((p) => !p)}
            hasActiveFilters={hasActiveFilters}
          />

          {hasActiveFilters && (
            <Chip
              label="Clear all"
              size="small"
              onDelete={() => {
                onFilterShiftChange([]);
                onFilterLevelChange([]);
                onSearchChange([]);
                setInputVal("");
              }}
              sx={{ height: 22, fontSize: 10 }}
            />
          )}
        </Stack>

        {/* RIGHT: density + swap controls */}
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <DetailedViewToggle checked={isDetailed} onToggle={onToggleDetailed} />

          {swap && (
            <Stack direction="row" spacing={1}>
              <Button
                variant={swap.isSwapMode ? "contained" : "outlined"}
                color={swap.isSwapMode ? "error" : "primary"}
                startIcon={<SwapHorizIcon />}
                onClick={swap.onToggleSwapMode}
                size="small"
              >
                {swap.isSwapMode ? "Cancel Swap" : "Shift Swap"}
              </Button>
              {swap.isSwapMode && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  disabled={swap.selectedSwapCount !== 2 || swap.isSwapping}
                  onClick={swap.onApplySwap}
                  startIcon={
                    swap.isSwapping ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                >
                  Apply Swap ({swap.selectedSwapCount}/2)
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* ══════════ COLLAPSIBLE FILTER PANEL ══════════ */}
      <RosterFilterPanel
        open={showFilters}
        filterShift={filterShift}
        onFilterShiftChange={onFilterShiftChange}
        filterLevel={filterLevel}
        onFilterLevelChange={onFilterLevelChange}
        jobLevels={jobLevels}
      />
    </Box>
  );
};
