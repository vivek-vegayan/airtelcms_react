/**
 * colorTypes.ts
 * Shared type alias for the colour-token object returned by useTabColorTokens.
 * Import this in every sub-component instead of repeating the verbose ReturnType.
 */

import type { useTabColorTokens } from "../../../style/theme";

export type Colors = ReturnType<typeof useTabColorTokens>;