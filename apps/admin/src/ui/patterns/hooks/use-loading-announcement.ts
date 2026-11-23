import { useEffect, useState } from "react";

/** 読み込みが続き、スクリーンリーダーに知らせる時点を迎えたか。 */
export const useLoadingAnnouncement = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReady(true);
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return ready;
};
