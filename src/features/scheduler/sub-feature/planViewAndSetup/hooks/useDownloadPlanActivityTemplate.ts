import { useDownloadStaticTemplate } from "../../../../../hooks/useDownloadStaticTemplate";

const TEMPLATE_FILE_NAME = "Plan_Activity_Upload_Template.xlsx";

/** Used by the Upload dialog's first step to download the import template. */
export const useDownloadPlanActivityTemplate = () =>
  useDownloadStaticTemplate(TEMPLATE_FILE_NAME);
