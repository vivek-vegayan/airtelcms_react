import { alpha, Stack, Typography, useTheme } from "@mui/material";

interface Props {
  title?: string;
  subtitle: string;
}

/** Inbox tray with a check badge and two birds flying out — drawn from theme
 *  colors so it follows light/dark mode and the user's brand color. */
const InboxIllustration = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;
  const paper = theme.palette.background.paper;
  const success = theme.palette.success.main;

  return (
    <svg width="140" height="122" viewBox="0 0 160 140" fill="none" aria-hidden="true">
      {/* Soft backdrop */}
      <circle cx="80" cy="76" r="58" fill={alpha(primary, isDark ? 0.14 : 0.08)} />

      {/* Birds */}
      <path
        d="M44 30c4-4 8-4 11 0 3-4 7-4 11 0"
        stroke={alpha(primary, 0.55)}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M66 14c3-3 6-3 8 0 2-3 5-3 8 0"
        stroke={alpha(primary, 0.35)}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tray back */}
      <path
        d="M46 60l8-18h52l8 18"
        fill={alpha(primary, isDark ? 0.22 : 0.12)}
        stroke={primary}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Tray body */}
      <path
        d="M40 62a4 4 0 0 1 4-4h18l5 10h26l5-10h18a4 4 0 0 1 4 4v34a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6z"
        fill={paper}
        stroke={primary}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M54 84h52" stroke={alpha(primary, 0.25)} strokeWidth="2.5" strokeLinecap="round" />

      {/* Check badge */}
      <circle cx="114" cy="50" r="15" fill={success} stroke={paper} strokeWidth="4" />
      <path
        d="M107 50l5 5 9-10"
        stroke={theme.palette.success.contrastText}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const InboxEmptyState = ({ title = "You're all caught up", subtitle }: Props) => (
  <Stack alignItems="center" justifyContent="center" sx={{ py: 6, px: 3, gap: 1, textAlign: "center" }}>
    <InboxIllustration />
    <Typography sx={{ mt: 1, fontSize: "1rem", fontWeight: 700, color: "text.primary" }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", maxWidth: 280, lineHeight: 1.5 }}>
      {subtitle}
    </Typography>
  </Stack>
);
