import { type ReactNode, useState } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import {
  type CopyTextResult,
  copyText,
} from "@/features/deploy-tokens/copy-text";
import { DEPLOY_TOKENS_QUERY_KEY } from "@/features/deploy-tokens/deploy-tokens-query";
import {
  checkDeployTokenName,
  issueDeployToken,
} from "@/features/deploy-tokens/issue-deploy-token";
import {
  toCopyNotice,
  toIssueNotice,
} from "@/features/deploy-tokens/to-deploy-token-notice";
import { TokenValue } from "@/features/deploy-tokens/ui/token-value";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { TextField } from "@/ui/primitives/form-fields";
import { Notice } from "@/ui/primitives/notice";
import { Dialog, useShowToast } from "@/ui/primitives/overlays";

/** 発行したトークン。 */
type IssuedToken = {
  /** 名前。 */
  readonly name: string;
  /** server が1回だけ返した token。 */
  readonly token: string;
};

const focusOnMount = (button: HTMLButtonElement | null): void => {
  button?.focus();
};

/** 発行したトークンの値と、コピーの操作に渡す値。 */
type IssuedTokenContentProps = {
  /** 発行したトークン。 */
  readonly issued: IssuedToken;
  /** Dialog を閉じる関数。 */
  readonly onClose: () => void;
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
  readonly isOpen: boolean;
  /** 閉じる関数。 */
  readonly onClose: () => void;
};

/** 名前を入れ、再認証をしてから、デプロイ用のトークンを発行して1回だけ見せる Dialog。 */
export const IssueDeployTokenDialog = ({
  isOpen,
  onClose,
}: IssueDeployTokenDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api, authenticator } = useAppContext();
  const [issued, setIssued] = useState<IssuedToken>(); // token は query client に入れない
  const issuing = useApiMutation({
    send: async (name: string) => {
      const result = await issueDeployToken({ api, authenticator }, name);

      if (result._tag === "Issued") {
        setIssued({ name: result.name, token: result.token });
        showToast({
          tone: "success",
          message: t("deployTokens.issued", { name: result.name }),
        });
      }

      return result._tag;
    },
    onSuccess: async (outcome) => {
      if (outcome === "Issued") {
        await refresh(DEPLOY_TOKENS_QUERY_KEY);
      }
    },
  });
  const outcome = issuing.isError ? "Unexpected" : issuing.data;
  const notice =
    outcome === undefined || outcome === "Issued"
      ? undefined
      : toIssueNotice(outcome);

  return (
    <Dialog
      isOpen={isOpen}
      isPending={issuing.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
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
            isPending={issuing.isPending}
            onSubmit={(data) => {
              const name = data.get("name");

              issuing.mutate(typeof name === "string" ? name : "");
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
              <Button isDisabled={issuing.isPending} onPress={onClose}>
                {t("deployTokens.cancel")}
              </Button>
              <Button
                isPending={issuing.isPending}
                tone="primary"
                type="submit"
              >
                {t("deployTokens.issue")}
              </Button>
            </Cluster>
          </Form>
        </>
      ) : (
        <IssuedTokenContent issued={issued} onClose={onClose} />
      )}
    </Dialog>
  );
};
