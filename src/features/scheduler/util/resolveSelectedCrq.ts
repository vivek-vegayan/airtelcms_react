/**
 * The list pages remember the selected CRQ as the row object captured at
 * click time. Once the listing refetches (after a Start/Pause/Done, or on
 * window focus) that object is stale, so the toolbar actions (Review, PDF
 * View, Reschedule) would keep acting on the old status. Re-resolve the
 * selection by crqNo against the latest plans instead; fall back to the
 * snapshot when the CRQ is no longer listed (e.g. it moved to the next stage).
 */
export const resolveSelectedCrq = (plans: any[], snapshot: any | null): any | null => {
  if (!snapshot) return null;
  for (const plan of plans) {
    const match = plan.crqs?.find((c: any) => c.crqNo === snapshot.crqNo);
    if (match) return { ...match, planNumber: plan.planNumber };
  }
  return snapshot;
};
