import { useState, useCallback } from "react";
import { Box, Button } from "@mui/material";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";

import { authStorage } from "../../../../app/store/auth.storage";
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
  const loggedUser  = authStorage.getUser();
  const actorUserId = loggedUser?.userId;
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
        <Box
          sx={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            justifyContent: "space-between", gap: 2, width: "100%",
          }}
        >
          {/* LEFT: status toggle */}
          <Box
            sx={{
              display: "flex", flex: "1 1 auto",
              minWidth: { xs: "100%", sm: "max-content" },
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
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
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2,
              flex: "1 1 auto",
              justifyContent: { xs: "center", sm: "flex-start", md: "flex-end" },
              minWidth: { xs: "100%", sm: "max-content" },
            }}
          >
            {canCreateTeam && (
              <Button
                variant="contained"
                disableElevation
                startIcon={<PersonAddAltIcon />}
                onClick={() => setOpenTypeDialog(true)}
                sx={{
                  flex: { xs: "1 1 100%", sm: "0 1 auto" },
                  minWidth: "max-content",
                  textTransform: "none", fontWeight: 600,
                  borderRadius: "8px", px: 2, whiteSpace: "nowrap",
                }}
              >
                Add Member
              </Button>
            )}

            {/*  ExportPanel now receives live data props */}
            <Box sx={{ flex: { xs: "1 1 100%", sm: "0 1 auto" }, minWidth: "max-content", display: "flex" }}>
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
