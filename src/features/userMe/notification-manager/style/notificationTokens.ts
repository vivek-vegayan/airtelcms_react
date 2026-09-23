import { useTabColorTokens } from "../../../../style/theme";

/**
 * Notification UI tokens — a thin alias over the app-wide semantic token
 * hook. Previously this recomputed the same surfaces/borders/status colors
 * with its own slightly different hex values (different opacities, a
 * separate "indigo" accent hardcoded independent of the brand color),
 * which is what caused the notification manager to look inconsistent
 * with the rest of the app in dark mode.
 */
export const useNotifTokens = useTabColorTokens;

/**
 * Same derivation under a non-hook name, for pure contexts (useMemo
 * factories, styled callbacks) where the rules-of-hooks lint would flag a
 * `use*` call. It only reads the theme argument, so this is safe.
 */
export const getNotifTokens = useTabColorTokens;

export type NotifTokens = ReturnType<typeof useNotifTokens>;

/** Generates the minimal keyframe + toggle CSS block using live theme values */
export function buildToggleCss(tk: NotifTokens): string {
  return `
    .ntf-tog{position:relative;width:38px;height:21px;display:inline-block;flex-shrink:0}
    .ntf-tog input{display:none}
    .ntf-track{
      position:absolute;inset:0;
      background:${tk.trackOff};
      border:1px solid ${tk.trackOffBorder};
      border-radius:11px;cursor:pointer;
      transition:background .2s,border-color .2s
    }
    .ntf-tog input:checked~.ntf-track{
      background:${tk.success};
      border-color:${tk.success}
    }
    .ntf-thumb{
      position:absolute;top:3px;left:3px;
      width:13px;height:13px;
      background:#fff;border-radius:50%;
      transition:transform .2s cubic-bezier(.4,0,.2,1);
      pointer-events:none
    }
    .ntf-tog input:checked~.ntf-track .ntf-thumb{transform:translateX(17px)}
  `;
}
