import React, { useState } from "react";
import { TextField, type TextFieldProps } from "@mui/material";

interface NumericFieldProps
  extends Omit<TextFieldProps, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const sanitize = (raw: string) => raw.replace(/[^\d]/g, "");
const stringify = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

/**
 * A numeric TextField that doesn't fight the user while they're typing.
 *
 * A plain controlled `<TextField type="number" value={n} onChange={(e) =>
 * onChange(Number(e.target.value))}>` snaps back to "0" the instant the field
 * is cleared (Number("") === 0), so it's impossible to clear-and-retype a
 * value. This keeps its own draft string while focused — only coercing to a
 * number (and clamping to min/max) on blur — so empty, leading-zero, and
 * mid-edit states all display exactly what the user typed.
 */
const NumericField: React.FC<NumericFieldProps> = ({
  value,
  onChange,
  min = 0,
  max,
  inputProps,
  onBlur,
  onFocus,
  ...rest
}) => {
  const [draft, setDraft] = useState(() => stringify(value));
  const [lastSyncedValue, setLastSyncedValue] = useState(value);
  const [focused, setFocused] = useState(false);

  // Resync the draft when the parent's value changes externally (reset,
  // "apply to all", reloaded data) - but never while focused, so an
  // in-progress edit isn't overwritten. Adjusting state during render (React's
  // documented pattern for "state that depends on a prop") avoids the extra
  // render + flicker a useEffect-based sync would cause.
  if (!focused && value !== lastSyncedValue) {
    setLastSyncedValue(value);
    setDraft(stringify(value));
  }

  const commit = (raw: string) => {
    if (raw === "") {
      setDraft(String(min));
      setLastSyncedValue(min);
      onChange(min);
      return;
    }
    let n = Number(raw);
    if (max !== undefined) n = Math.min(n, max);
    if (min !== undefined) n = Math.max(n, min);
    setDraft(String(n));
    setLastSyncedValue(n);
    onChange(n);
  };

  return (
    <TextField
      {...rest}
      value={draft}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onChange={(e) => {
        const next = sanitize(e.target.value);
        setDraft(next);
        // Push a live value up for complete numbers so anything derived from
        // parent state (progress counters, payload previews) stays in sync
        // without waiting for blur; an empty draft is left alone until blur.
        if (next !== "") {
          const n = Number(next);
          setLastSyncedValue(n);
          onChange(n);
        }
      }}
      onBlur={(e) => {
        setFocused(false);
        commit(e.target.value);
        onBlur?.(e);
      }}
      inputProps={{ inputMode: "numeric", ...inputProps }}
    />
  );
};

export default NumericField;
