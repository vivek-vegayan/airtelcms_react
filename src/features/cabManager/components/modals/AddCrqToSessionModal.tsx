import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog, DialogActions, DialogContent, DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { authStorage } from "../../../../app/store/auth.storage";
import OrgHierarchyFilters from "../../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useOrgHierarchyFilters } from "../../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgHierarchyState } from "../../../orgHierarchy/hooks/useOrgHierarchyState";
import {
  useAddCrqsToCabSessionMutation,
  useGetCabQueueQuery,
} from "../../api/cabManagerApiSlice";
import { ImpactChip } from "../shared/Chips";
import { errMsg } from "../shared/errMsg";

/**
 * Pulls further CRQs onto a session's agenda after it has been planned.
 *
 * The pool is the CAB waiting queue, which is scoped by Domain / Sub Domain -
 * the same scope the planning screen works in - so the picker asks for that
 * scope before it can show anything.
 */
export function AddCrqToSessionModal({
  open,
  sessionId,
  alreadyTabled,
  onClose,
}: {
  open: boolean;
  sessionId: string;
  /** CRQ numbers already on this agenda, shown as such rather than offered again. */
  alreadyTabled: string[];
  onClose: () => void;
}) {
  const roleCode = authStorage.getUser()?.roleCode ?? "TEAM_MEMBER";
  const { values, handleChange, resetAll } = useOrgHierarchyState();
  const { options } = useOrgHierarchyFilters(values);
  const [picked, setPicked] = useState<string[]>([]);

  const shouldFetch = Boolean(values.domain) && values.subDomain != null;
  const queue = useGetCabQueueQuery(
    { domainId: values.domain!, subDomainId: values.subDomain! },
    { skip: !open || !shouldFetch }
  );

  // The board keeps this dialog mounted, so scope and ticks survive a save.
  useEffect(() => {
    if (open) {
      resetAll();
      setPicked([]);
    }
  }, [open, resetAll]);

  // CRQs ticked under one Sub Domain must not travel to the next: they are no
  // longer on screen, and the user cannot see what they would be adding.
  useEffect(() => {
    setPicked([]);
  }, [values.domain, values.subDomain]);

  const tabled = useMemo(() => new Set(alreadyTabled), [alreadyTabled]);
  // `data` is RTK Query's last result for ANY arg; only `currentData` is scoped
  // to the Domain / Sub Domain currently selected.
  const rows = queue.currentData ?? [];
  const isEmptyForScope = shouldFetch && !queue.isFetching && !queue.isError && rows.length === 0;

  const [addCrqs, { isLoading }] = useAddCrqsToCabSessionMutation();

  const toggle = (crqNo: string) =>
    setPicked((prev) =>
      prev.includes(crqNo) ? prev.filter((c) => c !== crqNo) : [...prev, crqNo]
    );

  const submit = async () => {
    if (picked.length === 0) return;
    try {
      const result = await addCrqs({ sessionId, crqIds: picked }).unwrap();
      // A CRQ the session already carries comes back skipped - a normal
      // outcome, so both halves are reported rather than only the happy one.
      if (result.addedCount > 0) {
        toast.success(
          `${result.addedCount} CRQ(s) added to ${result.cabId}` +
            (result.skippedCount > 0 ? `, ${result.skippedCount} already tabled` : "")
        );
      } else {
        toast.info(`Nothing added — ${result.skippedCount} CRQ(s) are already on this agenda.`);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add CRQs to this session.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add CRQs to {sessionId}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Pick from the CAB waiting queue. Choose the Domain and Sub Domain the CRQs sit under.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <OrgHierarchyFilters
            role={roleCode}
            values={values}
            options={options}
            onChange={handleChange}
          />
        </Box>

        {!shouldFetch ? (
          <Alert severity="info">Select a Domain and Sub Domain to list the waiting CRQs.</Alert>
        ) : queue.isFetching ? (
          <Stack spacing={1}>
            {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={46} />)}
          </Stack>
        ) : queue.isError ? (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => void queue.refetch()}>Retry</Button>}
          >
            {errMsg(queue.error)}
          </Alert>
        ) : isEmptyForScope ? (
          <Alert severity="info">No CRQs are waiting for CAB under this scope.</Alert>
        ) : (
          <List dense disablePadding sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, maxHeight: 300, overflowY: "auto" }}>
            {rows.map((r) => {
              const already = tabled.has(r.crqNo);
              return (
                <ListItemButton
                  key={r.crqNo}
                  onClick={() => !already && toggle(r.crqNo)}
                  disabled={already}
                  sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                >
                  <Checkbox
                    edge="start"
                    size="small"
                    disableRipple
                    checked={already || picked.includes(r.crqNo)}
                    tabIndex={-1}
                  />
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12.5, fontWeight: 500 }}>
                          {r.crqNo}
                        </Typography>
                        <ImpactChip impact={r.impact} />
                        {already && <Chip size="small" variant="outlined" label="Already tabled" sx={{ height: 20, fontSize: 11 }} />}
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {r.circle} · {r.domain} · {r.executionWindow}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={isLoading || picked.length === 0}>
          {isLoading ? "Adding..." : picked.length ? `Add ${picked.length} CRQ(s)` : "Add CRQs"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
