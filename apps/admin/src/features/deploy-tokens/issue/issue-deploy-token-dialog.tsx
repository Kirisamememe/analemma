import { type ReactNode, useState } from "react";

import {
  type CopyTextResult,
  copyText,
} from "@/features/deploy-tokens/issue/copy-text";
import { checkDeployTokenName } from "@/features/deploy-tokens/issue/issue-deploy-token";
import {
  type IssuedToken,
  useIssueDeployToken,
} from "@/features/deploy-tokens/issue/use-issue-deploy-token";
import { toCopyNotice } from "@/features/deploy-tokens/to-deploy-token-notice";
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
  const [copied, setCopied] = useState<CopyTextResult["_tag"]>();
  const notice = copied === undefined ? undefined : toCopyNotice(copied);
  const copy = async (): Promise<void> => {
    const { _tag } = await copyText(
      (text) => navigator.clipboard.writeText(text),
      issued.token,
    );

    setCopied(_tag);
  };

  return (
    <>
      <Notice tone="warning">{t("deployTokens.shownOnce")}</Notice>
      <TokenValue
        label={t("deployTokens.value", { name: issued.name })}
        value={issued.token}
      />
      {notice !== undefined && (
        <Notice tone={notice.tone}>{t(notice.message)}</Notice>
      )}
      <Cluster gap={2} justify="end">
        <Button onPress={onClose}>{t("deployTokens.close")}</Button>
        <Button
          onPress={() => {
            void copy();
          }}
          ref={focusOnMount}
          tone="primary"
        >
          {t("deployTokens.copy")}
        </Button>
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
