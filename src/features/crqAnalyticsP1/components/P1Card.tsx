import { useState, type ReactNode } from "react";
import { Box, Collapse, IconButton, Skeleton, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { getCardSx } from "../../dashboard/constants/dashboard.styles";
import { EmptyOrErrorState } from "../../crqAnalytics/components/EmptyOrErrorState";
import { useP1 } from "../hooks/useP1Context";
import { P1_INFO, type P1InfoKey } from "../utils/p1Info";
import { Legend, Seg } from "./P1Bits";

interface Props {
  id?: string;
  title: string;
  /** Range / Now chip(s) beside the title. */
  tag?: ReactNode;
  /** Key of the "i" note (what / how / read / source). */
  info?: P1InfoKey;
  legend?: readonly { label: string; color: string }[];
  /** Card-level controls (Circle / Region tab, 6 / 12 months ...). */
  right?: ReactNode;
  /** With both `chart` and `table`, the card gets a Chart / Table switch. */
  chart?: ReactNode;
  table?: ReactNode;
  /** Downloads the card's table as Excel. */
  onExport?: () => void;
  loading?: boolean;
  error?: boolean;
  children?: ReactNode;
}

const VIEW_OPTIONS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
] as const;

/**
 * Card shell of the Phase 1 pages: the shared dashboard card surface, a title row with the
 * window chip, the "i" note, an optional Chart / Table switch and an Excel download.
 */
export function P1Card({ id, title, tag, info, legend, right, chart, table, onExport, loading, error, children }: Props) {
  const { colors } = useP1();
  const t = colors.tokens;
  const [showInfo, setShowInfo] = useState(false);
  const [view, setView] = useState<"chart" | "table">("chart");
  const twin = chart != null && table != null;
  const note = info ? P1_INFO[info] : undefined;

  return (
    <Box
      id={id}
      sx={{
        ...getCardSx(t),
        // Wide table cards should not lift under the pointer like the small dashboard tiles do.
        "&:hover": { borderColor: t.borderHover },
        p: "14px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        minWidth: 0,
        scrollMarginTop: "12px",
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px" }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, flex: "1 1 280px", minWidth: 0 }}>
          <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
            {title}
          </Typography>
          {tag}
          {note && (
            <Tooltip title={showInfo ? "Hide the note" : "What this shows and how it is worked out"} arrow>
              <IconButton size="small" aria-expanded={showInfo} onClick={() => setShowInfo((v) => !v)} sx={{ p: "2px", color: showInfo ? t.accent : t.textSecondary }}>
                <InfoOutlinedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25 }}>
          {legend && (!twin || view === "chart") && <Legend items={legend} />}
          {right}
          {twin && <Seg value={view} options={VIEW_OPTIONS} onChange={setView} ariaLabel="Show as chart or table" />}
          {onExport && (
            <Tooltip title="Download this table (Excel)" arrow>
              <IconButton size="small" onClick={onExport} sx={{ color: t.textSecondary, "&:hover": { color: t.accent } }}>
                <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {note && (
        <Collapse in={showInfo} unmountOnExit>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1.75,
              p: "12px 14px",
              borderRadius: t.radius,
              background: t.surface2,
              border: `1px solid ${t.border}`,
              fontSize: 12.5,
              lineHeight: 1.55,
              color: t.textPrimary,
            }}
          >
            {(
              [
                ["What it shows", note.what],
                ["How we work it out", note.how],
                ["How to read it", note.read],
              ] as const
            ).map(([head, body]) => (
              <Box key={head}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: t.textSecondary, mb: "3px" }}>
                  {head}
                </Typography>
                {body}
              </Box>
            ))}
            <Box sx={{ gridColumn: "1 / -1", borderTop: `1px dashed ${t.border}`, pt: 1, fontSize: 11, color: t.textSecondary, fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>
              <Box component="span" sx={{ fontFamily: "inherit", fontWeight: 700, mr: 1, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10 }}>
                Source
              </Box>
              {note.src}
            </Box>
          </Box>
        </Collapse>
      )}

      {error ? (
        <EmptyOrErrorState kind="error" />
      ) : loading ? (
        <Skeleton variant="rounded" height={180} />
      ) : (
        <>
          {twin ? (view === "chart" ? chart : table) : (chart ?? table)}
          {children}
        </>
      )}
    </Box>
  );
}

/** "Nothing to show" body for a card whose result set is empty. */
export function P1Empty({ message }: { message?: string }) {
  return <EmptyOrErrorState kind="empty" message={message} />;
}
