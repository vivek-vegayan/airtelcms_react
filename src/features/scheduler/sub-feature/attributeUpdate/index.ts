// Types
export * from "./types/attributeUpdate.types";

// Constants
export * from "./constants/attributeUpdate.constants";

// Field catalog (frontend-only display metadata; live values come from the API)
export * from "./constants/attributeUpdateFieldCatalog";

// API (RTK Query)
export * from "./api/attributeUpdateApiSlice";

// Utils
export * from "./utils/attributeUpdate.utils";

// Slice
export { default as attributeUpdateReducer } from "./slices/attributeUpdate.slice";
export * from "./slices/attributeUpdate.slice";

// Selectors
export * from "./selectors/attributeUpdate.selectors";

// Hooks
export * from "./hooks/useOpenAttributeUpdate";
export * from "./hooks/useAttributeUpdate";
export * from "./hooks/useAttributeOptions";

// Components
export { AttributeUpdateDialog } from "./components/AttributeUpdateDialog";
export { AttributeStageStepper } from "./components/AttributeStageStepper";
export { AttributeCrqHeaderCard } from "./components/AttributeCrqHeaderCard";
export { AttributeApiChips } from "./components/AttributeApiChips";
export { RemedySubStatusBar } from "./components/RemedySubStatusBar";
export { AttributeSection } from "./components/AttributeSection";
export { WorkflowStageCard } from "./components/WorkflowStageCard";
export { WorkflowStageCardBody } from "./components/WorkflowStageCardBody";
export { AttributeRow } from "./components/AttributeRow";
export { AttributeValueList } from "./components/AttributeValueList";
export { MandatoryBadge } from "./components/MandatoryBadge";
export { AttributeDialogFooter } from "./components/AttributeDialogFooter";
