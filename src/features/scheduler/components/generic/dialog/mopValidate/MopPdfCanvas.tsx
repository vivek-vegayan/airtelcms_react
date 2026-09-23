import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CircularProgress, Skeleton, Stack, Typography, alpha } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { AnimatePresence, motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

/**
 * pdf.js runs its parser in a worker. Vite resolves this specifier at build
 * time and emits the worker as its own chunk, so it is served from our origin
 * rather than a CDN - the app has no outbound allowance for one, and a CDN
 * worker would break the moment the network is locked down.
 *
 * `pdfjs-dist` is already present as react-pdf's own dependency; nothing new is
 * installed for this.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface PageFindingMarker {
  pageNo: number;
  /** Findings still open on that page - drives the marker's colour. */
  openCount: number;
  totalCount: number;
}

interface MopPdfCanvasProps {
  blob?: Blob;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;

  pageNo: number;
  onPageChange: (page: number) => void;
  /** Reported up as soon as the document parses, so the toolbar is truthful. */
  onPageCount: (count: number) => void;

  /** 70-200, or "fit" to track the container width. */
  zoom: number | "fit";
  rotation: number;

  /** Click-to-flag. Null disables it (read-only version). */
  onFlagPage: ((pageNo: number) => void) | null;

  markers: PageFindingMarker[];
  /** Finding hovered in the rail - its page pulses so the two stay linked. */
  highlightedPage: number | null;

  colors: any;
}

/**
 * The MOP document rendered by pdf.js, one page at a time.
 *
 * Replaces the `<iframe>` the MOP Create panel uses. That was the right call
 * there - the browser's viewer is free and complete - but this screen needs the
 * things an iframe will not give up: the real page count, control of which page
 * is shown, and a click target on the page itself. Findings anchor to a page, so
 * the viewer has to know what page it is on.
 *
 * The rendered page is measured, not guessed: "fit" tracks the container via a
 * ResizeObserver so the page fills the pane at any window size without the
 * layout feeding back into itself.
 */
export const MopPdfCanvas: React.FC<MopPdfCanvasProps> = ({
  blob,
  isFetching,
  isError,
  onRetry,
  pageNo,
  onPageChange,
  onPageCount,
  zoom,
  rotation,
  onFlagPage,
  markers,
  highlightedPage,
  colors,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // The pane's width drives "fit"; measured rather than read off window size so
  // collapsing the rail resizes the page too.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      // Rounded to whole pixels: sub-pixel jitter would re-render the canvas on
      // every scrollbar twitch (see `useAutoFitScale`'s oscillation notes).
      setHostWidth(Math.round(width));
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // A new document invalidates the old page count and any stale error.
  useEffect(() => {
    setNumPages(0);
    setLoadError(false);
  }, [blob]);

  const handleLoad = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      onPageCount(total);
      // A page that no longer exists (smaller replacement document) would
      // render blank rather than erroring, so it is pulled back into range.
      if (pageNo > total) onPageChange(total);
    },
    [onPageCount, onPageChange, pageNo],
  );

  // 48px of padding on each side keeps the page clear of the pane's edges.
  const pageWidth = useMemo(() => {
    const usable = Math.max(320, hostWidth - 96);
    if (zoom === "fit") return usable;
    return Math.max(320, Math.round((usable * zoom) / 100));
  }, [hostWidth, zoom]);

  const marker = markers.find((m) => m.pageNo === pageNo);
  const isHighlighted = highlightedPage === pageNo;

  const frame = {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${colors.border}`,
    bgcolor: colors.surface,
  };

  if (isFetching) {
    return (
      <Box sx={{ ...frame, justifyContent: "flex-start", p: 3, overflow: "hidden" }}>
        <Skeleton variant="rectangular" width="72%" height={26} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ flex: 1 }} />
      </Box>
    );
  }

  if (isError || loadError) {
    return (
      <Stack sx={{ ...frame, p: 4, textAlign: "center" }} spacing={1.5}>
        <ErrorOutlineRoundedIcon sx={{ fontSize: 32, color: colors.danger }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
          Unable to load the MOP document.
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: colors.textDim, maxWidth: 360 }}>
          {loadError
            ? "The stored file is not a readable PDF. Re-upload it on the MOP Create stage."
            : "The document could not be fetched."}
        </Typography>
        <Button
          size="small"
          onClick={onRetry}
          startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 0, alignSelf: "center" }}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      ref={hostRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: 3,
      }}
    >
      <Document
        file={blob}
        onLoadSuccess={handleLoad}
        onLoadError={() => setLoadError(true)}
        loading={
          <Stack sx={{ alignItems: "center", justifyContent: "center", py: 8 }} spacing={1.5}>
            <CircularProgress size={24} />
            <Typography sx={{ fontSize: 12.5, color: colors.textDim, fontWeight: 600 }}>
              Rendering MOP…
            </Typography>
          </Stack>
        }
        error={null}
        noData={null}
      >
        {numPages > 0 && (
          <motion.div
            // Keyed on the page so each turn animates rather than swapping
            // silently - it is the only feedback that the click registered.
            key={`${pageNo}-${rotation}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ position: "relative", lineHeight: 0 }}
          >
            <Box
              onClick={() => onFlagPage?.(pageNo)}
              sx={{
                position: "relative",
                cursor: onFlagPage ? "crosshair" : "default",
                boxShadow: isHighlighted
                  ? `0 0 0 3px ${colors.accent}, ${colors.shadowElevated}`
                  : colors.shadowCard,
                transition: "box-shadow 180ms ease",
                "&:hover .mop-flag-hint": { opacity: onFlagPage ? 1 : 0 },
              }}
            >
              <Page
                pageNumber={pageNo}
                width={pageWidth}
                rotate={rotation}
                renderTextLayer
                renderAnnotationLayer
              />

              {/* Hover affordance for click-to-flag. Sits above the text layer
                  so selecting text does not fight it. */}
              {onFlagPage && (
                <Box
                  className="mop-flag-hint"
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 3,
                    opacity: 0,
                    transition: "opacity 160ms ease",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.25,
                    py: 0.6,
                    bgcolor: alpha(colors.textPrimary, 0.86),
                    color: colors.bg,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <FlagRoundedIcon sx={{ fontSize: 15 }} />
                  Flag page {pageNo}
                </Box>
              )}

              {/* Existing findings on this page, as a corner badge. */}
              <AnimatePresence>
                {marker && marker.totalCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    style={{ position: "absolute", top: 12, left: 12, zIndex: 3 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.25,
                        py: 0.6,
                        bgcolor: marker.openCount > 0 ? colors.accent : colors.success,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 800,
                        boxShadow: colors.shadowCard,
                      }}
                    >
                      <FlagRoundedIcon sx={{ fontSize: 15 }} />
                      {marker.openCount > 0
                        ? `${marker.openCount} open`
                        : `${marker.totalCount} resolved`}
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </motion.div>
        )}
      </Document>
    </Box>
  );
};

export default MopPdfCanvas;
