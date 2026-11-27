import type { ReactNode } from "react";

import { useIssueDeployToken } from "@/features/deploy-tokens/issue/hooks/use-issue-deploy-token";
import { IssueForm } from "@/features/deploy-tokens/issue/issue-form";
import { IssuedTokenContent } from "@/features/deploy-tokens/issue/issued-token-content";
import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { Dialog } from "@/ui/primitives/overlays";

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
