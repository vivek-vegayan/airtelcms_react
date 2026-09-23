import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Fade,
  Grow,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";

import { SlideUpTransition } from "../../../../../components/common/SlideUpTransition";
import type { Colors } from "../../../types/colorTypes";
import {
  InfoTile,
  StatusChip,
  StepSection,
  StepSkeleton,
  formatDateTime,
} from "../reschedule/RescheduleAtoms";
import { stageLabel } from "../reschedule/stageLabel";
import { crqStatusPalette } from "../../../constants/workflowStages";
import { useValidateForm } from "./useValidateForm";
import {
  ValidateTokenField,
  splitTokens,
  type TokenIssue,
} from "./ValidateTokenField";

/**
 * Shown as a persistent hint under each field: the procedure stores both
 * columns as free text, so the expected shape (comma-separated nodes,
 * `node$interface` for the pairs) only exists as a convention and has to be
 * spelled out for whoever is typing.
 */
const NODE_NAME_EXAMPLE = "HYD-T4-CR11.192,MUM-T5-CR11.15";
const NAME_INTERFACE_PAIR_EXAMPLE =
  "HYD-T4-CR11.192$TenGigE0/0/0/23,MUM-T5-CR11.15$HundGigE0/0/0/23";

/**
 * Saving here is not a private note on the CRQ - the two columns are read back
 * by the Plan & Inventory validation run and by Impact Analysis. That
 * consequence used to be invisible, so it is now spelled out on the way out.
 */
const SAVE_IMPACT_NOTE_LEAD = "This data will be used for";
/** The two consumers, highlighted in the danger tone inside the sentence. */
const SAVE_IMPACT_CONSUMERS = ["Plan & Inventory validation", "Impact Analysis"] as const;

/** Inline keycap, so the "press Enter / , / $" instruction reads as a key. */
const KeyHint: React.FC<{ colors: Colors; children: React.ReactNode }> = ({
  colors,
  children,
}) => (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      px: 0.6,
      mx: 0.15,
      borderRadius: "4px",
      border: `1px solid ${colors.border}`,
      bgcolor: colors.surface,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 10,
      fontWeight: 800,
      color: colors.textSecondary,
    }}
  >
    {children}
  </Box>
);

/** `HYD-T4-CR11.192$TenGigE0/0/0/23` -> node + interface halves. */
const splitPair = (token: string): { node: string; iface: string } => {
  const at = token.indexOf("$");
  if (at < 0) return { node: token.trim(), iface: "" };
  return { node: token.slice(0, at).trim(), iface: token.slice(at + 1).trim() };
};

/**
 * Live node -> interfaces roll-up under the two fields. The pair column is the
 * one people get wrong (a typo in the node half is invisible in a comma
 * string), so orphans - interfaces whose node is not in the node list - get
 * their own bucket instead of being left to spot by eye.
 */
const MappingPreview: React.FC<{
  nodes: string[];
  pairs: string[];
  colors: Colors;
}> = ({ nodes, pairs, colors }) => {
  const byNode = new Map<string, string[]>(nodes.map((node) => [node, []]));
  const orphans: string[] = [];

  pairs.forEach((token) => {
    const { node, iface } = splitPair(token);
    if (!iface) return;
    const bucket = byNode.get(node);
    if (bucket) bucket.push(iface);
    else orphans.push(token);
  });

  if (!nodes.length && !orphans.length) return null;

  return (
    <Box
      sx={{
        mt: 1.8,
        p: 1.4,
        borderRadius: colors.radius,
        border: `1px dashed ${colors.border}`,
        bgcolor: colors.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.012)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 1 }}>
        <AccountTreeRoundedIcon sx={{ fontSize: 13, color: colors.textDim }} />
        <Typography
          sx={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: colors.textDim,
          }}
        >
          Mapping preview
        </Typography>
      </Stack>

      <Stack spacing={0.9}>
        {nodes.map((node) => {
          const ifaces = byNode.get(node) ?? [];
          return (
            <Stack
              key={node}
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={0.8}
            >
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  color: colors.textPrimary,
                  width: { xs: "auto", sm: 190 },
                  flexShrink: 0,
                  wordBreak: "break-all",
                }}
              >
                {node}
              </Typography>
              {ifaces.length ? (
                <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
                  {ifaces.map((iface) => (
                    <Chip
                      key={iface}
                      size="small"
                      label={iface}
                      sx={{
                        height: 19,
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        color: colors.success,
                        bgcolor: colors.successDim,
                        border: `1px solid ${colors.successBorder}`,
                      }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: 10.5, fontStyle: "italic", color: colors.textDim }}>
                  no interface mapped yet
                </Typography>
              )}
            </Stack>
          );
        })}

        {orphans.length > 0 && (
          <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 0.5, pt: 0.4 }}>
            <Typography
              sx={{ fontSize: 10.5, fontWeight: 700, color: colors.warning, mr: 0.4 }}
            >
              Listed Post:
            </Typography>
            {orphans.map((token) => (
              <Chip
                key={token}
                size="small"
                label={token}
                sx={{
                  height: 19,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  color: colors.warning,
                  bgcolor: colors.warningDim,
                  border: `1px solid ${colors.warningBorder}`,
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

/**
 * Marker-pen treatment for the two consumers named in the note: danger tone on
 * a danger tint, so they read as the part of the sentence that carries risk.
 * `box-decoration-break: clone` keeps the tint square on both halves when the
 * sentence wraps mid-phrase.
 */
const highlightSx = (colors: Colors) => ({
  px: 0.6,
  py: 0.15,
  borderRadius: "5px",
  color: colors.danger,
  bgcolor: colors.dangerDim,
  border: `1px solid ${colors.dangerBorder}`,
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
  WebkitBoxDecorationBreak: "clone",
  boxDecorationBreak: "clone",
});

/**
 * The consequence notice for a save, and the loudest element in the
 * confirmation on purpose: one sentence, with the two runs that read these
 * rows back marked in the danger tone, so nobody saves a typo thinking it
 * stays local to the dialog. The pulse fires a few times and stops - it is a
 * nudge, not a siren.
 */
const SaveImpactCallout: React.FC<{ colors: Colors }> = ({ colors }) => (
  <Box
    sx={{
      position: "relative",
      overflow: "hidden",
      p: 1.8,
      pl: 2.2,
      borderRadius: colors.radiusL,
      border: `1px solid ${colors.accentBorder}`,
      bgcolor: colors.accentDim,
      "@keyframes validateNotePulse": {
        "0%": { boxShadow: `0 0 0 0 ${colors.accentBorder}` },
        "70%": { boxShadow: "0 0 0 9px rgba(0,0,0,0)" },
        "100%": { boxShadow: "0 0 0 0 rgba(0,0,0,0)" },
      },
    }}
  >
    <Box
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        bgcolor: colors.accent,
      }}
    />

    <Stack direction="row" spacing={1.3} alignItems="flex-start">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: colors.surface,
          border: `1px solid ${colors.accentBorder}`,
          animation: "validateNotePulse 2.2s ease-out 3",
        }}
      >
        <TipsAndUpdatesRoundedIcon sx={{ fontSize: 17, color: colors.accent }} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 800,
            lineHeight: 1.75,
            color: colors.textPrimary,
          }}
        >
          {SAVE_IMPACT_NOTE_LEAD}{" "}
          <Box component="span" sx={highlightSx(colors)}>
            {SAVE_IMPACT_CONSUMERS[0]}
          </Box>{" "}
          and{" "}
          <Box component="span" sx={highlightSx(colors)}>
            {SAVE_IMPACT_CONSUMERS[1]}
          </Box>
          .
        </Typography>
      </Box>
    </Stack>
  </Box>
);

export interface ValidateDialogProps {
  open: boolean;
  onClose: () => void;
  crqNo: string | null;
  colors: Colors;
  /** Fired after a successful save, so the cockpit can refresh if it needs to. */
  onSaved?: () => void;
  /**
   * The stage this was opened from is cancelled. The dialog still opens - the
   * validation details it reads are worth seeing - but every control that
   * writes ("Save") is dropped and the fields go inert.
   */
  readOnly?: boolean;
}

/**
 * Plan & Inventory (VALIDATE stage) "Validate" dialog.
 *
 * Read  -> get_crq_validation_details(crqNo)
 * Write -> update_validation_details(p_Crq_No, p_NodeName, p_NameInterfacePair)
 *
 * Deliberately owns no workflow logic: it never starts, pauses or advances a
 * stage. Current Stage / Validation Status are read-only header context taken
 * straight from CRQ_MASTER_TBL, so opening or saving here cannot move the CRQ.
 *
 * Field state, validation and the save call live in useValidateForm; this file
 * is layout only.
 */
export const ValidateDialog: React.FC<ValidateDialogProps> = ({
  open,
  onClose,
  crqNo,
  colors,
  onSaved,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  const form = useValidateForm(crqNo, open);
  const {
    details,
    values,
    errors,
    isLoading,
    isFetching,
    isSaving,
    loadError,
    saveError,
    isNeverValidated,
    isDirty,
    canSave,
  } = form;

  const closeAndReset = useCallback(() => {
    setConfirmSaveOpen(false);
    form.reset();
    onClose();
  }, [form, onClose]);

  /** Unsaved edits are worth one confirmation before they're thrown away. */
  const requestClose = useCallback(() => {
    if (isSaving) return;
    if (isDirty && !readOnly) {
      setConfirmDiscardOpen(true);
      return;
    }
    closeAndReset();
  }, [isSaving, isDirty, readOnly, closeAndReset]);

  /**
   * Save is a two-step now: the click opens the confirmation that states where
   * the data goes, and only its own button writes. Cheap to dismiss, and it is
   * the last moment the note can still change what gets stored.
   */
  const requestSave = useCallback(() => {
    if (!canSave) return;
    setConfirmSaveOpen(true);
  }, [canSave]);

  const handleSave = useCallback(async () => {
    const ok = await form.save();
    // On failure drop back to the form - saveError renders there, not here.
    setConfirmSaveOpen(false);
    if (!ok) return;
    onSaved?.();
    // Matches the rest of the cockpit's dialogs: a successful submit closes.
    closeAndReset();
  }, [form, onSaved, closeAndReset]);

  const nodeTokens = useMemo(() => splitTokens(values.nodeName), [values.nodeName]);
  const pairTokens = useMemo(
    () => splitTokens(values.nameInterfacePair),
    [values.nameInterfacePair],
  );

  /** Legal to save, but the one thing worth re-reading before it goes downstream. */
  const unmappedNodes = useMemo(
    () =>
      nodeTokens.filter(
        (node) => !pairTokens.some((pair) => splitPair(pair).node === node),
      ),
    [nodeTokens, pairTokens],
  );

  /**
   * A node with no interface mapped is legal, but almost always an oversight -
   * only worth flagging once the pair field has something in it, otherwise
   * every chip turns amber the moment it is typed.
   */
  const inspectNode = useCallback(
    (token: string): TokenIssue | undefined =>
      !pairTokens.length || pairTokens.some((pair) => splitPair(pair).node === token)
        ? undefined
        : { severity: "warning", message: "No interface mapped to this node yet." },
    [pairTokens],
  );

  /** The pair column is free text, so shape and node reference are checked here. */
  const inspectPair = useCallback(
    (token: string): TokenIssue | undefined => {
      const { node, iface } = splitPair(token);
      if (!node || !iface) {
        return {
          severity: "error",
          message: "Expected node$interface, e.g. HYD-T4-CR11.192$TenGigE0/0/0/23.",
        };
      }
      if (nodeTokens.length && !nodeTokens.includes(node)) {
        return { severity: "warning", message: `"${node}" is not listed under Node Name.` };
      }
      return undefined;
    },
    [nodeTokens],
  );

  const renderBody = () => {
    if (isLoading) return <StepSkeleton rows={4} />;

    if (loadError) {
      return (
        <Alert
          severity="error"
          variant="outlined"
          sx={{ fontSize: 12.5 }}
          action={
            <Button
              size="small"
              onClick={form.refetch}
              startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      );
    }

    if (!details) {
      return (
        <Alert severity="info" variant="outlined" sx={{ fontSize: 12.5 }}>
          No validation details available for this CRQ.
        </Alert>
      );
    }

    const statusPalette = crqStatusPalette(details.validationStatus, colors);

    return (
      <Fade in timeout={220}>
        <Box>
          {saveError && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2, fontSize: 12.5, py: 0.4 }}>
              {saveError}
            </Alert>
          )}

          {readOnly && (
            <Alert
              severity="warning"
              variant="outlined"
              icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
              sx={{ mb: 2, fontSize: 12.5, py: 0.4 }}
            >
              This CRQ's stage is cancelled — the validation details below are read-only.
            </Alert>
          )}

          {isNeverValidated && !readOnly && !saveError && (
            <Alert
              severity="info"
              variant="outlined"
              icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
              sx={{ mb: 2, fontSize: 12.5, py: 0.4 }}
            >
              This CRQ has not been validated yet — fill in the fields below to record its
              validation details.
            </Alert>
          )}

          {/* Header: identity + live workflow context, all read-only. */}
          <StepSection
            icon={<FactCheckRoundedIcon sx={{ fontSize: 14 }} />}
            title="CRQ"
            colors={colors}
          >
            <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <InfoTile label="CRQ Number" value={details.crqNo} colors={colors} mono />
              <InfoTile
                label="Current Stage"
                value={stageLabel(details.currentStage)}
                colors={colors}
                icon={<TimelineRoundedIcon sx={{ fontSize: 12 }} />}
                accent={colors.accent}
              />
              <InfoTile
                label="Validation Status"
                value={
                  details.validationStatus ? (
                    <StatusChip
                      label={statusPalette.label}
                      fg={statusPalette.fg}
                      bg={statusPalette.bg}
                      border={statusPalette.border}
                    />
                  ) : (
                    "—"
                  )
                }
                colors={colors}
              />
            </Stack>
          </StepSection>

          {/* Editable attributes - two columns on md+, stacked below. */}
          <StepSection
            icon={<HubRoundedIcon sx={{ fontSize: 14 }} />}
            title="Validation Details"
            colors={colors}
            action={
              details.updatedAt ? (
                <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: colors.textDim }}>
                  Last saved {formatDateTime(details.updatedAt)}
                </Typography>
              ) : undefined
            }
          >
            {!readOnly && (
              <Typography
                sx={{ fontSize: 11, color: colors.textDim, lineHeight: 1.65, mb: 1.4 }}
              >
                Type an entry and press <KeyHint colors={colors}>Enter</KeyHint> or{" "}
                <KeyHint colors={colors}>,</KeyHint> to add it. Pair a node with its
                interface using <KeyHint colors={colors}>$</KeyHint>.
              </Typography>
            )}

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.6}
              useFlexGap
              sx={{ alignItems: "flex-start" }}
            >
              <ValidateTokenField
                label="Node Name"
                colors={colors}
                value={values.nodeName}
                onChange={(next) => form.setValue("nodeName", next)}
                onBlur={() => form.touch("nodeName")}
                disabled={isSaving || readOnly}
                error={errors.nodeName}
                placeholder="HYD-T4-CR11.192"
                inspect={inspectNode}
                helper={`e.g. ${NODE_NAME_EXAMPLE}`}
              />
              <ValidateTokenField
                label="Node Interface Name"
                colors={colors}
                value={values.nameInterfacePair}
                onChange={(next) => form.setValue("nameInterfacePair", next)}
                onBlur={() => form.touch("nameInterfacePair")}
                disabled={isSaving || readOnly}
                error={errors.nameInterfacePair}
                placeholder="HYD-T4-CR11.192$TenGigE0/0/0/23"
                inspect={inspectPair}
                // quickInserts={nodeTokens.map((node) => `${node}$`)}
                // quickInsertLabel="From nodes:"
                helper={`e.g. ${NAME_INTERFACE_PAIR_EXAMPLE}`}
              />
            </Stack>

            <MappingPreview nodes={nodeTokens} pairs={pairTokens} colors={colors} />
          </StepSection>
        </Box>
      </Fade>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        maxWidth="md"
        fullWidth
        fullScreen={isSmall}
        TransitionComponent={SlideUpTransition}
        PaperProps={{
          elevation: 0,
          sx: {
            height: isSmall ? "100%" : "auto",
            maxHeight: isSmall ? "100%" : "90vh",
            borderRadius: isSmall ? 0 : colors.radiusXL,
            border: `1px solid ${colors.border}`,
            bgcolor: colors.bg,
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${colors.border}`,
            bgcolor: colors.surface,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: colors.radius,
                bgcolor: colors.accentDim,
                border: `1px solid ${colors.accentBorder}`,
              }}
            >
              <FactCheckRoundedIcon sx={{ fontSize: 18, color: colors.accent }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: colors.textPrimary }}>
                Sync Data Plan
              </Typography>
              <Typography
                sx={{
                  fontSize: 11.5,
                  color: colors.textDim,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
                noWrap
              >
                {details?.crqNo ?? crqNo ?? ""}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Reload validation details">
              <span>
                <IconButton
                  size="small"
                  onClick={form.refetch}
                  disabled={isSaving || isFetching || !crqNo}
                >
                  <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton size="small" onClick={requestClose} disabled={isSaving}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        {/* One indeterminate bar for whichever procedure is currently running. */}
        <Box sx={{ height: 3, bgcolor: colors.surface }}>
          {(isFetching || isSaving) && <LinearProgress sx={{ height: 3 }} />}
        </Box>

        <DialogContent
          dividers
          sx={{ px: 2.5, py: 2, bgcolor: colors.bg, borderColor: colors.border }}
        >
          {renderBody()}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: colors.surface, gap: 1 }}>
          <Button
            onClick={requestClose}
            disabled={isSaving}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>
          <Box sx={{ flex: 1 }} />
          {/* Live count of what is about to be saved, plus an unsaved-edits dot -
              the footer used to give no reading of the form's state at all. */}
          {!!details && (
            <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mr: 0.5 }}>
              {isDirty && (
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: colors.warning,
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textDim }} noWrap>
                {isDirty ? "Unsaved · " : ""}
                {nodeTokens.length} {nodeTokens.length === 1 ? "node" : "nodes"} ·{" "}
                {pairTokens.length} {pairTokens.length === 1 ? "interface" : "interfaces"}
              </Typography>
            </Stack>
          )}
          {!readOnly && (
          <Tooltip
            title={
              !canSave && !isSaving && !isFetching
                ? isDirty
                  ? "Fix the highlighted fields to save."
                  : "No changes to save yet."
                : ""
            }
          >
            <span>
              <Button
                variant="contained"
                onClick={requestSave}
                disabled={!canSave}
                startIcon={
                  isSaving ? (
                    <CircularProgress size={15} color="inherit" />
                  ) : (
                    <SaveRoundedIcon sx={{ fontSize: 17 }} />
                  )
                }
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 2.2 }}
              >
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </span>
          </Tooltip>
          )}
        </DialogActions>
      </Dialog>

      {/* Save confirmation: states where the data lands, then writes. */}
      <Dialog
        open={confirmSaveOpen}
        onClose={() => {
          if (!isSaving) setConfirmSaveOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Grow}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: colors.radiusXL,
            border: `1px solid ${colors.border}`,
            bgcolor: colors.bg,
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.1}>
            <SaveRoundedIcon sx={{ fontSize: 18, color: colors.accent }} />
            <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: colors.textPrimary }}>
              Save validation details?
            </Typography>
          </Stack>
        </DialogTitle>

        <Box sx={{ height: 3, bgcolor: colors.surface }}>
          {isSaving && <LinearProgress sx={{ height: 3 }} />}
        </Box>

        <DialogContent sx={{ px: 2.5, py: 2, bgcolor: colors.bg }}>
          <SaveImpactCallout colors={colors} />

          <Divider sx={{ my: 1.8, borderColor: colors.border }} />

          <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
            <InfoTile
              label="CRQ Number"
              value={details?.crqNo ?? crqNo ?? "—"}
              colors={colors}
              mono
            />
            <InfoTile
              label="Nodes"
              value={String(nodeTokens.length)}
              colors={colors}
              icon={<AccountTreeRoundedIcon sx={{ fontSize: 12 }} />}
            />
            <InfoTile
              label="Interfaces"
              value={String(pairTokens.length)}
              colors={colors}
              icon={<HubRoundedIcon sx={{ fontSize: 12 }} />}
            />
          </Stack>

          {unmappedNodes.length > 0 && (
            <Alert
              severity="warning"
              variant="outlined"
              icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
              sx={{ mt: 1.6, fontSize: 12, py: 0.2 }}
            >
              {unmappedNodes.length}{" "}
              {unmappedNodes.length === 1 ? "node has" : "nodes have"} no interface mapped
              ({unmappedNodes.join(", ")}). Saving is still allowed — anything unmapped simply
              carries no interface downstream.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: colors.surface, gap: 1 }}>
          <Button
            onClick={() => setConfirmSaveOpen(false)}
            disabled={isSaving}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            Back to editing
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={
              isSaving ? (
                <CircularProgress size={15} color="inherit" />
              ) : (
                <SaveRoundedIcon sx={{ fontSize: 17 }} />
              )
            }
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 2.2 }}
          >
            {isSaving ? "Saving…" : "Confirm & Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDiscardOpen} onClose={() => setConfirmDiscardOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ fontSize: 15, fontWeight: 800 }}>Discard your changes?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            Node Name and Node Interface Name have unsaved edits. Closing now leaves the saved
            values unchanged.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            onClick={() => setConfirmDiscardOpen(false)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Keep editing
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setConfirmDiscardOpen(false);
              closeAndReset();
            }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ValidateDialog;
