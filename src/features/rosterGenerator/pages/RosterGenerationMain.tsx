import { Box, CircularProgress, useTheme } from "@mui/material";
import { lazy, Suspense, useState } from "react";
import { authStorage } from "../../../app/store/auth.storage";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useApiRefresh, type ApiTag } from "../../../hooks/useApiRefresh";
import { useTabColorTokens } from "../../../style/theme";
import RosterTabStrip from "../components/rosterGeneration/RosterTabStrip";
import GenerateRosterButton from "../components/rosterGeneration/GenerateRosterButton";
import RosterEmptyState from "../components/rosterGeneration/RosterEmptyState";
import { ROSTER_TABS, resolveAccent } from "../components/rosterGeneration/rosterTabsConfig";
import { useGenerateRoster } from "../components/rosterGeneration/useGenerateRoster";

const GoldenGridScreen = lazy(() => import("../components/goldenSet/GoldenGridScreen"));
const GridscreenMain = lazy(() => import("../components/Week7Preview/GridscreenMain"));

function TabContentFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

// The Golden Set and Week-7 grids each own their query; refreshing by tag hits
// whichever tab is mounted without threading a refetch through the tab strip.
const ROSTER_GEN_TAGS: ApiTag[] = ["GoldenSetTag", "FutureWeekTag"];

export const RosterGenerationMain = () => {
  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";
  const { values, handleChange } = useOrgHierarchyState("rosterGeneration");
  const { options } = useOrgHierarchyFilters(values);
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const [activeTab, setActiveTab] = useState(0);
  const { isGenerating, generate } = useGenerateRoster();
  const { refresh, isRefreshing } = useApiRefresh({ tags: ROSTER_GEN_TAGS });

  const hasSubDomain = Boolean(values.subDomain);
  const activeConfig = ROSTER_TABS[activeTab];
  const { main: activeAccentColor } = resolveAccent(tk, activeConfig.accent);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bgcolor: tk.bg,
      }}
    >
      {/* ── Filters ── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 1.5,
          pt: 1,
          pb: 0.75,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <OrgHierarchyFilters
          role={roleName}
          values={values}
          options={options}
          onChange={handleChange}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          refreshDisabled={!hasSubDomain}
          refreshTooltip={
            hasSubDomain ? "Refresh roster grid" : "Pick a Sub Domain first"
          }
        />
      </Box>

      {/* ── Tab bar + content card ── */}
      <Box
        sx={{
          flex: 1,
          mx: 1.5,
          mb: 1.5,
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${tk.border}`,
          borderRadius: tk.radiusL,
          overflow: "hidden",
          bgcolor: tk.surface,
          minHeight: 0,
        }}
      >
        <RosterTabStrip
          tabs={ROSTER_TABS}
          activeIndex={activeTab}
          onChange={setActiveTab}
          tk={tk}
          metaLabel={activeConfig.metaLabel}
          metaColor={activeAccentColor}
        >
          <GenerateRosterButton
            isGenerating={isGenerating}
            onGenerate={generate}
            tk={tk}
            accent={activeConfig.accent}
          />
        </RosterTabStrip>

        {/* ── Tab content ── */}
        <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          {!hasSubDomain ? (
            <RosterEmptyState textColor={tk.textSecondary} />
          ) : (
            <Suspense fallback={<TabContentFallback />}>
              {activeTab === 0 && (
                <GoldenGridScreen
                  teamId={values.teamFunction}
                  subTeamId={values.subDomain}
                />
              )}
              {activeTab === 1 && (
                <GridscreenMain subDomainId={values.subDomain} />
              )}
            </Suspense>
          )}
        </Box>
      </Box>
    </Box>
  );
};
