import { type ReactNode, useState } from "react";

import {
  SaveStatusContext,
  type SaveStatus,
} from "./hooks/save-status-context";

import { useTranslate } from "@/i18n/use-translate";
import { Dialog } from "@/ui/primitives/overlays";

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
  const t = useTranslate();

  const [previousLocation, setPreviousLocation] = useState(location);

  if (previousLocation !== location) {
    setPreviousLocation(location);

    if (status !== "created" || location === undefined) setStatus(undefined);
  }

  return (
    <SaveStatusContext value={setStatus}>
      <div inert={status !== undefined}>{children}</div>
      {status !== undefined && (
        <Dialog
          isOpen
          title={t(
            status === "pending"
              ? "fixedPageEditor.saving"
              : `fixedPageEditor.${status}`,
          )}
          status={status === "pending" ? "pending" : "success"}
          onOpenChange={(open) => {
            if (open || status === "pending") return;

            setStatus(undefined);

            if (status === "created") {
              requestAnimationFrame(() => {
                const main = document.querySelector("main");

                const field =
                  main?.querySelector("input") ?? main?.querySelector("a");

                field?.focus();
              });
            }
          }}
        />
      )}
    </SaveStatusContext>
  );
};
