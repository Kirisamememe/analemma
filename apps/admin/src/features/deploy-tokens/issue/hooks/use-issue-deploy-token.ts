import { useState } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { DEPLOY_TOKENS_QUERY_KEY } from "@/features/deploy-tokens/queries/deploy-tokens-query";
import { issueDeployToken } from "@/features/deploy-tokens/issue/queries/issue-deploy-token";
import { toIssueFailure } from "@/features/deploy-tokens/logic/to-deploy-token-notice";
import { useTranslate } from "@/i18n/use-translate";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

/** 発行したトークン。 */
export type IssuedToken = {
  /** 名前。 */
  readonly name: string;
  /** server が1回だけ返した token。 */
  readonly token: string;
};

/** デプロイ用のトークンを発行する hook に渡す値。 */
type IssueDeployTokenOptions = {
  /** Dialog を閉じる関数。 */
  readonly onClose: () => void;
};

/** デプロイ用のトークンを発行し、token を Dialog の state に持つ操作。 */
export const useIssueDeployToken = ({ onClose }: IssueDeployTokenOptions) => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const { refresh } = useApiCache();
  const { api, authenticator } = useAppContext();
  const [issued, setIssued] = useState<IssuedToken>(); // token は query client に入れない

  const issuing = useApiMutation({
    send: async (name: string) => {
      const result = await issueDeployToken({ api, authenticator }, name);

      if (result._tag === "Issued") {
        setIssued({ name: result.name, token: result.token });
      }

      return { _tag: result._tag };
    },
    onSuccess: async ({ _tag }) => {
      if (_tag === "Issued") {
        await refresh(DEPLOY_TOKENS_QUERY_KEY);
      } else if (_tag === "ReauthenticationFailed") {
        failure.show(t(toIssueFailure(_tag)));
      }
    },
    onError: () => {
      failure.show(t(toIssueFailure("Unexpected")));
    },
  });

  return {
    issued,
    isPending: issuing.isPending,
    issue: (name: string): void => {
      failure.close();
      issuing.mutate(name);
    },
    close: (): void => {
      failure.close();

      if (issued !== undefined) {
        showToast({
          tone: "success",
          message: t("deployTokens.issued", { name: issued.name }),
        });
      }

      onClose();
    },
  };
};
