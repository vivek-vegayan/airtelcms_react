import React, { useState } from "react";
import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import type { Colors } from "../../../types/colorTypes";
import type { ResolvedAttribute } from "../types/attributeUpdate.types";
import type { AttributeFormValues } from "../utils/attributeUpdate.utils";
import { useAttributeOptions } from "../hooks/useAttributeOptions";
import { MandatoryBadge } from "./MandatoryBadge";

interface AttributeRowProps {
  attribute: ResolvedAttribute;
  /** react-hook-form control for the dialog's single stage-wide form
   * (a throwaway, unused form instance for view-only cards). */
  control: Control<AttributeFormValues>;
  /** Needed only by cascade parents, to clear the levels below them
   * (`attribute.resets`) when their own value changes. */
  setValue?: UseFormSetValue<AttributeFormValues>;
  errors: FieldErrors<AttributeFormValues>;
  /** Forces the read-only display branch regardless of the attribute's own
   * flags - set for history/completed stage cards, which are never editable. */
  viewOnly?: boolean;
  colors: Colors;
}

const FlagIcon: React.FC<{ title: string; icon: React.ReactNode; color: string }> = ({
  title,
  icon,
  color,
}) => (
  <Tooltip title={title} arrow placement="top">
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        color,
      }}
    >
      {icon}
    </Box>
  </Tooltip>
);

const inputSx = { fontSize: 12.75, borderRadius: "8px" };

/** Multi-value attributes arrive from the API as a CSV string. */
const splitCsv = (value: string | null): string[] =>
  value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];

/**
 * The catalog's option list, widened to include any already-saved value it
 * doesn't list. Real CRQ data carries values the frontend catalog never
 * offered (e.g. businessJustification "Security patch deployment"), and a
 * Select whose value has no matching MenuItem renders blank - which both hides
 * what is stored and silently rewrites it to null on the next save. Prepending
 * the stored value keeps it visible and selected while still letting the user
 * pick a catalog option instead.
 */
const withSavedValue = (options: string[] | undefined, ...saved: string[]): string[] => {
  const list = options ?? [];
  const extras = saved.filter((v) => v && !list.includes(v));
  return extras.length ? [...extras, ...list] : list;
};

/**
 * Read-only rendering of an editable attribute's current value - what the row
 * shows before the user clicks it to reveal the real input. Reads the live form
 * value (seeded from GET /attributeupdate/details) so it also reflects an edit
 * that has already been made. Multi-value attributes render as chips, "Date
 * Time" drops the ISO "T", everything else is plain text; an empty value falls
 * back to the "Not set" placeholder.
 */
const ValueDisplay: React.FC<{
  value: unknown;
  type: ResolvedAttribute["type"];
  colors: Colors;
}> = ({ value, type, colors }) => {
  const chips = Array.isArray(value)
    ? (value as string[])
    : type === "Multi Select Checkbox" || type === "Multi Select Dropdown"
      ? splitCsv(typeof value === "string" ? value : null)
      : null;

  if (chips) {
    return chips.length ? (
      <Stack direction="row" flexWrap="wrap" gap={0.4}>
        {chips.map((v) => (
          <Chip
            key={v}
            label={v}
            size="small"
            sx={{ height: 18, fontSize: 10.5, "& .MuiChip-label": { px: 0.7 } }}
          />
        ))}
      </Stack>
    ) : (
      <NotSet colors={colors} />
    );
  }

  const text = typeof value === "string" ? value : "";
  if (!text) return <NotSet colors={colors} />;

  return (
    <Typography sx={{ fontSize: 12.75, color: colors.textPrimary, wordBreak: "break-word" }}>
      {type === "Date Time" ? text.slice(0, 16).replace("T", " ") : text}
    </Typography>
  );
};

const NotSet: React.FC<{ colors: Colors }> = ({ colors }) => (
  <Typography sx={{ fontSize: 12.75, color: colors.textDim, fontStyle: "italic" }}>
    Not set — click to add
  </Typography>
);

/**
 * One editable attribute of the selected stage, rendered as a compact,
 * self-contained field tile (label + badges on top, input below) bound to
 * the dialog's react-hook-form instance under
 * `${attribute.system}.${attribute.field}`. Read-only / backend-set /
 * auto-set attributes render as a disabled display of their live value
 * instead of an input.
 */
export const AttributeRow: React.FC<AttributeRowProps> = React.memo(function AttributeRow({
  attribute,
  control,
  setValue,
  errors,
  viewOnly,
  colors,
}) {
  const isDisabled =
    viewOnly || attribute.readOnly || attribute.isBackend || !!attribute.autoSetFrom;
  const required = attribute.mandatoryLevel === "mandatory";
  const name = `${attribute.system}.${attribute.field}`;
  const errorMessage = (errors as any)?.[attribute.system]?.[attribute.field]?.message as
    | string
    | undefined;

  // Editable rows open as a plain display of the saved value and only swap in
  // the real control (dropdown, checkbox group, text, ...) once the user asks
  // to change it. The form value itself is seeded either way, so a row that is
  // never opened still submits exactly what was loaded.
  const [isEditing, setIsEditing] = useState(false);

  // A save (or any refetch) hands down a new saved value - collapse back to the
  // display so the row shows what actually landed in the backend. `value` does
  // not change while the user types, so this never interrupts an edit. Adjusted
  // during render rather than in an effect (react.dev "Adjusting state when a
  // prop changes"), so the row never paints one frame of stale edit mode.
  const [renderedValue, setRenderedValue] = useState(attribute.value);
  if (renderedValue !== attribute.value) {
    setRenderedValue(attribute.value);
    setIsEditing(false);
  }

  // A failed "required" check must not hide behind the display mode: reveal the
  // control so the user can see, and fix, what is being complained about.
  const showInput = isEditing || Boolean(errorMessage);

  // Catalog `values` for an ordinary dropdown; a live (and, for the Change
  // Implementer trio, cascading) lookup for one with an `optionSource`. Gated
  // on the row being open and editable, so a collapsed or read-only row costs
  // nothing.
  const { options, isLoading: isLoadingOptions, blockedBy } = useAttributeOptions(
    attribute,
    control,
    !isDisabled && showInput,
  );

  /** Clears the cascade levels below this one - their selection stops being
   * valid the moment their parent changes. */
  const resetDependentFields = () => {
    if (!setValue) return;
    for (const field of attribute.resets ?? []) {
      setValue(`${attribute.system}.${field}` as `remedy.${string}`, "", {
        shouldDirty: true,
      });
    }
  };

  const autoSetCaption =
    attribute.autoSetFrom === "cmsStage"
      ? "Auto-set from current stage"
      : attribute.autoSetFrom === "remedyStatus"
        ? "Auto-set from Remedy status"
        : attribute.autoSetFrom === "crqNo"
          ? "Auto-set from CRQ number"
          : attribute.autoSetFrom === "currentUserOlmId"
            ? "Auto-set from signed-in user"
            : undefined;

  return (
    <Box
      sx={{
        p: 1.1,
        borderRadius: colors.radiusL,
        border: `1px solid ${colors.border}`,
        bgcolor: isDisabled ? colors.surface2 : colors.surface,
        opacity: attribute.isBackend ? 0.6 : 1,
        transition: "border-color .15s ease, box-shadow .15s ease",
        minWidth: 0,
        // A checkbox group has one control per option, so in a 1/3-width grid
        // cell its options wrap into a tall column. Give it the full row of
        // AttributeSection's grid instead - only while the checkboxes are
        // actually on screen, not in either read-only display branch.
        ...(!isDisabled &&
          showInput &&
          attribute.type === "Multi Select Checkbox" && { gridColumn: "1 / -1" }),
        ...(!isDisabled && {
          "&:hover": { borderColor: colors.borderHover },
          "&:focus-within": {
            borderColor: colors.accent,
            boxShadow: `0 0 0 3px ${colors.accentDim}`,
          },
        }),
      }}
    >
      <Stack direction="row" alignItems="center" gap={0.6} sx={{ mb: 0.6 }}>
        {!isDisabled && (
          <MandatoryBadge level={attribute.mandatoryLevel} rawLabel={attribute.mandatory} />
        )}
        <Typography
          component="span"
          noWrap
          title={attribute.name}
          sx={{
            fontSize: 12.25,
            fontWeight: 600,
            color: colors.textSecondary,
            letterSpacing: 0.1,
            flex: 1,
            minWidth: 0,
          }}
        >
          {attribute.name}
        </Typography>
        {attribute.readOnly && (
          <FlagIcon
            title="Read-only"
            icon={<LockOutlinedIcon sx={{ fontSize: 13 }} />}
            color={colors.textDim}
          />
        )}
        {attribute.isBackend && (
          <FlagIcon
            title="Set by backend"
            icon={<DnsOutlinedIcon sx={{ fontSize: 13 }} />}
            color={colors.textDim}
          />
        )}
        {!isDisabled && !showInput && (
          <FlagIcon
            title="Click the value to change it"
            icon={<EditOutlinedIcon sx={{ fontSize: 13 }} />}
            color={colors.textDim}
          />
        )}
        {attribute.autoSetFrom && (
          <FlagIcon
            title={autoSetCaption ?? "Auto-set"}
            icon={<GpsFixedRoundedIcon sx={{ fontSize: 12 }} />}
            color={colors.accent}
          />
        )}
      </Stack>

      {isDisabled ? (
        <TextField
          size="small"
          fullWidth
          value={attribute.autoSetValue ?? attribute.value ?? ""}
          disabled
          placeholder="Not yet saved"
          helperText={autoSetCaption}
          InputProps={{ sx: inputSx }}
          FormHelperTextProps={{ sx: { fontSize: 10.5, mx: 0, mt: 0.4 } }}
        />
      ) : (
        <Controller
          name={name as `remedy.${string}` | `cab.${string}` | `planningTool.${string}`}
          control={control}
          rules={{ required: required ? `${attribute.name} is required.` : false }}
          render={({ field }) => {
            // Display mode lives inside the Controller, not instead of it: the
            // field stays registered with its `required` rule even while the
            // row is only showing a value, so a mandatory field the user never
            // opens still blocks Save the way it always did.
            if (!showInput) {
              return (
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label={`Change ${attribute.name}`}
                  onClick={() => setIsEditing(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsEditing(true);
                    }
                  }}
                  sx={{
                    minHeight: 34,
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                    py: 0.6,
                    borderRadius: "8px",
                    border: `1px dashed ${colors.border}`,
                    cursor: "pointer",
                    "&:hover": { borderColor: colors.accent, bgcolor: alpha(colors.accent, 0.05) },
                    "&:focus-visible": { outline: `2px solid ${colors.accent}`, outlineOffset: 1 },
                  }}
                >
                  <ValueDisplay
                    value={field.value ?? attribute.value}
                    type={attribute.type}
                    colors={colors}
                  />
                </Box>
              );
            }

            if (attribute.type === "Dropdown") {
              const current = typeof field.value === "string" ? field.value : "";
              // A level whose parent isn't picked yet has nothing to offer -
              // say which field to fill first instead of opening an empty menu.
              // Still selectable while it holds a saved value, so the user can
              // read (and clear) what is stored without touching the parent.
              const isBlocked = Boolean(blockedBy) && !current;
              // "Nothing came back" is only worth saying for a live lookup -
              // a static catalog dropdown always has its values.
              const isEmptyLookup =
                Boolean(attribute.optionSource) && !isLoadingOptions && !options.length;
              return (
                <FormControl size="small" fullWidth error={Boolean(errorMessage)}>
                  <Select
                    {...field}
                    value={current}
                    onChange={(event) => {
                      field.onChange(event);
                      resetDependentFields();
                    }}
                    disabled={isBlocked}
                    displayEmpty
                    startAdornment={
                      isLoadingOptions ? (
                        <InputAdornment position="start">
                          <CircularProgress size={13} thickness={5} />
                        </InputAdornment>
                      ) : undefined
                    }
                    sx={{ ...inputSx, borderRadius: "8px" }}
                  >
                    <MenuItem value="" sx={{ fontSize: 12.75 }}>
                      <em style={{ opacity: 0.6 }}>Select…</em>
                    </MenuItem>
                    {withSavedValue(options, current).map((opt) => (
                      <MenuItem key={opt} value={opt} sx={{ fontSize: 12.75 }}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                  {(errorMessage || blockedBy || isEmptyLookup) && (
                    <FormHelperText sx={{ fontSize: 10.5, mx: 0, mt: 0.4 }}>
                      {errorMessage ??
                        (blockedBy
                          ? `Select ${blockedBy} first.`
                          : "No options available for this selection.")}
                    </FormHelperText>
                  )}
                </FormControl>
              );
            }

            if (attribute.type === "Multi Select Dropdown") {
              const value: string[] = Array.isArray(field.value) ? field.value : [];
              return (
                <FormControl size="small" fullWidth error={Boolean(errorMessage)}>
                  <Select
                    {...field}
                    multiple
                    value={value}
                    displayEmpty
                    renderValue={(selected) =>
                      (selected as string[]).length ? (
                        <Stack direction="row" flexWrap="wrap" gap={0.4}>
                          {(selected as string[]).map((v) => (
                            <Chip
                              key={v}
                              label={v}
                              size="small"
                              sx={{ height: 18, fontSize: 10.5, "& .MuiChip-label": { px: 0.7 } }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <em style={{ opacity: 0.6, fontSize: 12.75 }}>Select…</em>
                      )
                    }
                    sx={{ ...inputSx, borderRadius: "8px" }}
                  >
                    {withSavedValue(options, ...value).map((opt) => (
                      <MenuItem key={opt} value={opt} sx={{ fontSize: 12.75 }}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }

            if (attribute.type === "Multi Select Checkbox") {
              // Same string[] form value as "Multi Select Dropdown" (and the
              // same CSV on the wire - see isMultiValueType), just laid out as
              // an always-visible checkbox group so every option is scannable
              // without opening a menu.
              const selected: string[] = Array.isArray(field.value) ? field.value : [];
              return (
                <FormControl
                  component="fieldset"
                  variant="standard"
                  error={Boolean(errorMessage)}
                  sx={{ display: "block" }}
                >
                  <FormGroup row sx={{ gap: 0.25 }}>
                    {withSavedValue(options, ...selected).map((opt) => (
                      <FormControlLabel
                        key={opt}
                        control={
                          <Checkbox
                            size="small"
                            sx={{ p: 0.5 }}
                            checked={selected.includes(opt)}
                            onChange={() =>
                              field.onChange(
                                selected.includes(opt)
                                  ? selected.filter((v) => v !== opt)
                                  : [...selected, opt],
                              )
                            }
                            onBlur={field.onBlur}
                          />
                        }
                        label={<Typography sx={{ fontSize: 12.5 }}>{opt}</Typography>}
                        sx={{ mr: 1.25 }}
                      />
                    ))}
                  </FormGroup>
                  {errorMessage && (
                    <FormHelperText sx={{ fontSize: 10.5, mx: 0, mt: 0.4 }}>
                      {errorMessage}
                    </FormHelperText>
                  )}
                </FormControl>
              );
            }

            if (attribute.type === "Radio Button") {
              return (
                <RadioGroup {...field} value={field.value ?? ""} row sx={{ gap: 0.25 }}>
                  {attribute.values?.map((opt) => (
                    <FormControlLabel
                      key={opt}
                      value={opt}
                      control={<Radio size="small" sx={{ p: 0.5 }} />}
                      label={<Typography sx={{ fontSize: 12.5 }}>{opt}</Typography>}
                      sx={{ mr: 1.25 }}
                    />
                  ))}
                </RadioGroup>
              );
            }

            if (attribute.type === "Date Time") {
              return (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  type="datetime-local"
                  size="small"
                  fullWidth
                  error={Boolean(errorMessage)}
                  helperText={errorMessage}
                  InputProps={{ sx: inputSx }}
                  InputLabelProps={{ shrink: true }}
                  FormHelperTextProps={{ sx: { fontSize: 10.5, mx: 0, mt: 0.4 } }}
                />
              );
            }

            // Text / Numbers
            return (
              <TextField
                {...field}
                value={field.value ?? ""}
                type={attribute.type === "Numbers" ? "number" : "text"}
                size="small"
                fullWidth
                error={Boolean(errorMessage)}
                helperText={errorMessage}
                InputProps={{ sx: inputSx }}
                FormHelperTextProps={{ sx: { fontSize: 10.5, mx: 0, mt: 0.4 } }}
              />
            );
          }}
        />
      )}
    </Box>
  );
});

export default AttributeRow;
