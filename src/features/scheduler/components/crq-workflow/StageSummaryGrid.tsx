import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import type { Colors } from "../../types/colorTypes";
import {
  SECTION_DEFS,
  categorizeStageField,
  type StageSummaryField,
  type SummarySectionId,
} from "../../constants/workflowStages";

interface StageSummaryGridProps {
  fields: StageSummaryField[];
  colors: Colors;
  /** Render every section except these (e.g. hide "activity" from the main cockpit view). */
  excludeSectionIds?: SummarySectionId[];
  /** Render only these sections (e.g. just "activity" inside the CRQ Status dialog). Takes precedence over excludeSectionIds. */
  onlySectionIds?: SummarySectionId[];
}

const SECTION_ICONS: Record<SummarySectionId, React.ElementType> = {
  general: InfoOutlinedIcon,
  workflow: AccountTreeRoundedIcon,
  scheduling: EventRoundedIcon,
  engineer: EngineeringRoundedIcon,
  activity: BoltRoundedIcon,
  remarks: ChatBubbleOutlineRoundedIcon,
};

/** Sections open by default - the highest-value information, kept visible
 * without an extra click; the rest starts collapsed to keep the page short. */
const DEFAULT_OPEN: Partial<Record<SummarySectionId, boolean>> = {
  general: true,
  workflow: true,
};

const SummaryCard: React.FC<{ field: StageSummaryField; colors: Colors }> = ({ field, colors }) => {
  return (
    <Box
      sx={{
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${colors.accentBorder}`,
        borderRadius: colors.radius,
        p: "7px 10px",
        bgcolor: colors.surface,
      }}
    >
      <Typography
        sx={{
          fontSize: 9.5,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: colors.textDim,
          fontWeight: 700,
        }}
      >
        {field.label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.textPrimary,
          mt: 0.3,
          wordBreak: "break-word",
        }}
      >
        {field.value}
      </Typography>
    </Box>
  );
};

/**
 * CRQ field body - the same flat field list getStageSummaryFields has always
 * returned (identical values, identical set regardless of selected stage),
 * now organized into named, collapsible sections instead of one long grid.
 * Grouping is presentational only (categorizeStageField), driven off each
 * field's raw API key - no data is added, removed or renamed.
 */
export const StageSummaryGrid: React.FC<StageSummaryGridProps> = ({
  fields,
  colors,
  excludeSectionIds,
  onlySectionIds,
}) => {
  const [expanded, setExpanded] = useState<Partial<Record<SummarySectionId, boolean>>>(DEFAULT_OPEN);

  const sections = useMemo(() => {
    const groups: Record<SummarySectionId, StageSummaryField[]> = {
      general: [],
      workflow: [],
      scheduling: [],
      engineer: [],
      activity: [],
      remarks: [],
    };
    fields.forEach((f) => groups[categorizeStageField(f.key)].push(f));
    return SECTION_DEFS.filter((def) => {
      if (onlySectionIds) return onlySectionIds.includes(def.id);
      if (excludeSectionIds) return !excludeSectionIds.includes(def.id);
      return true;
    })
      .map((def) => ({ def, fields: groups[def.id] }))
      .filter((s) => s.fields.length > 0);
  }, [fields, excludeSectionIds, onlySectionIds]);

  if (!fields.length || !sections.length) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          border: `1px dashed ${colors.border}`,
          borderRadius: colors.radiusL,
        }}
      >
        <Typography sx={{ fontSize: 13, color: colors.textDim }}>
          No data available for this stage yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {sections.map(({ def, fields: sectionFields }) => {
        const Icon = SECTION_ICONS[def.id];
        const isOpen = !!expanded[def.id];
        return (
          <Accordion
            key={def.id}
            expanded={isOpen}
            onChange={(_, next) => setExpanded((prev) => ({ ...prev, [def.id]: next }))}
            disableGutters
            elevation={0}
            sx={{
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: `${colors.radiusL} !important`,
              overflow: "hidden",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreRoundedIcon sx={{ color: colors.textSecondary, fontSize: 19 }} />}
              sx={{
                px: 1.75,
                minHeight: 44,
                "& .MuiAccordionSummary-content": { alignItems: "center", my: 0.75, gap: 1 },
              }}
            >
              <Icon sx={{ fontSize: 16, color: colors.textDim }} />
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: colors.textPrimary }}>
                {def.label}
              </Typography>
              <Chip
                label={sectionFields.length}
                size="small"
                sx={{
                  height: 18,
                  minWidth: 18,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: colors.trackOff,
                  color: colors.textDim,
                  "& .MuiChip-label": { px: "6px" },
                }}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1.75, py: 1.5, pt: 0 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                    xl: "repeat(5, 1fr)",
                  },
                  gap: 0.75,
                }}
              >
                {sectionFields.map((f) => (
                  <SummaryCard key={f.key} field={f} colors={colors} />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
};

export default StageSummaryGrid;
