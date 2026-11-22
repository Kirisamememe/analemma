import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiOutputs } from "../../api/api-types";
import { Cluster } from "../../ui/layout/cluster";
import { Heading } from "../../ui/layout/heading";
import { Stack } from "../../ui/layout/stack";
import { Button } from "../../ui/primitives/button";
import { Notice } from "../../ui/primitives/notice";
import { AddPasskeyDialog } from "./add-passkey-dialog";
import { DeletePasskeyDialog } from "./delete-passkey-dialog";
import { PasskeyList, type PasskeySummary } from "./passkey-list";
import { PASSKEYS_QUERY_KEY } from "./passkeys-query";
import { RenamePasskeyDialog } from "./rename-passkey-dialog";
import type { PasskeyNotice } from "./to-passkey-notice";

type PasskeyAction =
  | {
      /** パスキーを追加する操作。 */
      readonly type: "add";
    }
  | {
      /** パスキーを選んで行う操作。 */
      readonly type: "rename" | "delete";
      /** 操作するパスキー。 */
      readonly passkey: PasskeySummary;
    };

type PasskeyDialog = {
  /** Dialog で行う操作。 */
  readonly action: PasskeyAction;
  /** Dialog が開いているか。 */
  readonly isOpen: boolean;
  /** 開くたびに変わる React の key。 */
  readonly key: number;
};

/** パスキーの一覧と、追加・名前の変更・削除の操作。 */
export const PasskeysSection = (): ReactNode => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addButton = useRef<HTMLButtonElement>(null);
  const [notice, setNotice] = useState<PasskeyNotice>();
  const [dialog, setDialog] = useState<PasskeyDialog>();
  const openDialog = (action: PasskeyAction): void => {
    setNotice(undefined);
    setDialog((previous) => ({
      action,
      isOpen: true,
      key: (previous?.key ?? 0) + 1,
    }));
  };

  const closeDialog = (): void => {
    setDialog((current) =>
      current?.isOpen === true ? { ...current, isOpen: false } : current,
    );
  };

  useEffect(() => {
    if (dialog === undefined || dialog.isOpen || dialog.action.type === "add") {
      return;
    }

    const { passkey } = dialog.action;
    const listed =
      queryClient.getQueryData<ApiOutputs["admin"]["passkeys"]["list"]>(
        PASSKEYS_QUERY_KEY,
      );

    const isShown =
      queryClient.getQueryState(PASSKEYS_QUERY_KEY)?.status === "success" &&
      (listed?.passkeys.some(({ id }) => id === passkey.id) ?? false);

    if (!isShown) {
      addButton.current?.focus();
    }
  }, [dialog, queryClient]);

  return (
    <Stack as="section" gap={4}>
      <Cluster align="center" gap={4} justify="between">
        <Heading level={2}>{t("passkeys.title")}</Heading>
        <Button
          onPress={() => {
            openDialog({ type: "add" });
          }}
          ref={addButton}
          tone="primary"
        >
          {t("passkeys.add")}
        </Button>
      </Cluster>
      {notice !== undefined && (
        <Notice tone={notice.tone}>{t(notice.message)}</Notice>
      )}
      <PasskeyList
        onDelete={(passkey) => {
          openDialog({ type: "delete", passkey });
        }}
        onRename={(passkey) => {
          openDialog({ type: "rename", passkey });
        }}
      />
      {dialog?.action.type === "add" && (
        <AddPasskeyDialog
          isOpen={dialog.isOpen}
          key={dialog.key}
          onAdded={setNotice}
          onClose={closeDialog}
        />
      )}
      {dialog?.action.type === "rename" && (
        <RenamePasskeyDialog
          isOpen={dialog.isOpen}
          key={dialog.key}
          onClose={closeDialog}
          onRenamed={setNotice}
          passkey={dialog.action.passkey}
        />
      )}
      {dialog?.action.type === "delete" && (
        <DeletePasskeyDialog
          isOpen={dialog.isOpen}
          key={dialog.key}
          onClose={closeDialog}
          onDeleted={setNotice}
          passkey={dialog.action.passkey}
        />
      )}
    </Stack>
  );
};
