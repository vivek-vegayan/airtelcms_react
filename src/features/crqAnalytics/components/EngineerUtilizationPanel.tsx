import { useMemo, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { EngineerUtilizationTable } from "./EngineerUtilizationTable";
import { FunctionUtilizationTable, type FunctionUtilizationRow } from "./FunctionUtilizationTable";
import { exportRowsToExcel, type ExcelColumn } from "../utils/excelExport";
import type { EngineerUtilizationDto } from "../types/crqAnalytics.types";

type ViewMode = "engineer" | "function";

interface Props {
  rows: EngineerUtilizationDto[];
  isLoading?: boolean;
  isError?: boolean;
}

const EXCEL_COLUMNS: ExcelColumn[] = [
  { header: "Engineer", key: "engineerName" },
  { header: "Function", key: "teamFunction" },
  { header: "Skills", key: "skillTags" },
  { header: "Plan & Inv.", key: "planAndInventoryValidation" },
  { header: "Impact", key: "impactAnalysis" },
  { header: "MOP Create", key: "mopCreate" },
  { header: "MOP Validate", key: "mopValidate" },
  { header: "Scheduling", key: "schedulingAndApprovals" },
  { header: "Execution", key: "networkExecution" },
  { header: "Closure", key: "taskClosure" },
  { header: "Total Tasks", key: "totalTasks" },
  { header: "Planned Hrs", key: "plannedHrs" },
  { header: "Actual Hrs", key: "actualHrs" },
  { header: "Utilization %", key: "utilizationPct" },
];

/** One row per team function — a genuinely different table from the
 * per-engineer one (Function / Engineers / Total Tasks / Planned / Actual /
 * Avg Util%), matching the old "Bin/Team" view rather than reusing the
 * engineer columns with different values. */
function aggregateByFunction(rows: EngineerUtilizationDto[]): FunctionUtilizationRow[] {
  const groups = new Map<string, EngineerUtilizationDto[]>();
  for (const row of rows) {
    const key = row.teamFunction || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const result = Array.from(groups.entries()).map(([teamFunction, members]) => {
    const totalTasks = members.reduce((s, m) => s + (m.totalTasks ?? 0), 0);
    const plannedHrs = members.reduce((s, m) => s + (m.plannedHrs ?? 0), 0);
    const actualHrs = members.reduce((s, m) => s + (m.actualHrs ?? 0), 0);
    return {
      teamFunction,
      totalEngineers: members.length,
      totalTasks,
      plannedHrs,
      actualHrs,
      avgUtilizationPct: plannedHrs > 0 ? Math.round((actualHrs / plannedHrs) * 100) : 0,
    };
  });

  return result.sort((a, b) => b.avgUtilizationPct - a.avgUtilizationPct);
}

export function EngineerUtilizationPanel({ rows, isLoading, isError }: Props) {
  const theme = useTheme();
  const [view, setView] = useState<ViewMode>("engineer");

  const functionRows = useMemo(() => aggregateByFunction(rows), [rows]);

  // The Excel button always exports the per-engineer detail, regardless of
  // which view is showing — matches the old dashboard's export behavior.
  const handleExport = () => {
    exportRowsToExcel(rows, EXCEL_COLUMNS, "Engineer Utilization", "engineer_utilization");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_e, v) => v && setView(v)}>
          <ToggleButton value="engineer" sx={{ textTransform: "none", px: 1.5 }}>
            Engineer
          </ToggleButton>
          <ToggleButton value="function" sx={{ textTransform: "none", px: 1.5 }}>
            Function
          </ToggleButton>
        </ToggleButtonGroup>

        <Box
          component="button"
          onClick={handleExport}
          disabled={rows.length === 0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            background: "none",
            border: "1px solid",
            borderColor: "success.main",
            borderRadius: 1,
            cursor: rows.length === 0 ? "default" : "pointer",
            opacity: rows.length === 0 ? 0.5 : 1,
            color: "success.main",
            fontSize: "0.7rem",
            fontWeight: 700,
            px: 1.2,
            py: 0.6,
            "&:hover": { bgcolor: rows.length === 0 ? "transparent" : alpha(theme.palette.success.main, 0.08) },
          }}
        >
          <DownloadRoundedIcon sx={{ fontSize: 15 }} />
          Export to Excel
        </Box>
      </Box>

      {view === "engineer" ? (
        <EngineerUtilizationTable rows={rows} isLoading={isLoading} isError={isError} />
      ) : (
        <FunctionUtilizationTable rows={functionRows} isLoading={isLoading} isError={isError} />
      )}
    </Box>
  );
}
