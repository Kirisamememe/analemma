import React, {
  useEffect,
  useEffectEvent,
  useInsertionEffect,
  useLayoutEffect as runLayoutEffect,
} from "react";

/** React の effect を呼ぶ hook。 */
export const useRawEffects = () => {
  useEffect(() => undefined, []);
  runLayoutEffect(() => undefined, []);
  useInsertionEffect(() => undefined, []);
  React.useEffect(() => undefined, []);

  const onEffect = useEffectEvent(() =>
    window.dispatchEvent(new Event("ready")),
  );

  useEffect(() => {
    onEffect();
  }, []);
};
