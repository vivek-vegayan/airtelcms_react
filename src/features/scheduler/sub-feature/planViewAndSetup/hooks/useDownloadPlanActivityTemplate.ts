import { useDownloadStaticTemplate } from "../../../../../hooks/useDownloadStaticTemplate";

const TEMPLATE_FILE_NAME = "Plan_Activity_Upload_Template.xlsx";

/** Shared by the toolbar's standalone "Download Template" action and the
 *  Upload dialog's first step, so both download the exact same file. */
export const useDownloadPlanActivityTemplate = () =>
  useDownloadStaticTemplate(TEMPLATE_FILE_NAME);
