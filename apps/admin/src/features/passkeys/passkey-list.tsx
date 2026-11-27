import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import {
  PasskeyRow,
  type PasskeySummary,
} from "@/features/passkeys/passkey-row";
import {
  PASSKEYS_QUERY_KEY,
  loadPasskeys,
} from "@/features/passkeys/queries/passkeys-query";
import { useTranslate } from "@/i18n/use-translate";
import { ActionList } from "@/ui/primitives/collections";

/** パスキーの一覧に渡す値。 */
type PasskeyListProps = {
  /** 名前の変更を始める関数。 */
  onRename: (passkey: PasskeySummary) => void;
  /** 削除を始める関数。 */
  onDelete: (passkey: PasskeySummary) => void;
};

/** 登録したパスキーの一覧。 */
export const PasskeyList = ({
  onRename,
  onDelete,
}: PasskeyListProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();

  const passkeys = useApiQuery({
    key: PASSKEYS_QUERY_KEY,
    load: () => loadPasskeys(api),
  });

  return (
    <QueryContent
      failedTitle={t("passkeys.loadFailed")}
      level={3}
      loading="list"
      query={passkeys}
    >
      {({ passkeys: list }) => (
        <ActionList>
          {list.map((passkey) => (
            <li key={passkey.id}>
              <PasskeyRow
                onDelete={onDelete}
                onRename={onRename}
                passkey={passkey}
              />
            </li>
          ))}
        </ActionList>
      )}
    </QueryContent>
  );
};
