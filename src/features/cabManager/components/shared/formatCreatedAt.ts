import { format, isValid, parseISO } from "date-fns";

// Created_At arrives as an ISO LocalDateTime ("2026-09-09T15:07:33").
export function formatCreatedAt(value?: string): string {
  if (!value) return "—";
  const d = parseISO(value);
  return isValid(d) ? format(d, "dd MMM yyyy, HH:mm") : value;
}
