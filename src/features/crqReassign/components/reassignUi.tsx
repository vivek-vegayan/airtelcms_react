import type { ReactElement, ReactNode } from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { useReassignTokens } from "../hooks/useReassignTokens";

/** "CONT" / "2 DATES" / "+1D" marker on an activity that crosses midnight. */
export const DateBadge = ({ kind }: { kind: "cont" | "span" | "plus" }) => {
  const { tk } = useReassignTokens();
  return (
    <Chip
      size="small"
      label={kind === "cont" ? "CONT" : kind === "span" ? "2 DATES" : "+1D"}
      sx={{
        height: 16,
        fontSize: 9.5,
        fontWeight: 700,
        "& .MuiChip-label": { px: 0.6 },
        color: tk.warning,
        bgcolor: tk.warningDim,
        border: `1px solid ${tk.warningBorder}`,
      }}
    />
  );
};

/** Hover card with the activity / CRQ details. */
export const DetailTip = ({
  title,
  details,
  children,
}: {
  title: string;
  details: [string, ReactNode][];
  children: ReactElement;
}) => (
  <Tooltip
    arrow
    placement="bottom-start"
    disableInteractive
    title={
      <Box sx={{ minWidth: 200 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>{title}</Typography>
        {details
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => (
            <Box key={k} sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: 11.5, lineHeight: 1.6 }}>
              <Box component="span" sx={{ opacity: 0.75 }}>{k}</Box>
              <Box component="span" sx={{ fontWeight: 600, textAlign: "right" }}>{v}</Box>
            </Box>
          ))}
      </Box>
    }
  >
    {children}
  </Tooltip>
);

export interface Note {
  text: string;
  bad: boolean;
}

/** Guidance line above each view, with the latest action result on the right. */
export const HintBar = ({ children, note }: { children: ReactNode; note: Note | null }) => {
  const { tk, rule } = useReassignTokens();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1,
        borderBottom: rule,
        fontSize: 12,
        color: tk.textSecondary,
        flexWrap: "wrap",
      }}
    >
      {children}
      {note?.text && (
        <Box
          component="span"
          sx={{
            ml: "auto",
            fontWeight: 600,
            px: 1,
            py: 0.4,
            borderRadius: tk.radius,
            color: note.bad ? tk.danger : tk.success,
            bgcolor: note.bad ? tk.dangerDim : tk.successDim,
            border: `1px solid ${note.bad ? tk.dangerBorder : tk.successBorder}`,
          }}
        >
          {note.text}
        </Box>
      )}
    </Box>
  );
};
