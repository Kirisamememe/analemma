import type { ReactNode } from "react";

import { useTranslate } from "@/i18n/use-translate";
import { Heading, Stack, Text } from "@/ui/layout";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const guide = tv({
  slots: {
    panel: "rounded-surface bg-info/10 p-4",
    title: "flex items-start gap-2",
    icon: "inline-flex h-6 shrink-0 items-center text-info",
    summary:
      "w-fit cursor-pointer rounded-control text-info outline-hidden focus-visible:focus-ring",
    instructions: "pt-2",
  },
});

const { panel, title, icon, summary, instructions } = guide();

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
        <details>
          <summary className={summary()}>
            <Text as="span" variant="label">
              {t("fixedPageEditor.addKindExample")}
            </Text>
          </summary>
          <div className={instructions()}>
            <Stack gap={2}>
              <Text tone="muted">{t("fixedPageEditor.defineKind")}</Text>
              <Text tone="muted">{t("fixedPageEditor.deployKind")}</Text>
              <Text>
                <code>analemma push-kinds ./src/lib/kinds.ts</code>
              </Text>
              <Text tone="muted">
                {t("fixedPageEditor.refreshAfterDeploy")}
              </Text>
            </Stack>
          </div>
        </details>
      </Stack>
    </aside>
  );
};
