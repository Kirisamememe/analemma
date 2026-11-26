import { useCallback, useState } from "react";

/** 写真のプレビューに使うファイルと配信用の URL。 */
export const usePhotoPreview = (source: File | string, previewUrl?: string) => {
  const [failedSource, setFailedSource] = useState<File | string>();
  const [failedUrl, setFailedUrl] = useState<string>();

  const attach = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image || typeof source === "string") return;

      const url = URL.createObjectURL(source);
      image.setAttribute("src", url);

      return () => {
        URL.revokeObjectURL(url);
      };
    },
    [source],
  );

  if (failedSource !== source) {
    return {
      key: "source",
      src: typeof source === "string" ? source : undefined,
      attach,
      onError: () => {
        setFailedSource(source);
      },
    };
  }

  if (previewUrl !== undefined && previewUrl !== failedUrl) {
    return {
      key: previewUrl,
      src: previewUrl,
      attach: undefined,
      onError: () => {
        setFailedUrl(previewUrl);
      },
    };
  }

  return undefined;
};
