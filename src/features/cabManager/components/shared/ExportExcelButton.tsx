import { Button, CircularProgress, type SxProps, type Theme } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useState } from "react";
import { toast } from "react-toastify";

interface ExportExcelButtonProps {
  /** Builds and saves the workbook — usually a call to exportRowsToExcel. */
  onExport: () => Promise<void>;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

/** The CAB screens' "Export Excel" button — same look as the CAB Sessions
 * agenda export, with its own busy state so each page only supplies the rows. */
export function ExportExcelButton({ onExport, disabled, sx }: ExportExcelButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleClick = async () => {
    setExporting(true);
    try {
      await onExport();
    } catch {
      toast.error("Failed to export Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <FileDownloadOutlinedIcon />}
      onClick={() => void handleClick()}
      disabled={exporting || disabled}
      sx={{ whiteSpace: "nowrap", flexShrink: 0, ...sx }}
    >
      {exporting ? "Exporting…" : "Export Excel"}
    </Button>
  );
}
