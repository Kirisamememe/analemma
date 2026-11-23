import { useState } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { DEPLOY_TOKENS_QUERY_KEY } from "@/features/deploy-tokens/deploy-tokens-query";
import { issueDeployToken } from "@/features/deploy-tokens/issue/issue-deploy-token";
import { toIssueNotice } from "@/features/deploy-tokens/to-deploy-token-notice";
import { useTranslate } from "@/i18n/use-translate";
import { useShowToast } from "@/ui/primitives/overlays";

/** 発行したトークン。 */
export type IssuedToken = {
  /** 名前。 */
  readonly name: string;
  /** server が1回だけ返した token。 */
  readonly token: string;
};

/** 発行の Dialog を閉じる関数を受け取る。 */
type IssueDeployTokenOptions = {
  /** Dialog を閉じる関数。 */
  readonly onClose: () => void;
};

/** デプロイ用のトークンを発行し、token を Dialog の state に持つ操作。 */
export const useIssueDeployToken = ({ onClose }: IssueDeployTokenOptions) => {
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
      }

      return { _tag: result._tag };
    },
    onSuccess: async ({ _tag }) => {
      if (_tag === "Issued") {
        await refresh(DEPLOY_TOKENS_QUERY_KEY);
      }
    },
  });

  return {
    issued,
    isPending: issuing.isPending,
    notice: toIssueNotice(issuing.isError ? "Unexpected" : issuing.data?._tag),
    issue: (name: string): void => {
      issuing.mutate(name);
    },
    close: (): void => {
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
