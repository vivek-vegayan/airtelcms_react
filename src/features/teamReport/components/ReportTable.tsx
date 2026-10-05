import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { exportRowsToExcel } from "../../crqAnalytics/utils/excelExport";
import { useGetTeamReportQuery, useLazyGetTeamReportQuery } from "../api/teamReportApi";
import type { ReportDateRange } from "../types/teamReport.types";

type CellValue = string | number | null;
type ReportRow = Record<string, CellValue>;

const DEFAULT_PAGE_SIZE = 25;
const EXPORT_MAX_ROWS = 100000;
// A column with at most this many distinct values gets a checkbox list as its
// filter (like Plan View's Status / Layer); anything wider gets a text box.
const MULTI_SELECT_MAX_VALUES = 20;

// Procedure column aliases that don't read well once underscores become
// spaces. Anything not listed is shown with its alias prettified.
const COLUMN_LABELS: Record<string, string> = {
  Olm_Id: "OLM ID",
  SubDomain: "Sub Domain",
  CRQ_No: "CRQ No",
  current_status: "Current Status",
  Duration_Mins: "Duration (Mins)",
};

const labelFor = (key: string) => COLUMN_LABELS[key] ?? key.replace(/_/g, " ");

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isDateValue = (value: CellValue) =>
  typeof value === "string" && (ISO_DATE_TIME.test(value) || ISO_DATE.test(value));

// Dates arrive as ISO strings from Jackson; shown the way the rest of the app does.
const formatCell = (value: CellValue) => {
  if (value == null || value === "") return "";
  if (typeof value === "string" && ISO_DATE_TIME.test(value)) return dayjs(value).format("DD-MM-YYYY HH:mm");
  if (typeof value === "string" && ISO_DATE.test(value)) return dayjs(value).format("DD-MM-YYYY");
  return String(value);
};

interface Props {
  /** Backend endpoint, e.g. "/team-report/leave". */
  url: string;
  /** Used for the Excel sheet name and file name. */
  title: string;
  range: ReportDateRange;
  /**
   * Bumped by the page's SHOW button only when the range is unchanged — a new
   * range already triggers a fetch, but the same one would be served from
   * RTK Query's cache.
   */
  refreshKey: number;
  /** Custom rendering for particular columns; return undefined to fall back to text. */
  renderCell?: (key: string, value: CellValue) => ReactNode | undefined;
  /**
   * Loads the whole range in one request and pages it in the browser, which
   * turns on search, sort and the column menu (filter by, resize, hide) —
   * they'd only ever see the current page of a server-paged report.
   */
  clientSide?: boolean;
}

export function ReportTable({ url, title, range, refreshKey, renderCell, clientSide = false }: Props) {
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [exporting, setExporting] = useState(false);

  const { data, isFetching, isError, error, refetch } = useGetTeamReportQuery(
    clientSide
      ? { url, ...range, page: 0, size: EXPORT_MAX_ROWS }
      : { url, ...range, page: pagination.pageIndex, size: pagination.pageSize },
  );
  const [fetchAllRows] = useLazyGetTeamReportQuery();

  const lastRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== lastRefreshKey.current) {
      lastRefreshKey.current = refreshKey;
      refetch();
    }
  }, [refreshKey, refetch]);

  const headers = useMemo(() => data?.headers ?? [], [data]);
  const rows = useMemo<ReportRow[]>(() => (isError ? [] : data?.data ?? []), [data, isError]);

  // The procedures return no total, so allow one more page whenever this one
  // came back full, keeping Next usable.
  const rowCount =
    pagination.pageIndex * pagination.pageSize + rows.length + (rows.length === pagination.pageSize ? 1 : 0);

  const columns = useMemo<MRT_ColumnDef<ReportRow>[]>(
    () =>
      headers.map((key) => {
        const isDate = clientSide && rows.some((r) => isDateValue(r[key]));
        const distinct = clientSide ? new Set(rows.map((r) => formatCell(r[key])).filter(Boolean)).size : 0;
        return {
          id: key,
          // Filters, search and sort work on the text as shown, so "05-10-2026"
          // matches what the user sees rather than the raw ISO string.
          accessorFn: (row) => formatCell(row[key]),
          header: labelFor(key),
          // DD-MM-YYYY doesn't sort as text; the raw ISO value does.
          ...(isDate && {
            sortingFn: (a, b) => String(a.original[key] ?? "").localeCompare(String(b.original[key] ?? "")),
          }),
          ...(clientSide &&
            !isDate &&
            distinct > 0 &&
            distinct <= MULTI_SELECT_MAX_VALUES && { filterVariant: "multi-select" as const }),
          Cell: ({ cell, row }) => renderCell?.(key, row.original[key]) ?? cell.getValue<string>(),
        };
      }),
    [headers, rows, renderCell, clientSide],
  );

  const errorMessage =
    (error as { data?: { message?: string } } | undefined)?.data?.message ?? `Couldn't load the ${title}.`;

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${range.startDate}_to_${range.endDate}`;

  // The table only holds the current page, so the export asks the backend for
  // the whole range in one page and builds the workbook from that. In
  // client-side mode every row is already here, so it exports what the
  // filters and sort currently show.
  const handleExport = async () => {
    setExporting(true);
    try {
      if (clientSide) {
        const visible = table.getPrePaginationRowModel().rows.map((r) => r.original);
        await exportRowsToExcel(
          visible.map((row) => Object.fromEntries(headers.map((key) => [key, formatCell(row[key])]))),
          headers.map((key) => ({ header: labelFor(key), key })),
          title,
          fileName,
        );
        return;
      }
      const all = await fetchAllRows({ url, ...range, page: 0, size: EXPORT_MAX_ROWS }).unwrap();
      const exportRows = all.data.map((row) =>
        Object.fromEntries(all.headers.map((key) => [key, formatCell(row[key])])),
      );
      await exportRowsToExcel(
        exportRows,
        all.headers.map((key) => ({ header: labelFor(key), key })),
        title,
        fileName,
      );
    } catch {
      toast.error(`Couldn't export the ${title}. Please try again.`);
    } finally {
      setExporting(false);
    }
  };

  const table = useAppTable({
    columns,
    data: rows,
    onPaginationChange: setPagination,
    state: { isLoading: isFetching, pagination },
    initialState: { density: "compact" },
    ...(clientSide
      ? {
          enableFacetedValues: true,
          // ── Column menu (⋮): sort, filter by, reset size, hide / show columns ──
          // Same setup as Plan View & Setup.
          enableColumnActions: true,
          enableSorting: true,
          enableColumnFilters: true,
          // "subheader" is the mode that puts "Filter by <column>" in the ⋮ menu.
          columnFilterDisplayMode: "subheader" as const,
          enableColumnResizing: true,
          layoutMode: "grid" as const,
          columnResizeMode: "onEnd" as const,
          enableHiding: true,
        }
      : {
          manualPagination: true,
          rowCount,
          // Search and sort would only ever see the current page, so they're off
          // rather than silently giving page-local results.
          enableGlobalFilter: false,
          enableSorting: false,
          enableColumnFilters: false,
        }),
    renderTopToolbarCustomActions: () => (
      <Button
        size="small"
        variant="outlined"
        color="success"
        startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <DownloadRoundedIcon />}
        disabled={rows.length === 0 || isFetching || exporting}
        onClick={handleExport}
      >
        {exporting ? "Exporting..." : "Export Excel"}
      </Button>
    ),
    appTable: {
      // Server-paged: rowCount is only an estimate (no total from the
      // procedure), so it mustn't be offered as a page size.
      showAllOption: clientSide,
      isError,
      emptyTitle: isError ? errorMessage : "No data available for the selected date range.",
      emptyDescription: isError ? undefined : "Please adjust your filters or try a different date range.",
    },
  });

  return <MaterialReactTable table={table} />;
}
