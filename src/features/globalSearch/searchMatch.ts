export interface MatchSegment {
  text: string;
  highlight: boolean;
}

/** Simple normalized-substring match + segments for highlighting — no
 * fuzzy-match dependency needed for a nav-sized (a few dozen entries) index. */
export function matchLabel(label: string, query: string): { matched: boolean; segments: MatchSegment[] } {
  const trimmed = query.trim();
  if (!trimmed) return { matched: true, segments: [{ text: label, highlight: false }] };

  const idx = label.toLowerCase().indexOf(trimmed.toLowerCase());
  if (idx === -1) return { matched: false, segments: [{ text: label, highlight: false }] };

  const segments: MatchSegment[] = [
    { text: label.slice(0, idx), highlight: false },
    { text: label.slice(idx, idx + trimmed.length), highlight: true },
    { text: label.slice(idx + trimmed.length), highlight: false },
  ].filter((s) => s.text.length > 0);

  return { matched: true, segments };
}
