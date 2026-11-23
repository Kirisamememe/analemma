import type { ReactNode } from "react";

import type { useLogOut } from "@/features/session/hooks/use-log-out";
import { useTranslate } from "@/i18n/use-translate";
import { NavButton } from "@/ui/primitives/navigation";

/** ログアウトのボタンに渡す値。 */
type LogOutButtonProps = {
  /** ログアウトの状態と操作。 */
  logOut: Pick<ReturnType<typeof useLogOut>, "isPending" | "mutate">;
};

/** 今のセッションからログアウトするボタン。 */
export const LogOutButton = ({ logOut }: LogOutButtonProps): ReactNode => {
  const t = useTranslate();

  return (
    <NavButton
      icon="log-out"
      isPending={logOut.isPending}
      onPress={() => {
        logOut.mutate();
      }}
    >
      {t("session.logOut")}
    </NavButton>
  );
};
