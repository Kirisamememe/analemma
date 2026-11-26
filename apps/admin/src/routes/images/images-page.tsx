import { useRouteContext } from "@tanstack/react-router";
import { type ReactNode, useCallback } from "react";

import { ImagesSection } from "@/features/images/list/images-section";
import { PhotoUploads } from "@/features/images/upload/photo-uploads";
import { Center, Stack } from "@/ui/layout";

/** 画像を、写真の縦横比を保って並べる画面。 */
export const ImagesPage = (): ReactNode => {
  const position = useRouteContext({
    from: "/signed-in/images",
    select: (context) => context.imageListPosition,
  });

  const restorePosition = useCallback(
    (root: HTMLDivElement | null) => {
      if (root === null || position.current === undefined) return;

      const { href, top } = position.current;

      const frame = requestAnimationFrame(() => {
        if (document.activeElement !== document.body) return;

        const links = Array.from(
          root.querySelectorAll<HTMLAnchorElement>('a[href^="/images/"]'),
        );

        const target =
          links.find((link) => link.pathname === href) ??
          links.find((link) => link.pathname < href) ??
          links.at(-1);

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

  return (
    <Center width="page">
      <Stack gap={8}>
        <PhotoUploads imageHref={(id) => `/images/${id}`} />
        <div ref={restorePosition}>
          <ImagesSection imageHref={(id) => `/images/${id}`} />
        </div>
      </Stack>
    </Center>
  );
};
