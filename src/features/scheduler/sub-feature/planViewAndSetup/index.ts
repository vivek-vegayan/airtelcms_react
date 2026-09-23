// ─────────────────────────────────────────────
//  Feature barrel exports
// ─────────────────────────────────────────────

// Page-level components (used in AppRoutes)
export { PlanViewAndSetup, ActivityViewAndSetupMain } from "./PlanViewAndSetup";

// Redux
export { default as planViewAndSetupReducer } from "./slices/activity.slice";
export * from "./slices/activity.slice";

// Selectors
export * from "./selectors/activity.selectors";

// Hooks
export { useActivity } from "./hooks/useActivity";
