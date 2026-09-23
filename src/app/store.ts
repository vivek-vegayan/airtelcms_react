import { combineReducers, configureStore, type Action } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer, { logout } from "../features/auth/slices/auth.slice";
import { api } from "../service/api";
import rosterReducer from "../features/roster/slices/roster.slice";
// Imported directly from the slice file, not the sub-feature's barrel: the
// barrel statically re-exports every component in the sub-feature (including
// the lazy-loaded AttributeUpdateDialog and its whole subtree/field
// catalog), and the store is part of the app's eager root - importing the
// reducer through the barrel here would pull that entire subtree into the
// main bundle and silently defeat the dialog's React.lazy() code-split.
import attributeUpdateReducer from "../features/scheduler/sub-feature/attributeUpdate/slices/attributeUpdate.slice";
import { planViewAndSetupReducer } from "../features/scheduler/sub-feature/planViewAndSetup";
import orgFiltersReducer from "../features/orgHierarchy/slices/orgFilters.slice";

const appReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  roster: rosterReducer,
  attributeUpdate: attributeUpdateReducer,
  planViewAndSetup: planViewAndSetupReducer,
  // Per-screen org-hierarchy selections, so a screen re-opens on the scope the
  // user left it on. Selected ids only - see slices/orgFilters.slice.ts.
  orgFilters: orgFiltersReducer,
});

// Every logout path (explicit header logout, the global 401/403 handler in
// service/api.ts, and the cross-tab `storage` event in AuthHydrator) ends by
// dispatching auth/logout — resetting the whole tree here, rather than just
// the auth slice, guarantees roster/attributeUpdate/planViewAndSetup/orgFilters/
// RTK-Query-cache can never leak into the next session, without every
// logout call site having to remember to clean up each slice. crqJourney
// (CRQ Journey Explorer) is plain RTK Query state, cleared the same way via
// api.util.resetApiState() in service/api.ts's 401 handler.
const rootReducer: typeof appReducer = (state, action: Action) => {
  if (action.type === logout.type) {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (gDM) =>
    gDM({ serializableCheck: false }).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
