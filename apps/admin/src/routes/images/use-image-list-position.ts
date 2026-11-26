import { useRouteContext } from "@tanstack/react-router";
import { useCallback } from "react";

import { findImageReturnLink } from "./logic/find-image-return-link";

/** 写真から一覧へ戻ったときの focus と表示位置を復元する。 */
export const useImageListPosition = () => {
  const position = useRouteContext({
    from: "/signed-in/images",
    select: (context) => context.imageListPosition,
  });

  return useCallback(
    (root: HTMLDivElement | null) => {
      if (root === null || position.current === undefined) return;

      const { href, top } = position.current;

      const frame = requestAnimationFrame(() => {
        if (document.activeElement !== document.body) return;

        const links = Array.from(
          root.querySelectorAll<HTMLAnchorElement>('a[href^="/images/"]'),
        );

        const target = findImageReturnLink(links, href);

        if (target === undefined) return;

        delete position.current;
        target.focus({ preventScroll: true });
        window.scrollTo({ top, behavior: "instant" });
        target.scrollIntoView({ block: "nearest", behavior: "instant" });
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    },
    [position],
  );
};
