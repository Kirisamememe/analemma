import { useEffect, useEffectEvent } from "react";

/** html の設定を当てる hook。 */
export const useHtmlPreferences = () => {
  const onEffect = useEffectEvent(() =>
    window.dispatchEvent(new Event("ready")),
  );

  useEffect(() => {
    onEffect();
  }, []);
};
