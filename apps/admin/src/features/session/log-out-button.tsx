import type { ReactNode } from "react";

import type { useLogOut } from "@/features/session/use-log-out";
import { useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { NavButton } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

/** ログアウトのボタンに渡す値。 */
type LogOutButtonProps = {
  /** ログアウトの状態と操作。 */
  logOut: Pick<
    ReturnType<typeof useLogOut>,
    "isError" | "isPending" | "mutate"
  >;
};

/** 今のセッションからログアウトするボタン。 */
export const LogOutButton = ({ logOut }: LogOutButtonProps): ReactNode => {
  const t = useTranslate();

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
