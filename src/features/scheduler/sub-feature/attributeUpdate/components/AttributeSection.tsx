import React, { useMemo } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import {
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import type { Colors } from "../../../types/colorTypes";
import type {
  ResolvedAttribute,
  TargetSystem,
} from "../types/attributeUpdate.types";
import type { AttributeFormValues } from "../utils/attributeUpdate.utils";
import { SYSTEM_ACCENT, SYSTEM_SECTIONS } from "../constants/attributeUpdate.constants";
import { AttributeRow } from "./AttributeRow";

interface AttributeSectionProps {
  system: TargetSystem;
  attributes: ResolvedAttribute[];
  /** Backend-set Planning Tool fields, rendered in a dimmed sub-section. */
  backendAttributes?: ResolvedAttribute[];
  control: Control<AttributeFormValues>;
  /** Forwarded to AttributeRow so a cascade parent can clear the levels below it. */
  setValue?: UseFormSetValue<AttributeFormValues>;
  errors: FieldErrors<AttributeFormValues>;
  /** History/completed stage cards: every row renders read-only regardless
   * of its own flags, and the live mandatory-count watch is skipped. */
  viewOnly?: boolean;
  colors: Colors;
}

const SYSTEM_ICONS: Record<TargetSystem, React.ReactNode> = {
  remedy: <StorageRoundedIcon sx={{ fontSize: 16 }} />,
  cab: <AssignmentOutlinedIcon sx={{ fontSize: 16 }} />,
  planningTool: <EventNoteOutlinedIcon sx={{ fontSize: 16 }} />,
};

const GRID_SX = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
  gap: 1.1,
};

const isMandatoryEditable = (a: ResolvedAttribute) =>
  a.mandatoryLevel === "mandatory" && !a.readOnly && !a.isBackend && !a.autoSetFrom;

/**
 * One target-system card (Remedy Console / CAB Form / Planning Tool),
 * rendered as a collapsible accordion with a colored icon avatar, a live
 * "mandatory fields filled" pill, and its attribute rows laid out as a
 * responsive compact grid instead of a stacked list.
 */
export const AttributeSection: React.FC<AttributeSectionProps> = React.memo(function AttributeSection({
  system,
  attributes,
  backendAttributes,
  control,
  setValue,
  errors,
  viewOnly,
  colors,
}) {
  const meta = SYSTEM_SECTIONS[system];
  const accent = SYSTEM_ACCENT[system];
  const totalCount = attributes.length + (backendAttributes?.length ?? 0);

  // Live-watches this system's form section so the "X/Y mandatory" pill
  // updates immediately as the user fills fields in, not just after Save.
  // Disabled in view-only cards (whose control is a throwaway, unused form).
  const liveSection = useWatch({ control, name: system, disabled: viewOnly });

  const { mandatoryFilled, mandatoryTotal } = useMemo(() => {
    const mandatory = attributes.filter(isMandatoryEditable);
    const filled = mandatory.filter((a) => {
      const live = (liveSection as Record<string, unknown> | undefined)?.[a.field];
      if (Array.isArray(live)) return live.length > 0;
      if (typeof live === "string") return live.trim().length > 0;
      return !!a.value;
    }).length;
    return { mandatoryTotal: mandatory.length, mandatoryFilled: filled };
  }, [attributes, liveSection]);

  const allMandatoryFilled = mandatoryTotal > 0 && mandatoryFilled === mandatoryTotal;

  // A stage can legitimately have no fields for one of the target systems -
  // Network Execution collects nothing on the CAB form, for instance - and an
  // empty accordion reading "0 fields" is just noise, so render nothing.
  if (totalCount === 0) return null;

  return (
    <Accordion
      defaultExpanded
      disableGutters
      elevation={0}
      sx={{
        bgcolor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: `${colors.radiusL} !important`,
        overflow: "hidden",
        mb: 1.5,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon sx={{ color: colors.textSecondary, fontSize: 20 }} />}
        sx={{
          px: 2,
          py: 0.25,
          minHeight: 52,
          bgcolor: alpha(accent, colors.isDark ? 0.14 : 0.08),
          borderBottom: `1px solid ${colors.border}`,
          "& .MuiAccordionSummary-content": { alignItems: "center", my: 1 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              bgcolor: accent,
              color: "#fff",
            }}
          >
            {SYSTEM_ICONS[system]}
          </Box>
          <Typography
            noWrap
            sx={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary, minWidth: 0 }}
          >
            {meta.title}
          </Typography>

          <Box sx={{ flex: 1 }} />

          {mandatoryTotal > 0 && (
            <Box
              component="span"
              sx={{
                px: 1,
                py: "3px",
                borderRadius: "999px",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                bgcolor: allMandatoryFilled ? colors.successDim : colors.surface,
                color: allMandatoryFilled ? colors.success : colors.textSecondary,
                border: `1px solid ${allMandatoryFilled ? colors.successBorder : colors.border}`,
              }}
            >
              {mandatoryFilled}/{mandatoryTotal} mandatory
            </Box>
          )}
          <Typography
            sx={{
              fontSize: 11.5,
              color: colors.textSecondary,
              whiteSpace: "nowrap",
              display: { xs: "none", sm: "block" },
            }}
          >
            {totalCount} field{totalCount === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, py: 1.5 }}>
        {attributes.length ? (
          <Box sx={GRID_SX}>
            {attributes.map((attribute) => (
              <AttributeRow
                key={attribute.field}
                attribute={attribute}
                control={control}
                setValue={setValue}
                errors={errors}
                viewOnly={viewOnly}
                colors={colors}
              />
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 12.75, color: colors.textSecondary, py: 0.5 }}>
            No attributes at this stage.
          </Typography>
        )}

        {!!backendAttributes?.length && (
          <>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.textSecondary,
                mt: 1.75,
                mb: 1,
                pt: 1.5,
                borderTop: `1px dashed ${colors.border}`,
              }}
            >
              Backend-set fields — sent by backend, not shown in UI
            </Typography>
            <Box sx={GRID_SX}>
              {backendAttributes.map((attribute) => (
                <AttributeRow
                  key={attribute.field}
                  attribute={attribute}
                  control={control}
                  setValue={setValue}
                  errors={errors}
                  viewOnly={viewOnly}
                  colors={colors}
                />
              ))}
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
});

export default AttributeSection;
