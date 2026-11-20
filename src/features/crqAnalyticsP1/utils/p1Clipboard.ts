/*
 * Clipboard writes with the standard async Clipboard API only (no deprecated execCommand).
 * Browsers allow that API on secure pages (HTTPS, localhost). On a plain-HTTP address the caller
 * falls back to the user's own Ctrl+C, handled with the standard `copy` event.
 */

/** True when the page may write to the clipboard from code (HTTPS or localhost). */
export const canWriteClipboard = (): boolean =>
  typeof window !== "undefined" && window.isSecureContext && typeof navigator.clipboard?.writeText === "function";

/**
 * Writes `text` to the clipboard. `text` may still be loading: with ClipboardItem the browser keeps
 * the click's permission while it loads (needed when the full list is fetched first). Resolves
 * false when the browser does not allow the write; rejects only if `text` itself fails.
 */
export async function writeClipboard(text: Promise<string>): Promise<boolean> {
  if (!canWriteClipboard()) return false;
  if (typeof ClipboardItem !== "undefined" && typeof navigator.clipboard.write === "function") {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": text.then((s) => new Blob([s], { type: "text/plain" })) })]);
      return true;
    } catch {
      // older ClipboardItem without promise support, or the write was refused: try writeText below
    }
  }
  const value = await text; // a failed fetch rejects here, so the caller can say so
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

/** "Ctrl+C", or "⌘C" on Apple devices. */
export const copyShortcut = (): string =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘C" : "Ctrl+C";
