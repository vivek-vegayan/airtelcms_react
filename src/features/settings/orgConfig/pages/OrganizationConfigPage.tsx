import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, CircularProgress, Snackbar, Alert, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import {
  CorporateFareOutlined,
  WorkOutlineOutlined,
  CategoryOutlined,
  BookmarkBorderOutlined,
  AddOutlined,
  DriveFileRenameOutlineOutlined,
  BlockOutlined,
  CheckCircleOutlineOutlined,
} from "@mui/icons-material";
import { useTabColorTokens } from "../../../../style/theme";
import { useOrgConfigController } from "../hooks/useOrgConfigController";
import { RailItem } from "../components/RailItem";
import { SearchAndStatusFilterBar } from "../components/SearchAndStatusFilterBar";
import { CreateEditEntityDrawer } from "../components/CreateEditEntityDrawer";
import { ConfirmDialog } from "../../../../components/common/ConfirmDialog";
import { OrgConfigBreadcrumb } from "../components/OrgConfigBreadcrumb";
import type { OrgLevel } from "../types/orgConfigTypes";

export const OrganizationConfigPage: React.FC = () => {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const s = useOrgConfigController();

  const railSx = {
    flex: 1,
    minWidth: 0,
    bgcolor: c.surface,
    borderRight: `1px solid ${c.border}`,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  } as const;

  const railHeadSx = {
    px: 2,
    pt: 2,
    pb: 1.25,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as const;

  const iconBtnSx = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: "6px",
    border: `1px solid ${c.border}`,
    bgcolor: "transparent",
    color: c.textSecondary,
    cursor: "pointer",
    transition: "all 0.1s",
    "&:hover": {
      bgcolor: c.accentDim,
      color: c.accent,
      border: `1px solid ${c.accentBorder}`,
    },
  } as const;

  const renderEmpty = (text: string) => (
    <Typography fontSize="0.75rem" color={c.textDim} px={1.5} py={2}>
      {text}
    </Typography>
  );

  const openMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    level: OrgLevel,
    entity: { id: number; code: string; name: string; isActive: boolean },
  ) => {
    s.setMenuAnchor({ el: e.currentTarget, level, ...entity });
  };

  const openCreateDrawer = (level: OrgLevel, parentId: number | undefined, parentLabel: string | undefined) => {
    s.setDrawerState({ level, mode: "create", parentId, parentLabel });
  };

  const openEditDrawer = (level: OrgLevel, entityId: number, code: string, name: string) => {
    s.setDrawerState({ level, mode: "edit", entityId, initialCode: code, initialName: name });
  };

  const handleDrawerCreate = async (code: string, name: string) => {
    if (!s.drawerState) return;
    const { level, parentId } = s.drawerState;
    if (level === "vertical") await s.handleCreateVertical(code, name);
    else if (level === "function" && parentId) await s.handleCreateFunction(parentId, code, name);
    else if (level === "domain" && parentId) await s.handleCreateDomain(parentId, code, name);
    else if (level === "sub-domain" && parentId) await s.handleCreateSubDomain(parentId, code, name);
  };

  const handleDrawerUpdate = async (entityId: number, code: string, name: string) => {
    if (!s.drawerState) return;
    const { level } = s.drawerState;
    if (level === "vertical") await s.handleUpdateVertical(entityId, code, name);
    else if (level === "function") await s.handleUpdateFunction(entityId, code, name);
    else if (level === "domain") await s.handleUpdateDomain(entityId, code, name);
    else if (level === "sub-domain") await s.handleUpdateSubDomain(entityId, code, name);
  };

  const handleToggleStatus = (level: OrgLevel, id: number, nextActive: boolean) => {
    if (level === "vertical") s.handleChangeVerticalStatus(id, nextActive);
    else if (level === "function") s.handleChangeFunctionStatus(id, nextActive);
    else if (level === "domain") s.handleChangeDomainStatus(id, nextActive);
    else if (level === "sub-domain") s.handleChangeSubDomainStatus(id, nextActive);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "80vh", bgcolor: c.bg }}>
      <Box sx={{ px: 1 }}>
        <OrgConfigBreadcrumb
          segments={[s.activeVertical?.verticalName, s.activeFunction?.functionName, s.activeDomain?.domainName]}
          c={c}
        />
      </Box>

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden", border: `1px solid ${c.border}`, borderRadius: "10px" }}>
        {/* ── Rail 1: Verticals ── */}
        <Box sx={railSx}>
          <Box sx={railHeadSx}>
            <Typography fontSize="0.68rem" fontWeight={700} color={c.textDim} letterSpacing="0.08em" textTransform="uppercase">
              Verticals
            </Typography>
            <Box component="button" sx={iconBtnSx} onClick={() => openCreateDrawer("vertical", undefined, undefined)}>
              <AddOutlined sx={{ fontSize: 14 }} />
            </Box>
          </Box>
          <SearchAndStatusFilterBar
            search={s.railState.vertical.search}
            onSearchChange={(v) => s.setSearch("vertical", v)}
            statusFilter={s.railState.vertical.statusFilter}
            onStatusFilterChange={(v) => s.setStatusFilter("vertical", v)}
            page={s.railState.vertical.page}
            totalPages={s.verticalsTotalPages}
            onPageChange={(p) => s.setPage("vertical", p)}
            c={c}
          />
          <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1.5 }}>
            {s.verticalsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={20} sx={{ color: c.accent }} />
              </Box>
            ) : s.verticals.length === 0 ? (
              renderEmpty("No verticals found.")
            ) : (
              s.verticals.map((v) => (
                <RailItem
                  key={v.verticalId}
                  label={v.verticalName}
                  sublabel={v.verticalCode}
                  isActive={v.verticalId === s.activeVerticalId}
                  isEntityActive={v.isActive}
                  icon={<CorporateFareOutlined sx={{ fontSize: 13 }} />}
                  onClick={() => s.selectVertical(v.verticalId)}
                  onMenuClick={(e) =>
                    openMenu(e, "vertical", { id: v.verticalId, code: v.verticalCode, name: v.verticalName, isActive: v.isActive })
                  }
                  c={c}
                />
              ))
            )}
          </Box>
        </Box>

        {/* ── Rail 2: Team Functions ── */}
        <Box sx={{ ...railSx, bgcolor: c.isDark ? "rgba(255,255,255,0.01)" : "rgba(13,27,42,0.015)" }}>
          <Box sx={railHeadSx}>
            <Typography fontSize="0.68rem" fontWeight={700} color={c.textDim} letterSpacing="0.08em" textTransform="uppercase">
              Team Functions
            </Typography>
            {s.activeVerticalId && (
              <Box
                component="button"
                sx={iconBtnSx}
                onClick={() => openCreateDrawer("function", s.activeVerticalId!, s.activeVertical?.verticalName)}
              >
                <AddOutlined sx={{ fontSize: 14 }} />
              </Box>
            )}
          </Box>
          {!s.activeVerticalId ? (
            renderEmpty("Select a vertical.")
          ) : (
            <>
              <SearchAndStatusFilterBar
                search={s.railState.function.search}
                onSearchChange={(v) => s.setSearch("function", v)}
                statusFilter={s.railState.function.statusFilter}
                onStatusFilterChange={(v) => s.setStatusFilter("function", v)}
                page={s.railState.function.page}
                totalPages={s.functionsTotalPages}
                onPageChange={(p) => s.setPage("function", p)}
                c={c}
              />
              <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1.5 }}>
                {s.functionsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={20} sx={{ color: c.accent }} />
                  </Box>
                ) : s.functions.length === 0 ? (
                  renderEmpty("No team functions found.")
                ) : (
                  s.functions.map((f) => (
                    <RailItem
                      key={f.functionId}
                      label={f.functionName}
                      sublabel={f.functionCode}
                      isActive={f.functionId === s.activeFunctionId}
                      isEntityActive={f.isActive}
                      icon={<WorkOutlineOutlined sx={{ fontSize: 13 }} />}
                      onClick={() => s.selectFunction(f.functionId)}
                      onMenuClick={(e) =>
                        openMenu(e, "function", { id: f.functionId, code: f.functionCode, name: f.functionName, isActive: f.isActive })
                      }
                      c={c}
                    />
                  ))
                )}
              </Box>
            </>
          )}
        </Box>

        {/* ── Rail 3: Domains ── */}
        <Box sx={railSx}>
          <Box sx={railHeadSx}>
            <Typography fontSize="0.68rem" fontWeight={700} color={c.textDim} letterSpacing="0.08em" textTransform="uppercase">
              Domains
            </Typography>
            {s.activeFunctionId && (
              <Box
                component="button"
                sx={iconBtnSx}
                onClick={() => openCreateDrawer("domain", s.activeFunctionId!, s.activeFunction?.functionName)}
              >
                <AddOutlined sx={{ fontSize: 14 }} />
              </Box>
            )}
          </Box>
          {!s.activeFunctionId ? (
            renderEmpty("Select a team function.")
          ) : (
            <>
              <SearchAndStatusFilterBar
                search={s.railState.domain.search}
                onSearchChange={(v) => s.setSearch("domain", v)}
                statusFilter={s.railState.domain.statusFilter}
                onStatusFilterChange={(v) => s.setStatusFilter("domain", v)}
                page={s.railState.domain.page}
                totalPages={s.domainsTotalPages}
                onPageChange={(p) => s.setPage("domain", p)}
                c={c}
              />
              <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1.5 }}>
                {s.domainsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={20} sx={{ color: c.accent }} />
                  </Box>
                ) : s.domains.length === 0 ? (
                  renderEmpty("No domains found.")
                ) : (
                  s.domains.map((d) => (
                    <RailItem
                      key={d.domainId}
                      label={d.domainName}
                      sublabel={d.domainCode}
                      isActive={d.domainId === s.activeDomainId}
                      isEntityActive={d.isActive}
                      icon={<CategoryOutlined sx={{ fontSize: 13 }} />}
                      onClick={() => s.selectDomain(d.domainId)}
                      onMenuClick={(e) =>
                        openMenu(e, "domain", { id: d.domainId, code: d.domainCode, name: d.domainName, isActive: d.isActive })
                      }
                      c={c}
                    />
                  ))
                )}
              </Box>
            </>
          )}
        </Box>

        {/* ── Rail 4: Sub Domains ── */}
        <Box sx={{ ...railSx, borderRight: "none", bgcolor: c.isDark ? "rgba(255,255,255,0.01)" : "rgba(13,27,42,0.015)" }}>
          <Box sx={railHeadSx}>
            <Typography fontSize="0.68rem" fontWeight={700} color={c.textDim} letterSpacing="0.08em" textTransform="uppercase">
              Sub Domains
            </Typography>
            {s.activeDomainId && (
              <Box
                component="button"
                sx={iconBtnSx}
                onClick={() => openCreateDrawer("sub-domain", s.activeDomainId!, s.activeDomain?.domainName)}
              >
                <AddOutlined sx={{ fontSize: 14 }} />
              </Box>
            )}
          </Box>
          {!s.activeDomainId ? (
            renderEmpty("Select a domain.")
          ) : (
            <>
              <SearchAndStatusFilterBar
                search={s.railState["sub-domain"].search}
                onSearchChange={(v) => s.setSearch("sub-domain", v)}
                statusFilter={s.railState["sub-domain"].statusFilter}
                onStatusFilterChange={(v) => s.setStatusFilter("sub-domain", v)}
                page={s.railState["sub-domain"].page}
                totalPages={s.subDomainsTotalPages}
                onPageChange={(p) => s.setPage("sub-domain", p)}
                c={c}
              />
              <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1.5 }}>
                {s.subDomainsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={20} sx={{ color: c.accent }} />
                  </Box>
                ) : s.subDomains.length === 0 ? (
                  renderEmpty("No sub domains found.")
                ) : (
                  s.subDomains.map((sd) => (
                    <RailItem
                      key={sd.subDomainId}
                      label={sd.subDomainName}
                      sublabel={sd.subDomainCode}
                      isActive={false}
                      isEntityActive={sd.isActive}
                      icon={<BookmarkBorderOutlined sx={{ fontSize: 13 }} />}
                      onClick={() => {}}
                      onMenuClick={(e) =>
                        openMenu(e, "sub-domain", {
                          id: sd.subDomainId,
                          code: sd.subDomainCode,
                          name: sd.subDomainName,
                          isActive: sd.isActive,
                        })
                      }
                      c={c}
                    />
                  ))
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* ── Row context menu (shared across all 4 levels) ── */}
      <Menu
        anchorEl={s.menuAnchor?.el}
        open={!!s.menuAnchor}
        onClose={() => s.setMenuAnchor(null)}
        PaperProps={{ sx: { bgcolor: c.surface, border: `1px solid ${c.border}`, borderRadius: "8px", minWidth: 200 } }}
      >
        {s.menuAnchor && (
          <>
            <MenuItem
              sx={{ fontSize: "0.8rem", color: c.textPrimary }}
              onClick={() => {
                const { level, id, code, name } = s.menuAnchor!;
                s.setMenuAnchor(null);
                openEditDrawer(level, id, code, name);
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <DriveFileRenameOutlineOutlined sx={{ fontSize: 14, color: c.textSecondary }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>Edit…</ListItemText>
            </MenuItem>

            <Divider sx={{ borderColor: c.border, my: "4px" }} />

            {s.menuAnchor.isActive ? (
              <MenuItem
                sx={{ fontSize: "0.8rem", color: c.danger }}
                onClick={() => {
                  const { level, id, name } = s.menuAnchor!;
                  s.setMenuAnchor(null);
                  s.setConfirmDialog({
                    open: true,
                    title: "Deactivate?",
                    body:
                      level === "sub-domain"
                        ? `This deactivates "${name}". It will no longer appear in active pickers elsewhere in the app until reactivated.`
                        : `This deactivates "${name}" and cascades deactivation to everything beneath it in the hierarchy. It will no longer appear in active pickers elsewhere in the app until reactivated.`,
                    confirmLabel: "Deactivate",
                    onConfirm: () => {
                      handleToggleStatus(level, id, false);
                      s.setConfirmDialog((d) => ({ ...d, open: false }));
                    },
                  });
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <BlockOutlined sx={{ fontSize: 14, color: c.danger }} />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", color: c.danger }}>Deactivate…</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem
                sx={{ fontSize: "0.8rem", color: c.textPrimary }}
                onClick={() => {
                  const { level, id } = s.menuAnchor!;
                  s.setMenuAnchor(null);
                  handleToggleStatus(level, id, true);
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CheckCircleOutlineOutlined sx={{ fontSize: 14, color: c.textSecondary }} />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>Reactivate</ListItemText>
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      <CreateEditEntityDrawer
        open={!!s.drawerState}
        state={s.drawerState}
        onClose={() => s.setDrawerState(null)}
        onCreate={handleDrawerCreate}
        onUpdate={handleDrawerUpdate}
        c={c}
      />

      <ConfirmDialog state={s.confirmDialog} onClose={() => s.setConfirmDialog((d) => ({ ...d, open: false }))} c={c} />

      <Snackbar
        open={s.snackbar.open}
        autoHideDuration={3000}
        onClose={() => s.setSnackbar((sb) => ({ ...sb, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={s.snackbar.severity}
          onClose={() => s.setSnackbar((sb) => ({ ...sb, open: false }))}
          variant="filled"
          sx={{ fontSize: "0.8rem", borderRadius: "8px" }}
        >
          {s.snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
