import { useEffect } from "react";

/** html の設定を当てる hook。 */
export function useHtmlPreferences() {
  useEffect(() => undefined, []);

  const run = function () {
    useEffect(() => undefined, []);
  };

  return run;
}

/** 見出しの空白を取る hook。 */
export const useTrimmedHeading = (useEffect: (value: string) => string) =>
  useEffect(" title ");
