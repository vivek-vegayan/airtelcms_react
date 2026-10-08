import { useState } from "react";

const TEMPLATE_FILE_NAME = "Plan_Activity_Upload_Template.xlsx";

/** Static template served from `public/templates/`. Replace that file to
 *  change what users download — no code change needed. */
const TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/${TEMPLATE_FILE_NAME}`;

/** Shared by the toolbar's standalone "Download Template" action and the
 *  Upload dialog's first step, so both download the exact same file. */
export const useDownloadPlanActivityTemplate = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(TEMPLATE_URL, { cache: "no-store" });
      const contentType = res.headers.get("content-type") ?? "";
      // SPA fallback returns index.html for a missing file — treat that as not found.
      if (!res.ok || contentType.includes("text/html")) {
        throw new Error(`Template file not found at ${TEMPLATE_URL}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = TEMPLATE_FILE_NAME;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
};
