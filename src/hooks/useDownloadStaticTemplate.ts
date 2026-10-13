import { useState } from "react";

/** Downloads a static template served from `public/templates/`. Replace the
 *  file there to change what users download — no code change needed. */
export const useDownloadStaticTemplate = (fileName: string) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    const templateUrl = `${import.meta.env.BASE_URL}templates/${fileName}`;
    setIsDownloading(true);
    try {
      const res = await fetch(templateUrl, { cache: "no-store" });
      const contentType = res.headers.get("content-type") ?? "";
      // SPA fallback returns index.html for a missing file — treat that as not found.
      if (!res.ok || contentType.includes("text/html")) {
        throw new Error(`Template file not found at ${templateUrl}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
};
