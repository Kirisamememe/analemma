import type { ReactNode } from "react";

import { checkDeployTokenName } from "@/features/deploy-tokens/issue/issue-deploy-token";
import { useCopyText } from "@/features/deploy-tokens/issue/use-copy-text";
import {
  type IssuedToken,
  useIssueDeployToken,
} from "@/features/deploy-tokens/issue/use-issue-deploy-token";
import { CopyButton } from "@/features/deploy-tokens/ui/copy-button";
import { TokenValue } from "@/features/deploy-tokens/ui/token-value";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { TextField } from "@/ui/primitives/form-fields";
import { Notice } from "@/ui/primitives/notice";
import { Dialog } from "@/ui/primitives/overlays";

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

const IssuedTokenContent = ({
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

/** デプロイ用のトークンを発行する Dialog に渡す値。 */
type IssueDeployTokenDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 閉じる関数。 */
  onClose: () => void;
};

/** 名前を入れ、再認証をしてから、デプロイ用のトークンを発行して1回だけ見せる Dialog。 */
export const IssueDeployTokenDialog = ({
  isOpen,
  onClose,
}: IssueDeployTokenDialogProps): ReactNode => {
  const t = useTranslate();

  const { issued, isPending, notice, issue, close } = useIssueDeployToken({
    onClose,
  });

  return (
    <Dialog
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      title={t(
        issued === undefined
          ? "deployTokens.issue"
          : "deployTokens.issuedTitle",
      )}
    >
      {issued === undefined ? (
        <>
          <Text tone="muted">{t("deployTokens.issueDescription")}</Text>
          <Form
            isPending={isPending}
            onSubmit={(data) => {
              const name = data.get("name");

              issue(typeof name === "string" ? name : "");
            }}
          >
            <TextField
              autoComplete="off"
              description={t("deployTokens.nameDescription")}
              isRequired
              label={t("deployTokens.name")}
              name="name"
              validate={(value) => {
                const problem = checkDeployTokenName(value);

                return problem === undefined ? undefined : t(problem);
              }}
            />
            {notice !== undefined && (
              <Notice tone={notice.tone}>{t(notice.message)}</Notice>
            )}
            <Cluster gap={2} justify="end">
              <Button isDisabled={isPending} onPress={onClose}>
                {t("deployTokens.cancel")}
              </Button>
              <Button isPending={isPending} tone="primary" type="submit">
                {t("deployTokens.issue")}
              </Button>
            </Cluster>
          </Form>
        </>
      ) : (
        <IssuedTokenContent issued={issued} onClose={close} />
      )}
    </Dialog>
  );
};
