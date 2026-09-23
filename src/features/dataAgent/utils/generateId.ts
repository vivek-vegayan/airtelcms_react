/**
 * crypto.randomUUID() only exists in secure contexts (HTTPS or localhost) —
 * it's undefined when the app is served over plain HTTP from a LAN IP, which
 * this enterprise app's dev/test deployments commonly are. These ids are only
 * ever used as React keys / localStorage keys / feedback correlation ids, so
 * a non-cryptographic fallback is fine.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
