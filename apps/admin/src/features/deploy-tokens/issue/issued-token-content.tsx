import type { ReactNode } from "react";

import { useCopyText } from "@/features/deploy-tokens/issue/hooks/use-copy-text";
import type { IssuedToken } from "@/features/deploy-tokens/issue/hooks/use-issue-deploy-token";
import { CopyButton } from "@/features/deploy-tokens/ui/copy-button";
import { TokenValue } from "@/features/deploy-tokens/ui/token-value";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

const focusOnMount = (button: HTMLButtonElement | null): void => {
  button?.focus();
};

/** 発行したトークンの値とコピーの操作を出す中身に渡す値。 */
type IssuedTokenContentProps = {
  /** 発行したトークン。 */
  issued: IssuedToken;
  /** Dialog を閉じる関数。 */
  onClose: () => void;
};

/** 発行したトークンの値を1回だけ見せ、コピーと閉じる操作を並べる。 */
export const IssuedTokenContent = ({
  issued,
  onClose,
}: IssuedTokenContentProps): ReactNode => {
  const t = useTranslate();
  const { result, copy } = useCopyText(issued.token);

  return (
    <>
      <Notice tone="warning">{t("deployTokens.shownOnce")}</Notice>
      <TokenValue
        label={t("deployTokens.value", { name: issued.name })}
        value={issued.token}
      />
      <Cluster gap={2} justify="end">
        <Button onPress={onClose}>{t("deployTokens.close")}</Button>
        <CopyButton
          onPress={() => {
            void copy();
          }}
          ref={focusOnMount}
          result={result}
        />
      </Cluster>
    </>
  );
};
