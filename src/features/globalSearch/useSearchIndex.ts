import { useMemo, type ReactNode } from "react";
import { useSidebarNav } from "../../rbac/useSidebarNav";
import { usePermission } from "../../rbac/usePermission";
import { isNavItemAllowed } from "../../rbac/navRegistry";
import { QUICK_ACTIONS } from "./quickActions";

export interface SearchIndexEntry {
  id: string;
  label: string;
  /** Parent module name, shown as secondary text for child nav entries. */
  group?: string;
  path: string;
  icon: ReactNode;
  category: "module" | "action";
}

/**
 * Builds the searchable nav index straight from `useSidebarNav()` — the
 * exact same permission- and cab-role-filtered list the sidebar itself
 * renders — so search can never show a module/submodule the sidebar
 * wouldn't. Zero new permission logic.
 */
export function useNavSearchIndex(): SearchIndexEntry[] {
  const items = useSidebarNav();

  return useMemo(() => {
    const entries: SearchIndexEntry[] = [];
    for (const item of items) {
      entries.push({ id: item.to, label: item.text, path: item.to, icon: item.icon, category: "module" });
      for (const child of item.children ?? []) {
        entries.push({
          id: child.to,
          label: child.text,
          group: item.text,
          path: child.to,
          icon: child.icon,
          category: "module",
        });
      }
    }
    return entries;
  }, [items]);
}

/** Filters the static QUICK_ACTIONS registry through the same
 * `isNavItemAllowed` predicate the sidebar/routes use. */
export function useQuickActionsIndex(): SearchIndexEntry[] {
  const { hasModule, hasSubModule } = usePermission();

  return useMemo(
    () =>
      QUICK_ACTIONS.filter((qa) => isNavItemAllowed(qa, hasModule, hasSubModule)).map((qa) => ({
        id: qa.id,
        label: qa.label,
        path: qa.path,
        icon: qa.icon,
        category: "action" as const,
      })),
    [hasModule, hasSubModule],
  );
}
