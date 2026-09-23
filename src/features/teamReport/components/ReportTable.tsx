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
}

export function ReportTable({ url, title, range, refreshKey, renderCell }: Props) {
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [exporting, setExporting] = useState(false);

  const { data, isFetching, isError, error, refetch } = useGetTeamReportQuery({
    url,
    ...range,
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });
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
      headers.map((key) => ({
        accessorKey: key,
        header: labelFor(key),
        Cell: ({ cell }) => {
          const value = cell.getValue<CellValue>();
          return renderCell?.(key, value) ?? formatCell(value);
        },
      })),
    [headers, renderCell],
  );

  const errorMessage =
    (error as { data?: { message?: string } } | undefined)?.data?.message ?? `Couldn't load the ${title}.`;

  // The table only holds the current page, so the export asks the backend for
  // the whole range in one page and builds the workbook from that.
  const handleExport = async () => {
    setExporting(true);
    try {
      const all = await fetchAllRows({ url, ...range, page: 0, size: EXPORT_MAX_ROWS }).unwrap();
      const exportRows = all.data.map((row) =>
        Object.fromEntries(all.headers.map((key) => [key, formatCell(row[key])])),
      );
      await exportRowsToExcel(
        exportRows,
        all.headers.map((key) => ({ header: labelFor(key), key })),
        title,
        `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${range.startDate}_to_${range.endDate}`,
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
    manualPagination: true,
    rowCount,
    onPaginationChange: setPagination,
    state: { isLoading: isFetching, pagination },
    // Search and sort would only ever see the current page, so they're off
    // rather than silently giving page-local results.
    enableGlobalFilter: false,
    enableSorting: false,
    enableColumnFilters: false,
    initialState: { density: "compact" },
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
      // rowCount is only an estimate (no total from the procedure), so it
      // mustn't be offered as a page size.
      showAllOption: false,
      isError,
      emptyTitle: isError ? errorMessage : "No data available for the selected date range.",
      emptyDescription: isError ? undefined : "Please adjust your filters or try a different date range.",
    },
  });

  return <MaterialReactTable table={table} />;
}
