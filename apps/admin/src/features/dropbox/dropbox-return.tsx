import type { ReactNode } from "react";

import { useConnectReturned } from "@/features/dropbox/hooks/use-connect-returned";
import type { CallbackSearch } from "@/features/dropbox/logic/callback-search";
import { useTranslate } from "@/i18n/use-translate";
import { Stack, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

/** Dropbox から戻った画面に渡す値。 */
type DropboxReturnProps = {
  /** 戻った URL の search を読んだもの。 */
  search: CallbackSearch;
  /** つないだ後に、取り込みの画面へ移る。 */
  onConnected: () => void;
};

/** Dropbox の認可の画面から戻り、つないで、取り込みの画面へ移る欄。 */
export const DropboxReturn = ({
  search,
  onConnected,
}: DropboxReturnProps): ReactNode => {
  const t = useTranslate();
  const { state, connect } = useConnectReturned(search, onConnected);

  if (state === "Ready" || state === "Connecting" || state === "Connected") {
    return (
      <Stack align="start" gap={4}>
        <Text>{t("dropbox.returnReady")}</Text>
        <Button isPending={state !== "Ready"} onPress={connect} tone="primary">
          {t("dropbox.returnConnect")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack align="start" gap={4}>
      <Notice tone={state === "Denied" ? "info" : "danger"}>
        {t(`dropbox.return.${state}`)}
      </Notice>
      <Link href="/images/dropbox">{t("dropbox.returnBack")}</Link>
    </Stack>
  );
};
