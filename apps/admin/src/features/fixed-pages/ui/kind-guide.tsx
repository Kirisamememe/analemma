import type { ReactNode } from "react";

import { KindExample } from "./kind-example";

import { useTranslate } from "@/i18n/use-translate";
import { Heading, Stack, Text } from "@/ui/layout";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const guide = tv({
  slots: {
    panel: "rounded-surface bg-info/10 p-4",
    title: "flex items-start gap-2",
    icon: "inline-flex h-6 shrink-0 items-center text-info",
  },
});

const { panel, title, icon } = guide();

/** 固定ページの種類を公開サイトから追加する方法。 */
export const KindGuide = (): ReactNode => {
  const t = useTranslate();

  return (
    <aside aria-label={t("fixedPageEditor.addKindTitle")} className={panel()}>
      <Stack gap={2}>
        <div className={title()}>
          <span className={icon()}>
            <Icon name="info" />
          </span>
          <Heading level={2}>{t("fixedPageEditor.addKindTitle")}</Heading>
        </div>
        <Text>{t("fixedPageEditor.addKindSummary")}</Text>
        <KindExample />
      </Stack>
    </aside>
  );
};
