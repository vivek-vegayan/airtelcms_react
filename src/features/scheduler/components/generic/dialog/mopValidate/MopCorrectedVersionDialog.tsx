import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, IconButton, TextField, Typography, alpha } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { toast } from "react-toastify";
import { useUploadCorrectedMopVersionMutation } from "../../../../api/mopValidateApiSlice";
import { MOP_ACCEPT_ATTR } from "../../../../types/mopDocument.types";
import { formatBytes, validateMopFile } from "../mopCreate/mopFile";
import { ActionDialog, ActionFooter, Lbl, inputSx, outlineBtnSx } from "./mopUi";

/** `mop_version.note` is varchar(500). */
const NOTE_MAX = 500;

interface MopCorrectedVersionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after the new version is stored, before the dialog closes. */
  onUploaded?: () => void;
  crqNo: string;
  /** The rejected version this upload replaces. */
  rejectedVersionNo: number | null;
  /** The reviewer's rejection reason, shown so the fix can be checked against it. */
  rejectionReason: string | null;
  rejectedBy: string | null;
  colors: any;
}

/**
 * Uploads a corrected MOP file as the next version once the current one has
 * been rejected (`sp_mop_version_add`). The rejected version, its findings and
 * its document stay in the History tab; the new version starts at Pending
 * validation and is reviewed like any other.
 */
export const MopCorrectedVersionDialog: React.FC<MopCorrectedVersionDialogProps> = ({
  open,
  onClose,
  onUploaded,
  crqNo,
  rejectedVersionNo,
  rejectionReason,
  rejectedBy,
  colors,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [upload, { isLoading }] = useUploadCorrectedMopVersionMutation();

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setNote("");
    setError(null);
    setDragging(false);
  }, [open]);

  const nextNo = rejectedVersionNo != null ? rejectedVersionNo + 1 : null;

  const pick = (picked: File | undefined) => {
    if (!picked) return;
    const problem = validateMopFile(picked);
    setError(problem);
    setFile(problem ? null : picked);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    try {
      const result = await upload({ crqNo, file, note: note.trim() || undefined }).unwrap();
      toast.success(`v${result.versionNo ?? nextNo ?? ""} uploaded for ${crqNo}.`);
      onUploaded?.();
      onClose();
    } catch (e: any) {
      setError(e?.data?.message ?? "The corrected version could not be uploaded.");
    }
  };

  return (
    <ActionDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      colors={colors}
      kicker={rejectedVersionNo != null ? `Replaces rejected v${rejectedVersionNo}` : "Corrected version"}
      title={nextNo != null ? `Upload corrected version (v${nextNo})` : "Upload corrected version"}
      accent={colors.accent}
      icon={<UploadFileOutlinedIcon />}
    >
      {rejectionReason && (
        <Box
          sx={{
            mb: 2,
            p: 1.25,
            borderRadius: colors.radius,
            border: `1px solid ${alpha(colors.danger, 0.3)}`,
            bgcolor: alpha(colors.danger, 0.06),
          }}
        >
          <Lbl colors={colors}>Rejection reason{rejectedBy ? ` · ${rejectedBy}` : ""}</Lbl>
          <Typography sx={{ fontSize: 12.5, color: colors.textPrimary, lineHeight: 1.5 }}>
            {rejectionReason}
          </Typography>
        </Box>
      )}

      <Lbl colors={colors}>MOP document</Lbl>
      <input
        ref={inputRef}
        type="file"
        accept={MOP_ACCEPT_ATTR}
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {file ? (
        <Box
          sx={{
            mt: 0.5,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.25,
            borderRadius: colors.radius,
            border: `1px solid ${colors.accentBorder}`,
            bgcolor: colors.accentDim,
          }}
        >
          <UploadFileOutlinedIcon sx={{ fontSize: 20, color: colors.accent }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 700,
                color: colors.textPrimary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>{formatBytes(file.size)}</Typography>
          </Box>
          <IconButton size="small" onClick={clearFile} disabled={isLoading} aria-label="Remove file">
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ) : (
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          sx={{
            mt: 0.5,
            mb: 2,
            p: 2.5,
            textAlign: "center",
            borderRadius: colors.radius,
            border: `1px dashed ${dragging ? colors.accent : colors.border}`,
            bgcolor: dragging ? colors.accentDim : colors.surface2,
          }}
        >
          <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, mb: 1 }}>
            Drop the corrected PDF or Excel file here
          </Typography>
          <Button size="small" onClick={() => inputRef.current?.click()} sx={outlineBtnSx(colors, colors.accent)}>
            Choose file
          </Button>
        </Box>
      )}

      <Lbl colors={colors}>What changed (optional)</Lbl>
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={5}
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
        placeholder={
          rejectedVersionNo != null ? `Corrected version after v${rejectedVersionNo} was rejected` : undefined
        }
        helperText={`${note.length}/${NOTE_MAX}`}
        FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }}
        InputProps={{ sx: inputSx }}
        sx={{ mt: 0.5, mb: 1.5 }}
      />

      {error && (
        <Alert severity="error" sx={{ fontSize: 12.5, mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <ActionFooter
        colors={colors}
        confirmLabel={isLoading ? "Uploading…" : "Upload version"}
        confirmTone={colors.accent}
        confirmDisabled={!file}
        busy={isLoading}
        onConfirm={handleUpload}
        onCancel={onClose}
      />
    </ActionDialog>
  );
};

export default MopCorrectedVersionDialog;
