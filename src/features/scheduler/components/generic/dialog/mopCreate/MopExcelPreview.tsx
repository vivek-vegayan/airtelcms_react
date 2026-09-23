import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, CircularProgress, Stack, Tab, Tabs, Typography, alpha } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ExcelJS from "exceljs";

interface MopExcelPreviewProps {
  blob?: Blob;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  colors: any;
}

interface Sheet {
  name: string;
  /** Row 0 is treated as the header row. */
  rows: string[][];
  totalRows: number;
  totalColumns: number;
}

/** Beyond this the table stops being a preview and starts being a spreadsheet
 *  the browser has to lay out - the rest is a download away. */
const MAX_ROWS = 300;
const MAX_COLUMNS = 40;

/**
 * Renders an ExcelJS cell value as display text. Cells can hold formulas,
 * rich text, hyperlinks, errors and dates, none of which stringify usefully
 * on their own - `String(cell.value)` yields "[object Object]" for four of
 * those five.
 */
const cellText = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "object") {
    const v = value as any;
    // Formula cells carry the computed result alongside the expression; the
    // result is what a reviewer is reading for.
    if ("result" in v) return v.result === undefined || v.result === null ? "" : String(v.result);
    if ("richText" in v) return (v.richText ?? []).map((r: any) => r.text).join("");
    if ("text" in v) return String(v.text);
    if ("error" in v) return String(v.error);
    return "";
  }
  return String(value);
};

/**
 * The stored MOP rendered as a read-only table when it is a workbook rather
 * than a PDF, filling whatever height the panel has left.
 *
 * Parsed with `exceljs`, which the app already depends on and bundles for its
 * three export paths, so this adds no new package. It reads .xlsx but not the
 * legacy .xls (BIFF) container - `MopDocumentUploader` routes those to a
 * download-only state rather than mounting this and failing.
 */
export const MopExcelPreview: React.FC<MopExcelPreviewProps> = ({
  blob,
  isFetching,
  isError,
  onRetry,
  colors,
}) => {
  const [sheets, setSheets] = useState<Sheet[] | null>(null);
  const [active, setActive] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (!blob) {
      setSheets(null);
      return;
    }
    let cancelled = false;
    setIsParsing(true);
    setParseError(null);

    blob
      .arrayBuffer()
      .then((buf) => new ExcelJS.Workbook().xlsx.load(buf))
      .then((workbook) => {
        if (cancelled) return;
        const parsed: Sheet[] = workbook.worksheets.map((ws) => {
          const totalRows = ws.rowCount;
          const totalColumns = ws.columnCount;
          const columns = Math.min(totalColumns, MAX_COLUMNS);
          const rows: string[][] = [];
          // 1-indexed, and getRow() on a sparse sheet still returns a row
          // object - so this walks positions rather than ws.eachRow, which
          // would skip blanks and silently shift the grid upward.
          for (let r = 1; r <= Math.min(totalRows, MAX_ROWS); r++) {
            const row = ws.getRow(r);
            const cells: string[] = [];
            for (let c = 1; c <= columns; c++) cells.push(cellText(row.getCell(c).value));
            rows.push(cells);
          }
          return { name: ws.name, rows, totalRows, totalColumns };
        });
        setSheets(parsed);
        setActive(0);
      })
      .catch(() => {
        if (!cancelled) setParseError("This workbook could not be read.");
      })
      .finally(() => {
        if (!cancelled) setIsParsing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [blob]);

  const sheet = sheets?.[active];
  const truncated = useMemo(
    () =>
      sheet
        ? { rows: sheet.totalRows > MAX_ROWS, cols: sheet.totalColumns > MAX_COLUMNS }
        : { rows: false, cols: false },
    [sheet],
  );

  const frame = {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${colors.border}`,
    borderRadius: 2,
    overflow: "hidden",
    bgcolor: colors.surface,
  } as const;

  if (isFetching || isParsing) {
    return (
      <Stack sx={{ ...frame, alignItems: "center", justifyContent: "center" }} spacing={1.2}>
        <CircularProgress size={24} />
        <Typography sx={{ fontSize: 12.5, color: colors.textDim, fontWeight: 600 }}>
          {isFetching ? "Loading MOP…" : "Reading workbook…"}
        </Typography>
      </Stack>
    );
  }

  if (isError || parseError) {
    return (
      <Stack
        sx={{ ...frame, alignItems: "center", justifyContent: "center", p: 3, textAlign: "center" }}
        spacing={1.5}
      >
        <ErrorOutlineRoundedIcon sx={{ fontSize: 30, color: colors.danger }} />
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
          Unable to show the MOP workbook.
        </Typography>
        <Typography sx={{ fontSize: 12, color: colors.textDim, maxWidth: 340 }}>
          {parseError ?? "The document could not be fetched. Try again, or download it to open it."}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={onRetry}
          startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  if (!sheet) return <Box sx={frame} />;

  return (
    <Box sx={frame}>
      {sheets && sheets.length > 1 && (
        <Tabs
          value={active}
          onChange={(_e, v) => setActive(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 34,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
            "& .MuiTab-root": {
              minHeight: 34,
              py: 0,
              textTransform: "none",
              fontSize: 12.5,
              fontWeight: 600,
            },
          }}
        >
          {sheets.map((s) => (
            <Tab key={s.name} label={s.name} />
          ))}
        </Tabs>
      )}

      {/* The one scroller in the panel. Both axes, because a workbook is
          wider than the pane far more often than a PDF is. */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Box component="table" sx={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "100%" }}>
          <Box component="tbody">
            {sheet.rows.map((row, r) => (
              <Box
                component="tr"
                key={r}
                sx={{
                  bgcolor:
                    r === 0
                      ? alpha(colors.accent, 0.08)
                      : r % 2
                        ? alpha(colors.textPrimary, 0.02)
                        : "transparent",
                }}
              >
                {/* Row numbers, so a finding can name a row the way the
                    reviewer sees it in Excel. */}
                <Box
                  component="td"
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    px: 1,
                    py: 0.5,
                    textAlign: "right",
                    fontSize: 10.5,
                    color: colors.textDim,
                    bgcolor: colors.surface,
                    borderRight: `1px solid ${colors.border}`,
                    borderBottom: `1px solid ${colors.border}`,
                    fontVariantNumeric: "tabular-nums",
                    userSelect: "none",
                  }}
                >
                  {r + 1}
                </Box>
                {row.map((cell, c) => (
                  <Box
                    component="td"
                    key={c}
                    title={cell || undefined}
                    sx={{
                      px: 1,
                      py: 0.5,
                      fontSize: 12,
                      lineHeight: 1.5,
                      whiteSpace: "nowrap",
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: r === 0 ? 700 : 400,
                      color: r === 0 ? colors.textPrimary : colors.textSecondary,
                      borderBottom: `1px solid ${colors.border}`,
                      borderRight: `1px solid ${alpha(colors.border, 0.6)}`,
                    }}
                  >
                    {cell}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {(truncated.rows || truncated.cols) && (
        <Box
          sx={{
            flexShrink: 0,
            px: 1.5,
            py: 0.75,
            borderTop: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Chip
            label="Preview truncated"
            size="small"
            sx={{
              height: 19,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: alpha(colors.warning, 0.15),
              color: colors.warning,
            }}
          />
          <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>
            Showing {Math.min(sheet.totalRows, MAX_ROWS)} of {sheet.totalRows} rows
            {truncated.cols && ` and ${MAX_COLUMNS} of ${sheet.totalColumns} columns`}. Download the
            workbook to see all of it.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MopExcelPreview;
