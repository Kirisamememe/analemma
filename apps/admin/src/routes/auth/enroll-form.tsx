import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { PasskeyNameField } from "@/components/passkey-name-field";
import { toEnrollNotice } from "@/features/auth/logic/to-auth-notice";
import type { enroll } from "@/features/auth/queries/enroll";
import { RouteLink } from "@/routes/navigation/route-link";
import { Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { Notice } from "@/ui/primitives/notice";

const PASSKEY_NAME_MAX_LENGTH = 64;

type EnrollFormProps = {
  /** 登録を送っている最中か。 */
  isPending: boolean;
  /** 今の token で送った登録の結果(まだ送っていなければ無し)。 */
  outcome: Awaited<ReturnType<typeof enroll>>["_tag"] | undefined;
  /** パスキーの名前を受け取って、登録を送る関数。 */
  onSubmit: (name: string) => void;
};

/** 最初のパスキーに名前を付けて登録するフォーム。 */
export const EnrollForm = ({
  isPending,
  outcome,
  onSubmit,
}: EnrollFormProps): ReactNode => {
  const { t } = useTranslation();
  const notice = outcome === undefined ? undefined : toEnrollNotice(outcome);

  return (
    <Form
      isPending={isPending}
      onSubmit={(data) => {
        const name = data.get("name");

        onSubmit(typeof name === "string" ? name : "");
      }}
    >
      <PasskeyNameField maxLength={PASSKEY_NAME_MAX_LENGTH} showDescription />
      {notice?.place === "Notice" && (
        <Notice tone="danger">{t(notice.message)}</Notice>
      )}
      {outcome === "AlreadyRegistered" && (
        <Text>
          <RouteLink to="/login">{t("enroll.signIn")}</RouteLink>
        </Text>
      )}
      <Button
        pendingLabel={t("ui.pending")}
        isPending={isPending}
        tone="primary"
        type="submit"
      >
        {t("enroll.submit")}
      </Button>
    </Form>
  );
};
