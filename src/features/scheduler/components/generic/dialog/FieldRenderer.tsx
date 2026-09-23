import React, { useEffect } from "react";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import {
  Controller,
  useController,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import type {
  StageFieldConfig,
  StageFieldOption,
} from "../../../types/stageWorkflow.types";
import { useCancellationReasons } from "../../../hook/useCancellationReasons";
// import type { StageFieldConfig } from "../../../types/stageWorkflow.types";

interface FieldRendererProps {
  field: StageFieldConfig;
  control: Control<any>;
  errors: FieldErrors<any>;
  values: Record<string, any>;
  disabled: boolean;
}

/**
 * A "readonly" field whose value is derived from the others (today: the
 * cancellation rollback owner). It is shown read-only but still registered
 * with react-hook-form, so the derived value reaches the /done payload in
 * `values` instead of every caller having to re-derive it.
 */
const DerivedReadonlyField: React.FC<{
  name: string;
  label: string;
  value: string;
  disabled: boolean;
  control: Control<any>;
  helperText: string;
}> = ({ name, label, value, disabled, control, helperText }) => {
  const { field: rhfField } = useController({ name, control, defaultValue: "" });
  const { onChange } = rhfField;
  const current = rhfField.value ?? "";

  useEffect(() => {
    if (current !== value) onChange(value);
  }, [value, current, onChange]);

  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      value={value}
      disabled={disabled}
      helperText={helperText}
      InputProps={{
        readOnly: true,
        startAdornment: <PersonOutlineIcon sx={{ mr: 0.75, fontSize: 16 }} />,
        sx: { fontFamily: "monospace", fontSize: 12.5, borderRadius: 1.5 },
      }}
      InputLabelProps={{ sx: { fontSize: 13 } }}
    />
  );
};

/**
 * Renders exactly one field from a stage's `fields` config. Adding a new
 * field type only means extending the switch below - every stage benefits
 * automatically since they all share this renderer.
 */
export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  control,
  errors,
  values,
  disabled,
}) => {
  // Only the cancellation block needs the server list, so every other field
  // skips the request entirely; the two that do need it share one cached
  // response through RTK Query.
  const needsCancellationReasons =
    field.optionsSource === "cancellationReasons" || Boolean(field.deriveValueWith);
  const {
    options: cancellationReasonOptions,
    ownerFor,
    isLoading: reasonsLoading,
    isError: reasonsFailed,
  } = useCancellationReasons({ skip: !needsCancellationReasons });

  if (field.visibleWhen && !field.visibleWhen(values)) return null;

  const isRequired = field.requiredWhen ? field.requiredWhen(values) : field.required;
  const errorMessage = (errors as any)?.[field.name]?.message as string | undefined;

  if (field.type === "readonly") {
    const derived = field.deriveValueWith
      ? field.deriveValueWith(values, { ownerForCancellationReason: ownerFor })
      : field.deriveValue
        ? field.deriveValue(values)
        : (values[field.name] ?? "");

    return (
      <DerivedReadonlyField
        key={field.name}
        name={field.name}
        label={field.label}
        value={derived}
        disabled={disabled}
        control={control}
        helperText={
          field.deriveValueWith && reasonsLoading ? "Loading…" : "Auto-populated"
        }
      />
    );
  }

  const selectOptions: StageFieldOption[] =
    field.optionsSource === "cancellationReasons"
      ? cancellationReasonOptions
      : (field.options ?? []);

  return (
    <Controller
      key={field.name}
      name={field.name}
      control={control}
      rules={{ required: isRequired ? `${field.label} is required.` : false }}
      render={({ field: rhfField }) => {
        if (field.type === "select") {
          const loadingOptions = field.optionsSource ? reasonsLoading : false;
          const optionsFailed = field.optionsSource ? reasonsFailed : false;
          return (
            <FormControl
              size="small"
              fullWidth
              disabled={disabled || loadingOptions}
              error={Boolean(errorMessage) || optionsFailed}
            >
              <InputLabel sx={{ fontSize: 13 }}>
                {field.label}
                {isRequired ? " *" : ""}
              </InputLabel>
              <Select
                {...rhfField}
                label={`${field.label}${isRequired ? " *" : ""}`}
                sx={{ borderRadius: 1.5, fontSize: 13 }}
              >
                {selectOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {(errorMessage || loadingOptions || optionsFailed) && (
                <FormHelperText>
                  {errorMessage ??
                    (loadingOptions
                      ? "Loading…"
                      : "Could not load the list. Close and reopen to try again.")}
                </FormHelperText>
              )}
            </FormControl>
          );
        }

        // text / textarea
        return (
          <TextField
            {...rhfField}
            disabled={disabled}
            size="small"
            fullWidth
            multiline={field.type === "textarea"}
            rows={field.type === "textarea" ? 3 : undefined}
            label={`${field.label}${isRequired ? " *" : ""}`}
            placeholder={field.placeholder}
            error={Boolean(errorMessage)}
            helperText={errorMessage}
            InputProps={{ sx: { borderRadius: 1.5, fontSize: 13 } }}
            InputLabelProps={{ sx: { fontSize: 13 } }}
          />
        );
      }}
    />
  );
};

export default FieldRenderer;
