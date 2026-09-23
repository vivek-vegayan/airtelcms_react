import { useCallback, useState } from "react";
import {
  useGetVerticalsQuery,
  useCreateVerticalMutation,
  useUpdateVerticalMutation,
  useChangeVerticalStatusMutation,
  useGetFunctionsQuery,
  useCreateFunctionMutation,
  useUpdateFunctionMutation,
  useChangeFunctionStatusMutation,
  useGetDomainsQuery,
  useCreateDomainMutation,
  useUpdateDomainMutation,
  useChangeDomainStatusMutation,
  useGetSubDomainsQuery,
  useCreateSubDomainMutation,
  useUpdateSubDomainMutation,
  useChangeSubDomainStatusMutation,
} from "../api/orgConfigApi";
import { extractApiErrorMessage } from "../../globalAdminSetting/utils/permissionUtils";
import {
  DEFAULT_RAIL_LIST_STATE,
  PAGE_SIZE,
  STATUS_FILTER_PARAM,
  type OrgConfirmDialogState,
  type OrgDrawerState,
  type OrgLevel,
  type OrgMenuAnchor,
  type OrgSnackbarState,
  type RailListState,
  type StatusFilter,
} from "../types/orgConfigTypes";

export function useOrgConfigController() {
  const [activeVerticalId, setActiveVerticalId] = useState<number | null>(null);
  const [activeFunctionId, setActiveFunctionId] = useState<number | null>(null);
  const [activeDomainId, setActiveDomainId] = useState<number | null>(null);

  const [railState, setRailState] = useState<Record<OrgLevel, RailListState>>({
    vertical: DEFAULT_RAIL_LIST_STATE,
    function: DEFAULT_RAIL_LIST_STATE,
    domain: DEFAULT_RAIL_LIST_STATE,
    "sub-domain": DEFAULT_RAIL_LIST_STATE,
  });

  const [drawerState, setDrawerState] = useState<OrgDrawerState | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<OrgMenuAnchor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<OrgConfirmDialogState>({
    open: false,
    title: "",
    body: "",
    onConfirm: () => {},
  });
  const [snackbar, setSnackbar] = useState<OrgSnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const setSearch = useCallback((level: OrgLevel, value: string) => {
    setRailState((prev) => ({ ...prev, [level]: { ...prev[level], search: value, page: 0 } }));
  }, []);
  const setStatusFilter = useCallback((level: OrgLevel, value: StatusFilter) => {
    setRailState((prev) => ({ ...prev, [level]: { ...prev[level], statusFilter: value, page: 0 } }));
  }, []);
  const setPage = useCallback((level: OrgLevel, value: number) => {
    setRailState((prev) => ({ ...prev, [level]: { ...prev[level], page: value } }));
  }, []);

  const selectVertical = useCallback((id: number | null) => {
    setActiveVerticalId(id);
    setActiveFunctionId(null);
    setActiveDomainId(null);
    setRailState((prev) => ({
      ...prev,
      function: DEFAULT_RAIL_LIST_STATE,
      domain: DEFAULT_RAIL_LIST_STATE,
      "sub-domain": DEFAULT_RAIL_LIST_STATE,
    }));
  }, []);

  const selectFunction = useCallback((id: number | null) => {
    setActiveFunctionId(id);
    setActiveDomainId(null);
    setRailState((prev) => ({ ...prev, domain: DEFAULT_RAIL_LIST_STATE, "sub-domain": DEFAULT_RAIL_LIST_STATE }));
  }, []);

  const selectDomain = useCallback((id: number | null) => {
    setActiveDomainId(id);
    setRailState((prev) => ({ ...prev, "sub-domain": DEFAULT_RAIL_LIST_STATE }));
  }, []);

  // ── Queries ──────────────────────────────────────────────────
  const verticalListArgs = {
    search: railState.vertical.search || undefined,
    statusFilter: STATUS_FILTER_PARAM[railState.vertical.statusFilter],
    page: railState.vertical.page,
    size: PAGE_SIZE,
  };
  const { data: verticalsPage, isFetching: verticalsLoading } = useGetVerticalsQuery(verticalListArgs);
  const verticals = verticalsPage?.content ?? [];

  const { data: functionsPage, isFetching: functionsLoading } = useGetFunctionsQuery(
    {
      verticalId: activeVerticalId ?? undefined,
      search: railState.function.search || undefined,
      statusFilter: STATUS_FILTER_PARAM[railState.function.statusFilter],
      page: railState.function.page,
      size: PAGE_SIZE,
    },
    { skip: !activeVerticalId },
  );
  const functions = functionsPage?.content ?? [];

  const { data: domainsPage, isFetching: domainsLoading } = useGetDomainsQuery(
    {
      functionId: activeFunctionId ?? undefined,
      search: railState.domain.search || undefined,
      statusFilter: STATUS_FILTER_PARAM[railState.domain.statusFilter],
      page: railState.domain.page,
      size: PAGE_SIZE,
    },
    { skip: !activeFunctionId },
  );
  const domains = domainsPage?.content ?? [];

  const { data: subDomainsPage, isFetching: subDomainsLoading } = useGetSubDomainsQuery(
    {
      domainId: activeDomainId ?? undefined,
      search: railState["sub-domain"].search || undefined,
      statusFilter: STATUS_FILTER_PARAM[railState["sub-domain"].statusFilter],
      page: railState["sub-domain"].page,
      size: PAGE_SIZE,
    },
    { skip: !activeDomainId },
  );
  const subDomains = subDomainsPage?.content ?? [];

  const activeVertical = verticals.find((v) => v.verticalId === activeVerticalId);
  const activeFunction = functions.find((f) => f.functionId === activeFunctionId);
  const activeDomain = domains.find((d) => d.domainId === activeDomainId);

  // ── Mutations ────────────────────────────────────────────────
  const [createVerticalMutation] = useCreateVerticalMutation();
  const [updateVerticalMutation] = useUpdateVerticalMutation();
  const [changeVerticalStatusMutation] = useChangeVerticalStatusMutation();

  const [createFunctionMutation] = useCreateFunctionMutation();
  const [updateFunctionMutation] = useUpdateFunctionMutation();
  const [changeFunctionStatusMutation] = useChangeFunctionStatusMutation();

  const [createDomainMutation] = useCreateDomainMutation();
  const [updateDomainMutation] = useUpdateDomainMutation();
  const [changeDomainStatusMutation] = useChangeDomainStatusMutation();

  const [createSubDomainMutation] = useCreateSubDomainMutation();
  const [updateSubDomainMutation] = useUpdateSubDomainMutation();
  const [changeSubDomainStatusMutation] = useChangeSubDomainStatusMutation();

  // ── Vertical handlers ────────────────────────────────────────
  const handleCreateVertical = useCallback(
    async (code: string, name: string) => {
      try {
        await createVerticalMutation({ code, name }).unwrap();
        setSnackbar({ open: true, message: `Vertical "${code}" created.`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create vertical."), severity: "error" });
      }
    },
    [createVerticalMutation],
  );

  const handleUpdateVertical = useCallback(
    async (verticalId: number, code: string, name: string) => {
      try {
        await updateVerticalMutation({ verticalId, code, name }).unwrap();
        setSnackbar({ open: true, message: "Vertical updated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to update vertical."), severity: "error" });
      }
    },
    [updateVerticalMutation],
  );

  const handleChangeVerticalStatus = useCallback(
    async (verticalId: number, isActive: boolean) => {
      try {
        await changeVerticalStatusMutation({ verticalId, isActive }).unwrap();
        setSnackbar({ open: true, message: isActive ? "Vertical reactivated." : "Vertical deactivated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to change vertical status."), severity: "error" });
      }
    },
    [changeVerticalStatusMutation],
  );

  // ── Function handlers ────────────────────────────────────────
  const handleCreateFunction = useCallback(
    async (verticalId: number, code: string, name: string) => {
      try {
        await createFunctionMutation({ verticalId, code, name }).unwrap();
        setSnackbar({ open: true, message: `Function "${code}" created.`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create function."), severity: "error" });
      }
    },
    [createFunctionMutation],
  );

  const handleUpdateFunction = useCallback(
    async (functionId: number, code: string, name: string) => {
      try {
        await updateFunctionMutation({ functionId, code, name }).unwrap();
        setSnackbar({ open: true, message: "Function updated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to update function."), severity: "error" });
      }
    },
    [updateFunctionMutation],
  );

  const handleChangeFunctionStatus = useCallback(
    async (functionId: number, isActive: boolean) => {
      try {
        await changeFunctionStatusMutation({ functionId, isActive }).unwrap();
        setSnackbar({ open: true, message: isActive ? "Function reactivated." : "Function deactivated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to change function status."), severity: "error" });
      }
    },
    [changeFunctionStatusMutation],
  );

  // ── Domain handlers ──────────────────────────────────────────
  const handleCreateDomain = useCallback(
    async (functionId: number, code: string, name: string) => {
      try {
        await createDomainMutation({ functionId, code, name }).unwrap();
        setSnackbar({ open: true, message: `Domain "${code}" created.`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create domain."), severity: "error" });
      }
    },
    [createDomainMutation],
  );

  const handleUpdateDomain = useCallback(
    async (domainId: number, code: string, name: string) => {
      try {
        await updateDomainMutation({ domainId, code, name }).unwrap();
        setSnackbar({ open: true, message: "Domain updated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to update domain."), severity: "error" });
      }
    },
    [updateDomainMutation],
  );

  const handleChangeDomainStatus = useCallback(
    async (domainId: number, isActive: boolean) => {
      try {
        await changeDomainStatusMutation({ domainId, isActive }).unwrap();
        setSnackbar({ open: true, message: isActive ? "Domain reactivated." : "Domain deactivated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to change domain status."), severity: "error" });
      }
    },
    [changeDomainStatusMutation],
  );

  // ── Sub Domain handlers ──────────────────────────────────────
  const handleCreateSubDomain = useCallback(
    async (domainId: number, code: string, name: string) => {
      try {
        await createSubDomainMutation({ domainId, code, name }).unwrap();
        setSnackbar({ open: true, message: `Sub domain "${code}" created.`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create sub domain."), severity: "error" });
      }
    },
    [createSubDomainMutation],
  );

  const handleUpdateSubDomain = useCallback(
    async (subDomainId: number, code: string, name: string) => {
      try {
        await updateSubDomainMutation({ subDomainId, code, name }).unwrap();
        setSnackbar({ open: true, message: "Sub domain updated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to update sub domain."), severity: "error" });
      }
    },
    [updateSubDomainMutation],
  );

  const handleChangeSubDomainStatus = useCallback(
    async (subDomainId: number, isActive: boolean) => {
      try {
        await changeSubDomainStatusMutation({ subDomainId, isActive }).unwrap();
        setSnackbar({ open: true, message: isActive ? "Sub domain reactivated." : "Sub domain deactivated.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to change sub domain status."), severity: "error" });
      }
    },
    [changeSubDomainStatusMutation],
  );

  return {
    // selection
    activeVerticalId,
    activeFunctionId,
    activeDomainId,
    activeVertical,
    activeFunction,
    activeDomain,
    selectVertical,
    selectFunction,
    selectDomain,

    // rail list state
    railState,
    setSearch,
    setStatusFilter,
    setPage,

    // data
    verticals,
    verticalsLoading,
    verticalsTotalPages: verticalsPage?.totalPages ?? 0,
    functions,
    functionsLoading,
    functionsTotalPages: functionsPage?.totalPages ?? 0,
    domains,
    domainsLoading,
    domainsTotalPages: domainsPage?.totalPages ?? 0,
    subDomains,
    subDomainsLoading,
    subDomainsTotalPages: subDomainsPage?.totalPages ?? 0,

    // ui state
    drawerState,
    setDrawerState,
    menuAnchor,
    setMenuAnchor,
    confirmDialog,
    setConfirmDialog,
    snackbar,
    setSnackbar,

    // handlers
    handleCreateVertical,
    handleUpdateVertical,
    handleChangeVerticalStatus,
    handleCreateFunction,
    handleUpdateFunction,
    handleChangeFunctionStatus,
    handleCreateDomain,
    handleUpdateDomain,
    handleChangeDomainStatus,
    handleCreateSubDomain,
    handleUpdateSubDomain,
    handleChangeSubDomainStatus,
  };
}
