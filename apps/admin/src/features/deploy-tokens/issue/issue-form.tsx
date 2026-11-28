import type { ReactNode } from "react";

import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { checkDeployTokenName } from "@/features/deploy-tokens/issue/logic/check-deploy-token-name";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";

/** 名前を入れて発行を送るフォームに渡す値。 */
type IssueFormProps = {
  /** 発行を送っているか。 */
  isPending: boolean;
  /** 名前を受け取り、発行を送る関数。 */
  onIssue: (name: string) => void;
  /** Dialog を閉じる関数。 */
  onClose: () => void;
};

/** トークンの名前を入れて、発行を送るフォーム。 */
export const IssueForm = ({
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
          <Button
            pendingLabel={t("ui.pending")}
            isPending={isPending}
            tone="primary"
            type="submit"
          >
            {t("deployTokens.issue")}
          </Button>
        </Cluster>
      </form.Form>
    </form.AppForm>
  );
};
