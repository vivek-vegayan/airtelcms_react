import { useWatch, type Control } from "react-hook-form";

import {
  useGetImplCompanyOptionsQuery,
  useGetImplGroupOptionsQuery,
  useGetImplOrganizationOptionsQuery,
} from "../api/attributeUpdateApiSlice";
import type {
  AttributeDependency,
  ResolvedAttribute,
  TargetSystem,
} from "../types/attributeUpdate.types";
import type { AttributeFormValues } from "../utils/attributeUpdate.utils";

/** Form path of one attribute field, in the shape react-hook-form's types want. */
type AttributeFieldPath = `remedy.${string}` | `cab.${string}` | `planningTool.${string}`;

export interface AttributeOptions {
  /** Options to render in the dropdown. */
  options: string[];
  /** A lookup is in flight - the row shows a spinner instead of an empty menu. */
  isLoading: boolean;
  /**
   * Label of the parent level that still has to be picked. Set only for a
   * cascade level whose lookup cannot run yet, so the row can say *why* it has
   * no options rather than showing an empty menu.
   */
  blockedBy?: string;
}

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * Form path of a dependency, or a harmless placeholder when there is none -
 * useWatch always needs a name, even the disabled calls that never read it.
 */
const dependencyPath = (
  system: TargetSystem,
  dependency: AttributeDependency | undefined,
): AttributeFieldPath => `${system}.${dependency?.field ?? ""}` as AttributeFieldPath;

/**
 * Resolves one dropdown attribute's option list.
 *
 * For an ordinary attribute this is just its catalog `values`. For an attribute
 * with an `optionSource` the list comes from the backend instead, and the
 * Support Company / Organization / Group Name+ levels form a cascade (once for
 * Change Coordinator, once for Change Implementer): organizations are fetched
 * for the currently selected company, groups for the selected company *and*
 * organization, both read live off the form so picking a company immediately
 * re-targets the levels below it.
 *
 * `enabled` gates every request on the row actually showing its control - rows
 * sitting in their collapsed "click to change" display never hit the network.
 */
export function useAttributeOptions(
  attribute: ResolvedAttribute,
  control: Control<AttributeFormValues>,
  enabled: boolean,
): AttributeOptions {
  const source = attribute.optionSource;
  const live = enabled && Boolean(source);

  // A cascade level depends on the ones above it, outermost first: company for
  // an organization, company + organization for a group. Which fields those
  // are is per-attribute (the Coordinator and Implementer trios each cascade
  // within themselves), so they are read off the attribute rather than named
  // here.
  //
  // These watches are disabled by `dependsOn` alone - never by `enabled` - so
  // the flag stays constant for the life of a row: a watch that toggled off and
  // back on would resubscribe holding the value it had when it was switched
  // off, which for a cascade parent means querying the wrong company.
  const [companyDependency, organizationDependency] = attribute.dependsOn ?? [];

  const company = asString(
    useWatch({
      control,
      name: dependencyPath(attribute.system, companyDependency),
      disabled: !companyDependency,
    }),
  );
  const organization = asString(
    useWatch({
      control,
      name: dependencyPath(attribute.system, organizationDependency),
      disabled: !organizationDependency,
    }),
  );

  // The outermost level still left blank - the lookup cannot run until it is
  // filled, and it is what the row tells the user to pick first.
  const missing =
    companyDependency && !company
      ? companyDependency
      : organizationDependency && !organization
        ? organizationDependency
        : undefined;

  const companyQuery = useGetImplCompanyOptionsQuery(undefined, {
    skip: !live || source !== "implCompany",
  });
  const organizationQuery = useGetImplOrganizationOptionsQuery(
    { company },
    { skip: !live || source !== "implOrganization" || Boolean(missing) },
  );
  const groupQuery = useGetImplGroupOptionsQuery(
    { company, organization },
    { skip: !live || source !== "implGroup" || Boolean(missing) },
  );

  if (!source) return { options: attribute.values ?? [], isLoading: false };

  if (missing) return { options: [], isLoading: false, blockedBy: missing.label };

  const query =
    source === "implCompany"
      ? companyQuery
      : source === "implOrganization"
        ? organizationQuery
        : groupQuery;

  // The catalog list is the fallback for a *failed* lookup only. An empty
  // successful response is a real answer ("this combination has no groups"),
  // and quietly replacing it with the hardcoded list would offer values the
  // backend just said are invalid here.
  return {
    options: query.isError ? (attribute.values ?? []) : (query.data ?? []),
    isLoading: query.isFetching,
  };
}
