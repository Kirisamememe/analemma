import * as React from "react";

/** story の設定を当てる hook。 */
export const useStoryPreferences = () => {
  React.useEffect(() => undefined, []);
};

/** html の設定を当てる hook。 */
export const useHtmlPreferences = function () {
  React.useLayoutEffect(() => undefined, []);
};
