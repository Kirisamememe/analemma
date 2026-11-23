import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import {
  DEPLOY_TOKENS_QUERY_KEY,
  type DeployTokenSummary,
} from "@/features/deploy-tokens/queries/deploy-tokens-query";
import { revokeDeployToken } from "@/features/deploy-tokens/queries/revoke-deploy-token";
import { toRevokeFailure } from "@/features/deploy-tokens/logic/to-deploy-token-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

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
  const failure = useFailureToast();
  const close = (): void => {
    failure.close();
    onClose();
  };

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
      } else {
        failure.show(t(toRevokeFailure(_tag)));
      }
    },
    onError: () => {
      failure.show(t(toRevokeFailure("Unexpected")));
    },
  });

  return (
    <Dialog
      isOpen={isOpen}
      isPending={revoking.isPending}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      title={t("deployTokens.revokeTitle", { name: token.name })}
    >
      <Text>{t("deployTokens.revokeDescription")}</Text>
      <Cluster gap={2} justify="end">
        <Button isDisabled={revoking.isPending} onPress={close}>
          {t("deployTokens.cancel")}
        </Button>
        <Button
          isPending={revoking.isPending}
          onPress={() => {
            failure.close();
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
