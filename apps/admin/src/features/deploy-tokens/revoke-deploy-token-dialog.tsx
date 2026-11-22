import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import {
  DEPLOY_TOKENS_QUERY_KEY,
  type DeployTokenSummary,
} from "@/features/deploy-tokens/deploy-tokens-query";
import { revokeDeployToken } from "@/features/deploy-tokens/revoke-deploy-token";
import { toRevokeNotice } from "@/features/deploy-tokens/to-deploy-token-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";
import { Dialog, useShowToast } from "@/ui/primitives/overlays";

/** デプロイ用のトークンを取り消す Dialog に渡す値。 */
type RevokeDeployTokenDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 取り消すトークン。 */
  token: DeployTokenSummary;
  /** 閉じる関数。 */
  onClose: () => void;
};

/** 名前を見せて確かめてから、デプロイ用のトークンを取り消す Dialog。 */
export const RevokeDeployTokenDialog = ({
  isOpen,
  token,
  onClose,
}: RevokeDeployTokenDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const revoking = useApiMutation({
    send: () => revokeDeployToken(api, token.id),
    onSuccess: async ({ _tag }) => {
      await refresh(DEPLOY_TOKENS_QUERY_KEY);

      if (_tag === "Revoked") {
        onClose();
        showToast({
          tone: "success",
          message: t("deployTokens.revoked", { name: token.name }),
        });
      }
    },
  });
  const outcome = revoking.isError ? "Unexpected" : revoking.data?._tag;
  const notice =
    outcome === undefined || outcome === "Revoked"
      ? undefined
      : toRevokeNotice(outcome);

  return (
    <Dialog
      isOpen={isOpen}
      isPending={revoking.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t("deployTokens.revokeTitle", { name: token.name })}
    >
      <Text>{t("deployTokens.revokeDescription")}</Text>
      {notice !== undefined && (
        <Notice tone={notice.tone}>{t(notice.message)}</Notice>
      )}
      <Cluster gap={2} justify="end">
        <Button isDisabled={revoking.isPending} onPress={onClose}>
          {t("deployTokens.cancel")}
        </Button>
        <Button
          isPending={revoking.isPending}
          onPress={() => {
            revoking.mutate();
          }}
          tone="danger"
        >
          {t("deployTokens.revoke")}
        </Button>
      </Cluster>
    </Dialog>
  );
};
