import { useState, useCallback } from "react";
import { Box, Button, Tooltip } from "@mui/material";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";

import { useAuth } from "../../../auth/hooks/useAuth";
import { usePermission } from "../../../../rbac/usePermission";
import { useOrgHierarchyFilters } from "../../../orgHierarchy/hooks/useOrgHierarchyFilters";
import OrgHierarchyFilters from "../../../orgHierarchy/components/OrgHierarchyFiltersV2";
import type { OrgFilterValues } from "../../../orgHierarchy/types/orgHierarchy.types";
import { AddMemberDialog } from "../dialog/AddMemberDialog";
import AddMemberTypeDialog from "../dialog/AddMemberTypeDialog";
import { UploadEmployeeDialog } from "../dialog/UploadEmployeeDialog";
import { ExportPanel } from "./ExportPanel";
import { RichStatusToggle } from "./RichStatusToggle";

/* ── Props ── */
interface Props {
  filters: OrgFilterValues;
  setFilters: React.Dispatch<React.SetStateAction<OrgFilterValues>>;
  status: "ACTIVE" | "INACTIVE";
  setStatus: React.Dispatch<React.SetStateAction<"ACTIVE" | "INACTIVE">>;
  //  new props wired from TeamManagementMain
  filteredRows: Record<string, any>[];
  totalRowCount: number;
  currentPageSize: number;
  /** Refetches the member list + counts owned by TeamManagementMain. */
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const TeamManagementFilter = ({
  filters,
  setFilters,
  status,
  setStatus,
  filteredRows,
  totalRowCount,
  currentPageSize,
  onRefresh,
  isRefreshing,
}: Props) => {
  const { user: loggedUser } = useAuth();
  const actorUserId = loggedUser ? Number(loggedUser.userId) : undefined;
  const roleName    = loggedUser?.roleCode ?? "TEAM_MEMBER";
  const { can } = usePermission();
  const canCreateTeam = can("Team Management", "CREATE");
  const { options } = useOrgHierarchyFilters(filters);

  const [openTypeDialog,   setOpenTypeDialog]   = useState(false);
  const [openAddDialog,    setOpenAddDialog]    = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  const handleFilterChange = useCallback(
    (key: keyof OrgFilterValues, value?: number) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "vertical")    { delete next.teamFunction; delete next.domain; delete next.subDomain; }
        if (key === "teamFunction"){ delete next.domain; delete next.subDomain; }
        if (key === "domain")      { delete next.subDomain; }
        return next;
      });
    },
    [setFilters],
  );

  return (
    <>
      <OrgHierarchyFilters
        role={roleName}
        values={filters}
        options={options}
        onChange={handleFilterChange}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        refreshDisabled={filters.subDomain == null}
        refreshTooltip={
          filters.subDomain != null ? "Refresh members" : "Pick a Sub Domain first"
        }
      >
        {/* Single row next to the org pickers: takes whatever width is left
            and is the container-query root, so the Add Member button drops
            to icon-only when that space gets tight instead of wrapping. */}
        <Box
          sx={{
            display: "flex", flexWrap: "nowrap", alignItems: "center",
            gap: 1.5, flex: "1 1 auto", minWidth: 0,
            containerType: "inline-size", containerName: "team-actions",
          }}
        >
          {/* LEFT: status toggle */}
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <RichStatusToggle
              status={status}
              setStatus={setStatus}
              activeCount={15}
              inactiveCount={4}
            />
          </Box>

          {/* RIGHT: action buttons */}
          <Box
            sx={{
              display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 1.5,
              ml: "auto", flexShrink: 0,
            }}
          >
            {canCreateTeam && (
              <Tooltip title="Add Member">
                <Button
                  variant="contained"
                  disableElevation
                  aria-label="Add Member"
                  startIcon={<PersonAddAltIcon />}
                  onClick={() => setOpenTypeDialog(true)}
                  sx={{
                    height: 36, flexShrink: 0,
                    textTransform: "none", fontWeight: 600,
                    borderRadius: "8px", px: 2, whiteSpace: "nowrap",
                    "@container team-actions (max-width: 300px)": {
                      minWidth: 36, px: 0,
                      "& .MuiButton-startIcon": { m: 0 },
                      "& .add-member-label": { display: "none" },
                    },
                  }}
                >
                  <span className="add-member-label">Add Member</span>
                </Button>
              </Tooltip>
            )}

            {/*  ExportPanel now receives live data props */}
            <Box sx={{ flexShrink: 0, display: "flex" }}>
              <ExportPanel
                filteredRows={filteredRows}
                totalRowCount={totalRowCount}
                currentPageSize={currentPageSize}
              />
            </Box>
          </Box>
        </Box>
      </OrgHierarchyFilters>

      {/* Pick how to add: single member or Excel upload */}
      <AddMemberTypeDialog
        open={openTypeDialog}
        onClose={() => setOpenTypeDialog(false)}
        onSelectSingle={() => {
          setOpenTypeDialog(false);
          if (actorUserId) setOpenAddDialog(true);
        }}
        onSelectUpload={() => {
          setOpenTypeDialog(false);
          setOpenUploadDialog(true);
        }}
      />

      {actorUserId && (
        <AddMemberDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          actorUserId={actorUserId}
        />
      )}
      <UploadEmployeeDialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
      />
    </>
  );
};
