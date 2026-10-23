import { MOP_PDF_MAX_BYTES, type MopDocumentType } from "../../../../types/mopDocument.types";

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  // Whole megabytes read as limits ("up to 25 MB"), fractions as measurements
  // ("2.4 MB") - a "25.0 MB" ceiling looks like a measured value it isn't.
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
};

/** Extension-based, for a file the user just picked - the backend re-checks
 *  the actual magic bytes and is the authority. */
export const localKindOf = (file: File): MopDocumentType | null => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "PDF";
  if (name.endsWith(".xlsx")) return "XLSX";
  if (name.endsWith(".xls")) return "XLS";
  return null;
};

/**
 * Mirrors the backend's own guards so an obviously-bad file is rejected
 * without spending a round trip on it. The backend still re-checks both,
 * against the content rather than the name - this is a convenience, not the
 * enforcement point.
 */
export const validateMopFile = (file: File): string | null => {
  if (!localKindOf(file)) {
    return `"${file.name}" is not a PDF or Excel workbook. Upload the MOP as a .pdf, .xlsx or .xls file.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MOP_PDF_MAX_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MOP_PDF_MAX_BYTES)}.`;
  }
  return null;
};
