import { useLazyDownloadPlanActivityTemplateQuery } from "../api/planApiSlice";

/** Shared by the toolbar's standalone "Download Template" action and the
 *  Upload dialog's first step, so both trigger the exact same request. */
export const useDownloadPlanActivityTemplate = () => {
  const [trigger, { isFetching }] = useLazyDownloadPlanActivityTemplateQuery();

  const download = async () => {
    const blob = await trigger().unwrap();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Plan_Activity_Upload_Template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return { download, isDownloading: isFetching };
};
