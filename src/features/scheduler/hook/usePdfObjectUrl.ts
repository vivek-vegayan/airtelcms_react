import { useEffect, useRef, useState } from "react";

export interface PdfObjectUrl {
  /** `blob:` URL for an <iframe src> / download anchor, or null. */
  url: string | null;
  /** The blob arrived but isn't a PDF - show an error, not the browser's. */
  isMalformed: boolean;
}

/**
 * Turns a fetched PDF blob into a `blob:` URL, revoking the previous one on
 * every change so nothing leaks across re-fetches (retry, switching CRQ) or
 * unmount.
 *
 * The "%PDF-" magic header is checked first. The backend is expected to
 * reject corrupt or non-PDF documents itself, but if bad bytes ever slip
 * through, this stops the browser's own PDF viewer from replacing our error
 * state with its opaque "Failed to load PDF document".
 *
 * Extracted from `PreviewCrqPdfDialog`, which had this inline; it and the MOP
 * Create document preview now share one implementation.
 */
export const usePdfObjectUrl = (blob?: Blob): PdfObjectUrl => {
  const [url, setUrl] = useState<string | null>(null);
  const [isMalformed, setIsMalformed] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setUrl(null);
    setIsMalformed(false);
    if (!blob) return;

    let cancelled = false;
    blob
      .slice(0, 5)
      .arrayBuffer()
      .then((buf) => {
        if (cancelled) return;
        if (new TextDecoder("ascii").decode(buf) !== "%PDF-") {
          setIsMalformed(true);
          return;
        }
        const next = URL.createObjectURL(blob);
        objectUrlRef.current = next;
        setUrl(next);
      })
      .catch(() => {
        if (!cancelled) setIsMalformed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [blob]);

  return { url, isMalformed };
};
