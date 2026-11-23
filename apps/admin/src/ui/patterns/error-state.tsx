import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Heading, Stack, Text } from "@/ui/layout";
import { useFailedRetries } from "@/ui/patterns/hooks/use-failed-retries";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const errorState = tv({
  base: "flex flex-col items-center gap-4 text-center",
  variants: {
    layout: {
      inline: "rounded-surface border px-6 py-12",
      screen: "py-12",
    },
  },
});

const mark = tv({
  base: [
    "flex size-control items-center justify-center",
    "rounded-full bg-danger/10 text-danger",
  ],
});

const message = tv({
  base: "flex max-w-md flex-col items-center gap-1 text-balance",
});

/** 読み込めなかった欄に渡す値。 */
type ErrorStateProps = {
  /** 何を読み込めなかったかを伝える見出し。 */
  title: string;
  /** 見出しのレベル。 */
  level: 2 | 3;
  /** 置く場所(一覧の中か、画面の中身の全体か)。 */
  layout: "inline" | "screen";
  /** 取り直しているか。 */
  isRetrying: boolean;
  /** 取り直す関数。 */
  onRetry: () => void;
};

/** 読み込めなかったことと次にすることを伝え、取り直せる欄。 */
export const ErrorState = ({
  title,
  level,
  layout,
  isRetrying,
  onRetry,
}: ErrorStateProps): ReactNode => {
  const { t } = useTranslation();
  const failedRetries = useFailedRetries(isRetrying);

  return (
    <div className={errorState({ layout })}>
      <span className={mark()}>
        <Icon name="cloud-alert" size="lg" />
      </span>
      <div className={message()} key={failedRetries} role="alert">
        <Heading level={level}>{title}</Heading>
        {failedRetries === 0 ? (
          <Text tone="muted">{t("ui.errorState.description")}</Text>
        ) : (
          <Stack gap={0}>
            <Text tone="muted">{t("ui.errorState.failedAgain")}</Text>
            <Text tone="muted">{t("ui.errorState.retryLater")}</Text>
          </Stack>
        )}
      </div>
      <Button isPending={isRetrying} onPress={onRetry}>
        {t("ui.errorState.retry")}
      </Button>
    </div>
  );
};
