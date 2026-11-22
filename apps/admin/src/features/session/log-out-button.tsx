import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Stack } from "../../ui/layout/stack";
import { NavButton } from "../../ui/primitives/navigation/nav-item";
import { Notice } from "../../ui/primitives/notice";
import type { useLogOut } from "./use-log-out";

/** ログアウトのボタンに渡す値。 */
type LogOutButtonProps = {
  /** ログアウトの状態と操作。 */
  readonly logOut: Pick<
    ReturnType<typeof useLogOut>,
    "isError" | "isPending" | "mutate"
  >;
};

/** 今のセッションからログアウトするボタン。 */
export const LogOutButton = ({ logOut }: LogOutButtonProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <Stack gap={2}>
      {logOut.isError && (
        <Notice tone="danger">{t("session.logOutFailed")}</Notice>
      )}
      <NavButton
        icon="log-out"
        isPending={logOut.isPending}
        onPress={() => {
          logOut.mutate();
        }}
      >
        {t("session.logOut")}
      </NavButton>
    </Stack>
  );
};
