import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { toast } from "react-toastify";
import { MopDetailsStrip } from "./MopDetailsStrip";
import { MopDocumentUploader } from "./MopDocumentUploader";
import {
  useCreateMopMutation,
  useGetMopCreateDetailsQuery,
} from "../../../../api/mopDocumentApiSlice";

interface MopCreateDocumentPanelProps {
  crqNo: string | null;
  /** Cancelled / already-Done / view-only - the panel stays readable and the
   *  stored document still previewable, but nothing may be uploaded. */
  readOnly: boolean;
  colors: any;
}

/**
 * Right-hand pane of the MOP Create stage dialog - the CRQ's MOP header and
 * its document, sitting beside the existing "MOP Create Action" outcome form.
 *
 * Sized to its container rather than to its content: a fixed-height details
 * strip and action row, then a body that takes the rest. Everything is in one
 * view at any window height, and the panel itself never scrolls - only the
 * embedded document does. Nothing here measures its own height, so it can't
 * feed the app shell's scrollbar oscillation (see `useAutoFitScale`'s notes).
 *
 * Two separate things live behind this panel and they are easy to confuse:
 *
 *  - the MOP *record* (`mop` / `mop_version` / `mop_file`), created once by
 *    `SP_GET_MOP_DETAILS_BY_CRQN` - a create despite its name, which refuses a
 *    second call - and surfaced here as the Create MOP banner;
 *  - the MOP *document* itself in `CRQ_PDF_TBL`, uploaded and read through
 *    `SP_STORE_CRQ_MOP_CREATE_PDF` / `SP_GET_CRQ_MOP_CREATE_PDF`, which is
 *    keyed on the CRQ alone and so works either way.
 */
export const MopCreateDocumentPanel: React.FC<MopCreateDocumentPanelProps> = ({
  crqNo,
  readOnly,
  colors,
}) => {
  const { data, isLoading, isError } = useGetMopCreateDetailsQuery(crqNo as string, {
    skip: !crqNo,
  });

  const [createMop, { isLoading: isCreating }] = useCreateMopMutation();
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!crqNo) return;
    setCreateError(null);
    try {
      await createMop(crqNo).unwrap();
      toast.success(`MOP created for ${crqNo}.`);
    } catch (e: any) {
      // The backend translates the procedure's SIGNAL text into a 400 with the
      // real reason ("A MOP already exists for this CRQ"), so it is worth
      // showing rather than a generic failure.
      setCreateError(e?.data?.message ?? "The MOP could not be created.");
    }
  };

  if (!crqNo) {
    return (
      <Alert severity="info" sx={{ fontSize: 13, m: 2 }}>
        Select a CRQ to see its MOP document.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        height: "100%",
        minHeight: 0,
        p: 2,
        // Capped so six short values and a document don't stretch across a
        // 1600px monitor; it still fills anything narrower.
        maxWidth: 1100,
      }}
    >
      {isError ? (
        <Alert severity="warning" sx={{ fontSize: 12.5, flexShrink: 0 }}>
          The MOP header for {crqNo} could not be loaded. The document below can still be uploaded.
        </Alert>
      ) : (
        <MopDetailsStrip details={data} loading={isLoading} colors={colors} />
      )}

      {/* The MOP record has not been created yet, so the header above has
          nothing but the CRQ number to show. Creating it is a deliberate,
          one-time action: the procedure behind it writes the `mop` row and
          refuses to run twice. */}
      {!isLoading && !isError && data && !data.mopExists && (
        <Alert
          severity="info"
          sx={{ fontSize: 12.5, flexShrink: 0, alignItems: "center" }}
          action={
            <Button
              size="small"
              variant="contained"
              onClick={handleCreate}
              disabled={readOnly || isCreating}
              startIcon={
                isCreating ? (
                  <CircularProgress size={13} color="inherit" />
                ) : (
                  <AddCircleOutlineIcon sx={{ fontSize: "16px !important" }} />
                )
              }
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5, whiteSpace: "nowrap" }}
            >
              {isCreating ? "Creating…" : "Create MOP"}
            </Button>
          }
        >
          No MOP has been created for {crqNo} yet. Creating it pulls the title, change window,
          region and vendor off the CRQ.
        </Alert>
      )}

      {createError && (
        <Alert
          severity="error"
          sx={{ fontSize: 12.5, py: 0.25, flexShrink: 0 }}
          onClose={() => setCreateError(null)}
        >
          {createError}
        </Alert>
      )}

      <MopDocumentUploader
        crqNo={crqNo}
        attached={Boolean(data?.documentAttached)}
        documentType={data?.documentType ?? null}
        readOnly={readOnly}
        colors={colors}
      />
    </Box>
  );
};

export default MopCreateDocumentPanel;
