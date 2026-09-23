import { format, parseISO } from "date-fns";
import type { AuditActionCode, AuditLogEntry } from "../../types/auditLog";

/**
 * Display helpers for the Audit Log.
 *
 * One rule governs everything about time here: the audit timestamp is whatever
 * the database recorded, and the browser only ever re-shapes it. Nothing in
 * this file invents, defaults or shifts a date — {@link formatAuditDateTime}
 * prefers the pre-split `actionDate` / `actionTime` the procedure returns, and
 * falls back to formatting `createdAt` only for display width. A row with no
 * stored timestamp renders as a dash rather than as "now".
 */

/** Blank-safe text for a read-only field. Matches the convention used by the
 *  Cancelled CRQ registry so the two screens read the same. */
export const orDash = (value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? "—" : String(value);

/**
 * "04 Sep 2026, 10:30:25" — the date and time exactly as stored.
 *
 * Built from `actionDate` + `actionTime`, which the procedure pre-split in SQL,
 * so no timezone conversion can happen between the database and the screen.
 */
export const formatAuditDateTime = (row: AuditLogEntry): string => {
  if (row.actionDate) {
    try {
      const day = format(parseISO(row.actionDate), "dd MMM yyyy");
      return row.actionTime ? `${day}, ${row.actionTime}` : day;
    } catch {
      return row.actionTime ? `${row.actionDate}, ${row.actionTime}` : row.actionDate;
    }
  }

  if (!row.createdAt) return "—";
  try {
    return format(parseISO(row.createdAt), "dd MMM yyyy, HH:mm:ss");
  } catch {
    return row.createdAt;
  }
};

/** Just the day part, for the grouped date column. */
export const formatAuditDate = (row: AuditLogEntry): string => {
  if (!row.actionDate) return "—";
  try {
    return format(parseISO(row.actionDate), "dd MMM yyyy");
  } catch {
    return row.actionDate;
  }
};

/** The full-precision timestamp, shown verbatim in the details dialog so an
 *  auditor can see exactly what is stored, microseconds included. */
export const rawTimestamp = (row: AuditLogEntry): string => orDash(row.createdAt);

/** "SUB_DOMAIN_HEAD" -> "Sub Domain Head". Role codes are stored, not labels. */
export const humanise = (value: string | null | undefined): string => {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/** "Vegayan_User_1 (A1L575DH)", or the bare id when the user row is gone. */
export const describeUser = (
  name: string | null,
  olmid: string | null,
  userId: number | null,
): string => {
  if (!userId && !name && !olmid) return "—";
  if (name && olmid) return `${name} (${olmid})`;
  return name ?? olmid ?? `User #${userId}`;
};

/**
 * Semantic colour family per verb, resolved against the theme tokens rather
 * than hardcoded hex, so the badges follow the brand colour and both themes.
 */
export type AuditTone = "success" | "info" | "warning" | "danger" | "accent" | "neutral";

const ACTION_TONES: Record<string, AuditTone> = {
  CREATE: "success",
  APPROVE: "success",
  ENABLE: "success",
  COMPLETE: "success",
  VALIDATE: "success",
  LOGIN: "success",

  UPDATE: "info",
  ASSIGN: "info",
  SUBMIT: "info",
  START: "info",
  UPLOAD: "info",
  DOWNLOAD: "info",

  RESCHEDULE: "warning",
  PAUSE: "warning",
  DELEGATE: "warning",
  UNASSIGN: "warning",
  DISABLE: "warning",
  LOGOUT: "warning",

  DELETE: "danger",
  REJECT: "danger",
  CANCEL: "danger",
};

export const actionTone = (action: AuditActionCode): AuditTone =>
  ACTION_TONES[String(action).toUpperCase()] ?? "neutral";
