import { type ReactNode, useState } from "react";

import { DeployTokenList } from "@/features/deploy-tokens/deploy-token-list";
import type { DeployTokenSummary } from "@/features/deploy-tokens/deploy-tokens-query";
import { IssueDeployTokenDialog } from "@/features/deploy-tokens/issue-deploy-token-dialog";
import { RevokeDeployTokenDialog } from "@/features/deploy-tokens/revoke-deploy-token-dialog";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { FocusScope } from "@/ui/primitives/focus-scope";

type DeployTokenDialog = "issue" | "revoke";

/** デプロイ用のトークンの一覧と、発行・取り消しの操作。 */
export const DeployTokensSection = (): ReactNode => {
  const t = useTranslate();
  const [openDialog, setOpenDialog] = useState<DeployTokenDialog>();
  const [openCount, setOpenCount] = useState(0); // Dialog の key。開くたびに作り直す
  const [token, setToken] = useState<DeployTokenSummary>(); // 閉じても持ち、閉じる animation の間も出す
  const open = (dialog: DeployTokenDialog): void => {
    setOpenDialog(dialog);
    setOpenCount((count) => count + 1);
  };

  const close = (): void => {
    setOpenDialog(undefined);
  };

  return (
    <FocusScope>
      <Stack as="section" gap={4}>
        <Cluster align="center" gap={4} justify="between">
          <Heading level={2}>{t("deployTokens.listTitle")}</Heading>
          <Button
            onPress={() => {
              open("issue");
            }}
            tone="primary"
          >
            {t("deployTokens.issue")}
          </Button>
        </Cluster>
        <DeployTokenList
          onRevoke={(selected) => {
            setToken(selected);
            open("revoke");
          }}
        />
        <IssueDeployTokenDialog
          isOpen={openDialog === "issue"}
          key={`issue-${openCount}`}
          onClose={close}
        />
        {token !== undefined && (
          <RevokeDeployTokenDialog
            isOpen={openDialog === "revoke"}
            key={`revoke-${openCount}`}
            onClose={close}
            token={token}
          />
        )}
      </Stack>
    </FocusScope>
  );
};
