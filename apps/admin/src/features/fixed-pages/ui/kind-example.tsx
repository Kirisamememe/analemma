import type { ReactNode } from "react";

import { useTranslate } from "@/i18n/use-translate";
import { Stack, Text } from "@/ui/layout";
import { tv } from "@/ui/tv";

const PUSH_KINDS_COMMAND = "analemma push-kinds ./src/lib/kinds.ts";

const example = tv({
  slots: {
    summary:
      "w-fit cursor-pointer rounded-control text-info outline-hidden focus-visible:focus-ring",
    instructions: "pt-2",
  },
});

const { summary, instructions } = example();

/** 種類を足す手順を、開いて読む欄。 */
export const KindExample = (): ReactNode => {
  const t = useTranslate();

  return (
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
            <code>{PUSH_KINDS_COMMAND}</code>
          </Text>
          <Text tone="muted">{t("fixedPageEditor.refreshAfterDeploy")}</Text>
        </Stack>
      </div>
    </details>
  );
};
