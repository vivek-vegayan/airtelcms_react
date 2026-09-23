import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, InputBase, Typography, Chip, Stack, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import { useTabColorTokens } from "../../style/theme";
import { useNavSearchIndex, useQuickActionsIndex, type SearchIndexEntry } from "./useSearchIndex";
import { matchLabel } from "./searchMatch";
import { useRecentSearches } from "./useRecentSearches";

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  /** The header search trigger the palette should anchor itself under -
   * centered on its horizontal midpoint, opening just below it, instead of
   * floating in the middle of the viewport. */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

type CategoryFilter = "all" | "module" | "action";

const CATEGORY_LABEL: Record<CategoryFilter, string> = {
  all: "All",
  module: "Modules",
  action: "Quick Actions",
};

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose, anchorRef }) => {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<{ top: number; centerX: number } | null>(null);

  const navEntries = useNavSearchIndex();
  const actionEntries = useQuickActionsIndex();
  const { recent, addRecent } = useRecentSearches();

  const allEntries = useMemo(() => [...navEntries, ...actionEntries], [navEntries, actionEntries]);

  const results = useMemo(() => {
    const scoped = category === "all" ? allEntries : allEntries.filter((e) => e.category === category);
    return scoped
      .map((entry) => ({ entry, match: matchLabel(entry.label, query) }))
      .filter((r) => r.match.matched)
      .slice(0, 30);
  }, [allEntries, category, query]);

  const showRecent = query.trim().length === 0 && recent.length > 0;
  const activeListLength = showRecent ? recent.length : results.length;

  // Reset transient state each time the palette opens, and autofocus the input.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCategory("all");
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, category]);

  // Anchor the palette under the header search trigger - measured on open
  // and re-measured on resize so it stays aligned if the trigger's position
  // shifts (e.g. sidebar collapse/expand changing its width).
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = anchorRef?.current;
      if (!el) {
        setAnchorRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setAnchorRect({ top: r.bottom + 8, centerX: r.left + r.width / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, anchorRef]);

  // Lock body scroll while the palette is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const goToEntry = (entry: SearchIndexEntry) => {
    addRecent({ id: entry.id, label: entry.label, path: entry.path });
    navigate(entry.path);
    onClose();
  };

  const goToRecent = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (activeListLength === 0 ? 0 : (i + 1) % activeListLength));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (activeListLength === 0 ? 0 : (i - 1 + activeListLength) % activeListLength));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showRecent) {
        const r = recent[activeIndex];
        if (r) goToRecent(r.path);
      } else {
        const r = results[activeIndex];
        if (r) goToEntry(r.entry);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <React.Fragment>
          <motion.div
            key="global-search-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(6,10,16,0.55)",
              zIndex: 1400,
            }}
          />
          <motion.div
            key="global-search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={
              anchorRect
                ? {
                    position: "fixed",
                    top: anchorRect.top,
                    left: anchorRect.centerX,
                    transform: "translateX(-50%)",
                    width: "min(600px, 92vw)",
                    zIndex: 1401,
                  }
                : {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(600px, 92vw)",
                    zIndex: 1401,
                  }
            }
            onKeyDown={handleKeyDown}
          >
            <Box
              sx={{
                borderRadius: c.radiusXL,
                bgcolor: c.surface,
                border: `1px solid ${c.border}`,
                boxShadow: c.shadowOverlay,
                overflow: "hidden",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2, py: 1.5 }}>
                <SearchOutlined sx={{ color: c.textSecondary }} />
                <InputBase
                  inputRef={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search modules, pages, and quick actions…"
                  fullWidth
                  sx={{ fontSize: 15, color: c.textPrimary }}
                />
                <Chip
                  label={typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl K"}
                  size="small"
                  sx={{ bgcolor: c.surface2, color: c.textDim, fontWeight: 600, fontSize: 11 }}
                />
              </Stack>

              <Divider sx={{ borderColor: c.border }} />

              <Stack direction="row" spacing={1} sx={{ px: 2, py: 1 }}>
                {(Object.keys(CATEGORY_LABEL) as CategoryFilter[]).map((cat) => (
                  <Chip
                    key={cat}
                    label={CATEGORY_LABEL[cat]}
                    size="small"
                    onClick={() => setCategory(cat)}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 600,
                      bgcolor: category === cat ? c.accentDim : "transparent",
                      color: category === cat ? c.accent : c.textSecondary,
                      border: `1px solid ${category === cat ? c.accentBorder : c.border}`,
                    }}
                  />
                ))}
              </Stack>

              <Divider sx={{ borderColor: c.border }} />

              <Box sx={{ maxHeight: 360, overflowY: "auto", py: 1 }}>
                {showRecent && (
                  <>
                    <Typography
                      sx={{
                        px: 2, pt: 0.5, pb: 0.5, fontSize: 11, fontWeight: 700,
                        letterSpacing: 0.6, textTransform: "uppercase", color: c.textDim,
                      }}
                    >
                      Recent
                    </Typography>
                    {recent.map((r, i) => (
                      <Box
                        key={r.id}
                        onClick={() => goToRecent(r.path)}
                        onMouseEnter={() => setActiveIndex(i)}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.25,
                          px: 2, py: 1, mx: 1, borderRadius: c.radiusL, cursor: "pointer",
                          bgcolor: activeIndex === i ? c.accentDim : "transparent",
                        }}
                      >
                        <HistoryOutlined fontSize="small" sx={{ color: c.textSecondary }} />
                        <Typography sx={{ fontSize: 13.5, color: c.textPrimary }}>{r.label}</Typography>
                      </Box>
                    ))}
                  </>
                )}

                {!showRecent && results.length === 0 && (
                  <Typography sx={{ px: 2, py: 3, textAlign: "center", fontSize: 13, color: c.textSecondary }}>
                    No matches for &ldquo;{query}&rdquo;
                  </Typography>
                )}

                {!showRecent &&
                  results.map(({ entry, match }, i) => (
                    <Box
                      key={entry.id}
                      onClick={() => goToEntry(entry)}
                      onMouseEnter={() => setActiveIndex(i)}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.25,
                        px: 2, py: 1, mx: 1, borderRadius: c.radiusL, cursor: "pointer",
                        bgcolor: activeIndex === i ? c.accentDim : "transparent",
                      }}
                    >
                      <Box sx={{ display: "flex", color: c.textSecondary, "& svg": { fontSize: 19 } }}>{entry.icon}</Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13.5, color: c.textPrimary, fontWeight: 500 }} noWrap>
                          {match.segments.map((seg, si) => (
                            <Box
                              key={si}
                              component="span"
                              sx={{ color: seg.highlight ? c.accent : "inherit", fontWeight: seg.highlight ? 700 : 500 }}
                            >
                              {seg.text}
                            </Box>
                          ))}
                        </Typography>
                        {entry.group && (
                          <Typography sx={{ fontSize: 11, color: c.textDim }}>{entry.group}</Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearchModal;
