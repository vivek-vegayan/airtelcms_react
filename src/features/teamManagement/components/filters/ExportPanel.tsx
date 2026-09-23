import { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Checkbox,
  FormControlLabel,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Popover,
  IconButton,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useExport } from "../../hooks/useExport";
// import { useExport } from "../../../../hooks/useExport";

/* ── Column label → EmployeeDto key map ── */
export const COLUMN_KEY_MAP: Record<string, string> = {
  "OLM ID":          "olmId",
  "Employee Name":   "employeeName",
  "Email ID":        "emailId",
  "Mobile No":       "mobileNo",
  "Employment Type": "employmentType",
  "Designation":     "designation",
  "Job Level":       "jobLevel",
  "Office Location": "officeLocation",
  "Device Vendor":   "deviceVendorCapability",
  "Date of Joining": "dateOfJoining",
  "Role Code":       "roleCode",
};

const ALL_COLUMNS = Object.keys(COLUMN_KEY_MAP);

const FORMAT_CONFIG = {
  excel: {
    label: "Excel",
    ext: ".xlsx",
    icon: <TableChartIcon sx={{ fontSize: 18 }} />,
    color: "#27500A",
    bg: "#EAF3DE",
    btnBg: "#27500A",
  },
  pdf: {
    label: "PDF",
    ext: ".pdf",
    icon: <PictureAsPdfIcon sx={{ fontSize: 18 }} />,
    color: "#712B13",
    bg: "#FAECE7",
    btnBg: "#712B13",
  },
  csv: {
    label: "CSV",
    ext: ".csv",
    icon: <GridOnIcon sx={{ fontSize: 18 }} />,
    color: "#185FA5",
    bg: "#E6F1FB",
    btnBg: "#185FA5",
  },
};

/* ── Props ── */
interface ExportPanelProps {
  filteredRows: Record<string, any>[];
  totalRowCount: number;
  currentPageSize: number;
}

export const ExportPanel = ({
  filteredRows,
  totalRowCount,
  currentPageSize,
}: ExportPanelProps) => {
  const { exportData } = useExport();

  const [anchorEl, setAnchorEl]     = useState<HTMLElement | null>(null);
  const [format, setFormat]         = useState<"excel" | "pdf" | "csv">("excel");
  const [scope, setScope]           = useState<"current" | "all">("current");
  const [columns, setColumns]       = useState<Set<string>>(new Set(ALL_COLUMNS));
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [orientation, setOrientation] =
    useState<"landscape" | "portrait">("landscape");

  /* ── Scope options built from live counts ── */
  const scopeOptions = [
    {
      key: "current" as const,
      label: "Current page",
      rows: Math.min(currentPageSize, filteredRows.length),
    },
    {
      key: "all" as const,
      label: "All filtered",
      rows: filteredRows.length,
    },
  ];

  const scopeRows = scopeOptions.find((s) => s.key === scope)?.rows ?? 0;
  const fmt = FORMAT_CONFIG[format];

  /* ── Helpers ── */
  const getScopedRows = () =>
    scope === "current"
      ? filteredRows.slice(0, currentPageSize)
      : filteredRows;

  const toggleCol = (col: string) =>
    setColumns((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });

  const toggleAll = () =>
    setColumns(
      columns.size === ALL_COLUMNS.length ? new Set() : new Set(ALL_COLUMNS),
    );

  /* ── Export ── */
  const handleExport = async () => {
    setLoading(true);
    try {
      await exportData({
        format,
        rows: getScopedRows(),
        selectedColumns: [...columns],
        orientation,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Export data">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            border: "0.5px solid",
            borderColor: "divider",
            borderRadius: "8px",
            width: 36,
            height: 36,
          }}
        >
          <DownloadIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1,
              width: 560,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "14px",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "8px",
              bgcolor: "#EEEDFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DownloadIcon sx={{ fontSize: 16, color: "#534AB7" }} />
          </Box>
          <Box flex={1}>
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}
            >
              Export data
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Choose format, scope & columns
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1.5, py: 0.5, borderRadius: "6px",
              bgcolor: fmt.bg, display: "flex", alignItems: "center", gap: 0.5,
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: fmt.color }}>
              {scopeRows} rows · {columns.size} cols
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", bgcolor: "grey.50" }}>
          {/* ── LEFT PANEL ── */}
          <Box
            sx={{
              flex: 1, p: 2.5,
              borderRight: "1px solid", borderColor: "divider",
              display: "flex", flexDirection: "column", gap: 2.5,
            }}
          >
            {/* Format */}
            <Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary",
                  letterSpacing: "0.06em", mb: 1 }}
              >
                FORMAT
              </Typography>
              <Stack spacing={0.75}>
                {(Object.keys(FORMAT_CONFIG) as Array<keyof typeof FORMAT_CONFIG>).map((f) => {
                  const c = FORMAT_CONFIG[f];
                  const active = format === f;
                  return (
                    <Box
                      key={f}
                      onClick={() => setFormat(f)}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.25,
                        p: "10px 12px", borderRadius: "8px", cursor: "pointer",
                        border: active ? `1.5px solid ${c.color}` : "0.5px solid",
                        borderColor: active ? c.color : "divider",
                        bgcolor: active ? c.bg : "background.paper",
                        transition: "all .15s",
                        "&:hover": { bgcolor: active ? c.bg : "background.default" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 30, height: 30, borderRadius: "6px",
                          bgcolor: c.bg, display: "flex", alignItems: "center",
                          justifyContent: "center", color: c.color, flexShrink: 0,
                        }}
                      >
                        {c.icon}
                      </Box>
                      <Box flex={1}>
                        <Typography
                          sx={{ fontSize: 12, fontWeight: 600,
                            color: active ? c.color : "text.primary", lineHeight: 1.2 }}
                        >
                          {c.label}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                          {c.ext}
                          {f === "excel"
                            ? " · formatted with colors"
                            : f === "pdf"
                              ? " · print-ready"
                              : " · raw data"}
                        </Typography>
                      </Box>
                      {active && <CheckCircleIcon sx={{ fontSize: 16, color: c.color }} />}
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* PDF orientation */}
            {format === "pdf" && (
              <Box>
                <Typography
                  sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary",
                    letterSpacing: "0.06em", mb: 1 }}
                >
                  ORIENTATION
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={orientation}
                  onChange={(_, v) => v && setOrientation(v)}
                  fullWidth
                  size="small"
                >
                  <ToggleButton value="landscape" sx={{ textTransform: "none", fontSize: 12 }}>
                    Landscape
                  </ToggleButton>
                  <ToggleButton value="portrait" sx={{ textTransform: "none", fontSize: 12 }}>
                    Portrait
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Scope */}
            <Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary",
                  letterSpacing: "0.06em", mb: 1 }}
              >
                SCOPE
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {scopeOptions.map((s) => (
                  <Chip
                    key={s.key}
                    label={`${s.label} (${s.rows})`}
                    size="small"
                    onClick={() => setScope(s.key)}
                    sx={{
                      fontSize: 11, fontWeight: 500, borderRadius: "20px",
                      bgcolor: scope === s.key ? "#EEEDFE" : "background.paper",
                      color: scope === s.key ? "#3C3489" : "text.secondary",
                      border: scope === s.key ? "1.5px solid #AFA9EC" : "0.5px solid",
                      borderColor: scope === s.key ? "#AFA9EC" : "divider",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* ── RIGHT PANEL: columns ── */}
          <Box sx={{ width: 200, p: 2, display: "flex", flexDirection: "column" }}>
            <Box
              sx={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", mb: 1 }}
            >
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary",
                  letterSpacing: "0.06em" }}
              >
                COLUMNS
              </Typography>
              <Typography
                onClick={toggleAll}
                sx={{ fontSize: 11, color: "primary.main", cursor: "pointer",
                  fontWeight: 500, "&:hover": { textDecoration: "underline" } }}
              >
                {columns.size === ALL_COLUMNS.length ? "Deselect all" : "Select all"}
              </Typography>
            </Box>
            <Stack spacing={0.25} flex={1}>
              {ALL_COLUMNS.map((col) => (
                <FormControlLabel
                  key={col}
                  control={
                    <Checkbox
                      size="small"
                      checked={columns.has(col)}
                      onChange={() => toggleCol(col)}
                      sx={{ p: 0.5, "& .MuiSvgIcon-root": { fontSize: 15 } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: 12, color: "text.primary" }}>
                      {col}
                    </Typography>
                  }
                  sx={{
                    m: 0, px: 0.5, py: 0.25, borderRadius: "5px",
                    "&:hover": { bgcolor: "background.default" },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: 2.5, py: 2, borderTop: "1px solid", borderColor: "divider",
            bgcolor: "background.paper", display: "flex", alignItems: "center", gap: 1.5,
          }}
        >
          {success ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1 }}>
              <CheckCircleIcon sx={{ fontSize: 15, color: "success.main" }} />
              <Typography sx={{ fontSize: 12, color: "success.main", fontWeight: 500 }}>
                Export started — {scopeRows} rows · {columns.size} columns
              </Typography>
            </Box>
          ) : (
            <Box flex={1} />
          )}

          <Button
            variant="outlined"
            size="small"
            onClick={() => setAnchorEl(null)}
            sx={{ textTransform: "none", borderRadius: "8px", fontSize: 13 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={loading || columns.size === 0}
            onClick={handleExport}
            disableElevation
            startIcon={loading ? undefined : <DownloadIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none", borderRadius: "8px", fontWeight: 600,
              fontSize: 13, minWidth: 140, px: 2.5,
              bgcolor: fmt.btnBg,
              "&:hover": { bgcolor: fmt.btnBg, filter: "brightness(0.9)" },
            }}
          >
            {loading ? "Preparing…" : `Download ${fmt.label}`}
          </Button>
        </Box>
      </Popover>
    </>
  );
};

// // ExportPanel.tsx
// import { useState } from "react";
// import {
//   Box,
//   Typography,
//   Stack,
//   Chip,
//   Checkbox,
//   FormControlLabel,
//   Button,
//   Divider,
//   ToggleButton,
//   ToggleButtonGroup,
//   Popover,
//   IconButton,
//   Tooltip,
//   Badge,
// } from "@mui/material";
// import DownloadIcon from "@mui/icons-material/Download";
// import TableChartIcon from "@mui/icons-material/TableChart";
// import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
// import GridOnIcon from "@mui/icons-material/GridOn";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// const ALL_COLUMNS = [
//   "OLM ID",
//   "Employee Name",
//   "Email ID",
//   "Mobile No",
//   "Employment Type",
//   "Designation",
//   "Job Level",
//   "Office Location",
//   "Device Vendor",
//   "Date of Joining",
//   "Role Code",
// ];

// const SCOPE_OPTIONS = [
//   { key: "current", label: "Current page", rows: 14 },
//   { key: "all", label: "All records", rows: 19 },
//   { key: "active", label: "Active only", rows: 15 },
//   { key: "inactive", label: "Inactive only", rows: 4 },
// ] as const;

// const FORMAT_CONFIG = {
//   excel: {
//     label: "Excel",
//     ext: ".xlsx",
//     icon: <TableChartIcon sx={{ fontSize: 18 }} />,
//     color: "#27500A",
//     bg: "#EAF3DE",
//     btnBg: "#27500A",
//   },
//   pdf: {
//     label: "PDF",
//     ext: ".pdf",
//     icon: <PictureAsPdfIcon sx={{ fontSize: 18 }} />,
//     color: "#712B13",
//     bg: "#FAECE7",
//     btnBg: "#712B13",
//   },
//   csv: {
//     label: "CSV",
//     ext: ".csv",
//     icon: <GridOnIcon sx={{ fontSize: 18 }} />,
//     color: "#185FA5",
//     bg: "#E6F1FB",
//     btnBg: "#185FA5",
//   },
// };

// interface ExportPanelProps {
//   onExport: (config: {
//     format: string;
//     scope: string;
//     columns: string[];
//   }) => void;
// }

// export const ExportPanel = ({ onExport }: ExportPanelProps) => {
//   const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
//   const [format, setFormat] = useState<"excel" | "pdf" | "csv">("excel");
//   const [scope, setScope] = useState<string>("current");
//   const [columns, setColumns] = useState<Set<string>>(new Set(ALL_COLUMNS));
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [orientation, setOrientation] = useState<"landscape" | "portrait">(
//     "landscape",
//   );

//   const scopeRows = SCOPE_OPTIONS.find((s) => s.key === scope)?.rows ?? 0;
//   const fmt = FORMAT_CONFIG[format];

//   const toggleCol = (col: string) => {
//     setColumns((prev) => {
//       const next = new Set(prev);
//       next.has(col) ? next.delete(col) : next.add(col);
//       return next;
//     });
//   };

//   const toggleAll = () => {
//     setColumns(
//       columns.size === ALL_COLUMNS.length ? new Set() : new Set(ALL_COLUMNS),
//     );
//   };

//   const handleExport = async () => {
//     setLoading(true);
//     await new Promise((r) => setTimeout(r, 1200));
//     onExport({ format, scope, columns: [...columns] });
//     setLoading(false);
//     setSuccess(true);
//     setTimeout(() => setSuccess(false), 3500);
//   };

//   return (
//     <>
//       <Tooltip title="Export data">
//         <IconButton
//           onClick={(e) => setAnchorEl(e.currentTarget)}
//           sx={{
//             border: "0.5px solid",
//             borderColor: "divider",
//             borderRadius: "8px",
//             width: 36,
//             height: 36,
//           }}
//         >
//           <DownloadIcon sx={{ fontSize: 18 }} />
//         </IconButton>
//       </Tooltip>

//       <Popover
//         open={Boolean(anchorEl)}
//         anchorEl={anchorEl}
//         onClose={() => setAnchorEl(null)}
//         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//         transformOrigin={{ vertical: "top", horizontal: "right" }}
//         slotProps={{
//           paper: {
//             elevation: 0,
//             sx: {
//               mt: 1,
//               width: 560,
//               border: "1px solid",
//               borderColor: "divider",
//               borderRadius: "14px",
//               overflow: "hidden",
//             },
//           },
//         }}
//       >
//         {/* ── Header ── */}
//         <Box
//           sx={{
//             px: 2.5,
//             py: 2,
//             borderBottom: "1px solid",
//             borderColor: "divider",
//             display: "flex",
//             alignItems: "center",
//             gap: 1.5,
//           }}
//         >
//           <Box
//             sx={{
//               width: 30,
//               height: 30,
//               borderRadius: "8px",
//               bgcolor: "#EEEDFE",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <DownloadIcon sx={{ fontSize: 16, color: "#534AB7" }} />
//           </Box>
//           <Box flex={1}>
//             <Typography
//               sx={{
//                 fontSize: 13,
//                 fontWeight: 600,
//                 color: "text.primary",
//                 lineHeight: 1.2,
//               }}
//             >
//               Export data
//             </Typography>
//             <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
//               Choose format, scope & columns
//             </Typography>
//           </Box>
//           <Box
//             sx={{
//               px: 1.5,
//               py: 0.5,
//               borderRadius: "6px",
//               bgcolor: fmt.bg,
//               display: "flex",
//               alignItems: "center",
//               gap: 0.5,
//             }}
//           >
//             <Typography
//               sx={{ fontSize: 11, fontWeight: 600, color: fmt.color }}
//             >
//               {scopeRows} rows · {columns.size} cols
//             </Typography>
//           </Box>
//         </Box>

//         <Box sx={{ display: "flex", bgcolor: "grey.50" }}>
//           {/* ── LEFT PANEL ── */}
//           <Box
//             sx={{
//               flex: 1,
//               p: 2.5,
//               borderRight: "1px solid",
//               borderColor: "divider",
//               display: "flex",
//               flexDirection: "column",
//               gap: 2.5,
//             }}
//           >
//             {/* Format */}
//             <Box>
//               <Typography
//                 sx={{
//                   fontSize: 11,
//                   fontWeight: 600,
//                   color: "text.secondary",
//                   letterSpacing: "0.06em",
//                   mb: 1,
//                 }}
//               >
//                 FORMAT
//               </Typography>
//               <Stack spacing={0.75}>
//                 {(
//                   Object.keys(FORMAT_CONFIG) as Array<
//                     keyof typeof FORMAT_CONFIG
//                   >
//                 ).map((f) => {
//                   const c = FORMAT_CONFIG[f];
//                   const active = format === f;
//                   return (
//                     <Box
//                       key={f}
//                       onClick={() => setFormat(f)}
//                       sx={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 1.25,
//                         p: "10px 12px",
//                         borderRadius: "8px",
//                         cursor: "pointer",
//                         border: active
//                           ? `1.5px solid ${c.color}`
//                           : "0.5px solid",
//                         borderColor: active ? c.color : "divider",
//                         bgcolor: active ? c.bg : "background.paper",
//                         transition: "all .15s",
//                         "&:hover": {
//                           bgcolor: active ? c.bg : "background.default",
//                         },
//                       }}
//                     >
//                       <Box
//                         sx={{
//                           width: 30,
//                           height: 30,
//                           borderRadius: "6px",
//                           bgcolor: c.bg,
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           color: c.color,
//                           flexShrink: 0,
//                         }}
//                       >
//                         {c.icon}
//                       </Box>
//                       <Box flex={1}>
//                         <Typography
//                           sx={{
//                             fontSize: 12,
//                             fontWeight: 600,
//                             color: active ? c.color : "text.primary",
//                             lineHeight: 1.2,
//                           }}
//                         >
//                           {c.label}
//                         </Typography>
//                         <Typography
//                           sx={{ fontSize: 11, color: "text.secondary" }}
//                         >
//                           {c.ext}
//                           {f === "excel"
//                             ? " · formatted with colors"
//                             : f === "pdf"
//                               ? " · print-ready"
//                               : " · raw data"}
//                         </Typography>
//                       </Box>
//                       {active && (
//                         <CheckCircleIcon
//                           sx={{ fontSize: 16, color: c.color }}
//                         />
//                       )}
//                     </Box>
//                   );
//                 })}
//               </Stack>
//             </Box>

//             {/* PDF orientation */}
//             {format === "pdf" && (
//               <Box>
//                 <Typography
//                   sx={{
//                     fontSize: 11,
//                     fontWeight: 600,
//                     color: "text.secondary",
//                     letterSpacing: "0.06em",
//                     mb: 1,
//                   }}
//                 >
//                   ORIENTATION
//                 </Typography>
//                 <ToggleButtonGroup
//                   exclusive
//                   value={orientation}
//                   onChange={(_, v) => v && setOrientation(v)}
//                   fullWidth
//                   size="small"
//                 >
//                   <ToggleButton
//                     value="landscape"
//                     sx={{ textTransform: "none", fontSize: 12 }}
//                   >
//                     Landscape
//                   </ToggleButton>
//                   <ToggleButton
//                     value="portrait"
//                     sx={{ textTransform: "none", fontSize: 12 }}
//                   >
//                     Portrait
//                   </ToggleButton>
//                 </ToggleButtonGroup>
//               </Box>
//             )}

//             {/* Scope */}
//             <Box>
//               <Typography
//                 sx={{
//                   fontSize: 11,
//                   fontWeight: 600,
//                   color: "text.secondary",
//                   letterSpacing: "0.06em",
//                   mb: 1,
//                 }}
//               >
//                 SCOPE
//               </Typography>
//               <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
//                 {SCOPE_OPTIONS.map((s) => (
//                   <Chip
//                     key={s.key}
//                     label={`${s.label} (${s.rows})`}
//                     size="small"
//                     onClick={() => setScope(s.key)}
//                     sx={{
//                       fontSize: 11,
//                       fontWeight: 500,
//                       borderRadius: "20px",
//                       bgcolor: scope === s.key ? "#EEEDFE" : "background.paper",
//                       color: scope === s.key ? "#3C3489" : "text.secondary",
//                       border:
//                         scope === s.key ? "1.5px solid #AFA9EC" : "0.5px solid",
//                       borderColor: scope === s.key ? "#AFA9EC" : "divider",
//                       cursor: "pointer",
//                     }}
//                   />
//                 ))}
//               </Box>
//             </Box>
//           </Box>

//           {/* ── RIGHT PANEL: columns ── */}
//           <Box
//             sx={{ width: 200, p: 2, display: "flex", flexDirection: "column" }}
//           >
//             <Box
//               sx={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 mb: 1,
//               }}
//             >
//               <Typography
//                 sx={{
//                   fontSize: 11,
//                   fontWeight: 600,
//                   color: "text.secondary",
//                   letterSpacing: "0.06em",
//                 }}
//               >
//                 COLUMNS
//               </Typography>
//               <Typography
//                 onClick={toggleAll}
//                 sx={{
//                   fontSize: 11,
//                   color: "primary.main",
//                   cursor: "pointer",
//                   fontWeight: 500,
//                   "&:hover": { textDecoration: "underline" },
//                 }}
//               >
//                 {columns.size === ALL_COLUMNS.length
//                   ? "Deselect all"
//                   : "Select all"}
//               </Typography>
//             </Box>
//             <Stack spacing={0.25} flex={1}>
//               {ALL_COLUMNS.map((col) => (
//                 <FormControlLabel
//                   key={col}
//                   control={
//                     <Checkbox
//                       size="small"
//                       checked={columns.has(col)}
//                       onChange={() => toggleCol(col)}
//                       sx={{ p: 0.5, "& .MuiSvgIcon-root": { fontSize: 15 } }}
//                     />
//                   }
//                   label={
//                     <Typography sx={{ fontSize: 12, color: "text.primary" }}>
//                       {col}
//                     </Typography>
//                   }
//                   sx={{
//                     m: 0,
//                     px: 0.5,
//                     py: 0.25,
//                     borderRadius: "5px",
//                     "&:hover": { bgcolor: "background.default" },
//                   }}
//                 />
//               ))}
//             </Stack>
//           </Box>
//         </Box>

//         {/* ── Footer ── */}
//         <Box
//           sx={{
//             px: 2.5,
//             py: 2,
//             borderTop: "1px solid",
//             borderColor: "divider",
//             bgcolor: "background.paper",
//             display: "flex",
//             alignItems: "center",
//             gap: 1.5,
//           }}
//         >
//           {success && (
//             <Box
//               sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1 }}
//             >
//               <CheckCircleIcon sx={{ fontSize: 15, color: "success.main" }} />
//               <Typography
//                 sx={{ fontSize: 12, color: "success.main", fontWeight: 500 }}
//               >
//                 Export started — {scopeRows} rows · {columns.size} columns
//               </Typography>
//             </Box>
//           )}
//           {!success && <Box flex={1} />}

//           <Button
//             variant="outlined"
//             size="small"
//             onClick={() => setAnchorEl(null)}
//             sx={{ textTransform: "none", borderRadius: "8px", fontSize: 13 }}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="contained"
//             size="small"
//             disabled={loading || columns.size === 0}
//             onClick={handleExport}
//             disableElevation
//             startIcon={
//               loading ? undefined : <DownloadIcon sx={{ fontSize: 16 }} />
//             }
//             sx={{
//               textTransform: "none",
//               borderRadius: "8px",
//               fontWeight: 600,
//               fontSize: 13,
//               minWidth: 140,
//               px: 2.5,
//               bgcolor: fmt.btnBg,
//               "&:hover": { bgcolor: fmt.btnBg, filter: "brightness(0.9)" },
//             }}
//           >
//             {loading ? "Preparing…" : `Download ${fmt.label}`}
//           </Button>
//         </Box>
//       </Popover>
//     </>
//   );
// };
