import { type ReactNode, useState } from "react";

import { SaveStatusDialog } from "./frame/save-status-dialog";
import {
  SaveStatusContext,
  type SaveStatus,
} from "./hooks/save-status-context";

type SaveStatusProviderProps = {
  /** 固定ページの作成・編集画面を見分けるパスと検索条件。 */
  location: string | undefined;
  /** 保存中に操作を止める管理画面。 */
  children: ReactNode;
};

/** 固定ページを作成して編集画面に移っても、保存の Dialog を表示し続ける。 */
export const SaveStatusProvider = ({
  location,
  children,
}: SaveStatusProviderProps): ReactNode => {
  const [status, setStatus] = useState<SaveStatus>();

  const [previousLocation, setPreviousLocation] = useState(location);

  if (previousLocation !== location) {
    setPreviousLocation(location);

    if (status !== "created" || location === undefined) setStatus(undefined);
  }

  return (
    <SaveStatusContext value={setStatus}>
      <div inert={status !== undefined}>{children}</div>
      {status !== undefined && (
        <SaveStatusDialog
          status={status}
          onClose={() => {
            setStatus(undefined);
          }}
        />
      )}
    </SaveStatusContext>
  );
};
