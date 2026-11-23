import { useRouteContext } from "@tanstack/react-router";
import { type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ImagesSection } from "@/components/images/images-section";
import { Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

const imageHref = (id: string): `/images/${string}` => `/images/${id}`;

/** 画像を、写真の縦横比を保って並べる画面。 */
export const ImagesPage = (): ReactNode => {
  const { t } = useTranslation();

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
        <PageHeader
          description={t("images.description")}
          title={t("images.title")}
        />
        <div ref={restorePosition}>
          <ImagesSection imageHref={imageHref} />
        </div>
      </Stack>
    </Center>
  );
};
