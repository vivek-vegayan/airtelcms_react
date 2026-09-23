import type { useTabColorTokens } from "../../../style/theme";

/** Colour-token object returned by useTabColorTokens — passed down through the feature. */
export type Colors = ReturnType<typeof useTabColorTokens>;
