import { useState } from "react";

import {
  type CopyTextResult,
  copyText,
} from "@/features/deploy-tokens/issue/copy-text";

const COPIED_SHOWN_MS = 2000;

/** 文字列をクリップボードに書き、その結果を返す操作。 */
export const useCopyText = (text: string) => {
  const [result, setResult] = useState<CopyTextResult>();

  return {
    result: result?._tag,
    copy: async (): Promise<void> => {
      const next = await copyText(
        (value) => navigator.clipboard.writeText(value),
        text,
      );

      setResult(next);

      if (next._tag === "Copied") {
        setTimeout(() => {
          setResult((current) => (current === next ? undefined : current)); // 押し直した後の結果は消さない
        }, COPIED_SHOWN_MS);
      }
    },
  };
};
