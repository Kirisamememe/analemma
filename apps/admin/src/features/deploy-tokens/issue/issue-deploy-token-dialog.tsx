import type { ReactNode } from "react";

import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { useCopyText } from "@/features/deploy-tokens/issue/hooks/use-copy-text";
import {
  type IssuedToken,
  useIssueDeployToken,
} from "@/features/deploy-tokens/issue/hooks/use-issue-deploy-token";
import { checkDeployTokenName } from "@/features/deploy-tokens/issue/logic/check-deploy-token-name";
import { CopyButton } from "@/features/deploy-tokens/ui/copy-button";
import { TokenValue } from "@/features/deploy-tokens/ui/token-value";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
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

/** 名前を入れて発行を送るフォームに渡す値。 */
type IssueFormProps = {
  /** 発行を送っているか。 */
  isPending: boolean;
  /** 名前を受け取り、発行を送る関数。 */
  onIssue: (name: string) => void;
  /** Dialog を閉じる関数。 */
  onClose: () => void;
};

const IssueForm = ({
  isPending,
  onIssue,
  onClose,
}: IssueFormProps): ReactNode => {
  const t = useTranslate();

  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: { name: "" },
    onSubmit: ({ value }) => {
      onIssue(value.name);
    },
  });

  return (
    <form.AppForm>
      <form.Form isPending={isPending}>
        <form.AppField
          name="name"
          validators={{
            onChange: checkAfterSubmit((value: string) => {
              const problem = checkDeployTokenName(value);

              return problem === undefined ? undefined : t(problem);
            }),
          }}
        >
          {(field) => (
            <field.TextField
              autoComplete="off"
              description={t("deployTokens.guide.name")}
              isRequired
              label={t("deployTokens.name")}
            />
          )}
        </form.AppField>
        <Cluster gap={2} justify="end">
          <Button isDisabled={isPending} onPress={onClose}>
            {t("deployTokens.cancel")}
          </Button>
          <Button isPending={isPending} tone="primary" type="submit">
            {t("deployTokens.issue")}
          </Button>
        </Cluster>
      </form.Form>
    </form.AppForm>
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

  const { issued, isPending, issue, close } = useIssueDeployToken({
    onClose,
  });

  return (
    <Dialog
      isDismissable={issued === undefined}
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
          <IssueForm isPending={isPending} onClose={close} onIssue={issue} />
        </>
      ) : (
        <IssuedTokenContent issued={issued} onClose={close} />
      )}
    </Dialog>
  );
};
