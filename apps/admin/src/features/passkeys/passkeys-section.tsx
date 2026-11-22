import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cluster } from "../../ui/layout/cluster";
import { Heading } from "../../ui/layout/heading";
import { Stack } from "../../ui/layout/stack";
import { Button } from "../../ui/primitives/button";
import { FocusScope } from "../../ui/primitives/focus-scope";
import { Notice } from "../../ui/primitives/notice";
import { AddPasskeyDialog } from "./add-passkey-dialog";
import { DeletePasskeyDialog } from "./delete-passkey-dialog";
import { PasskeyList, type PasskeySummary } from "./passkey-list";
import { RenamePasskeyDialog } from "./rename-passkey-dialog";
import type { PasskeyNotice } from "./to-passkey-notice";

type PasskeyDialog = "add" | "rename" | "delete";

/** パスキーの一覧と、追加・名前の変更・削除の操作。 */
export const PasskeysSection = (): ReactNode => {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<PasskeyNotice>();
  const [openDialog, setOpenDialog] = useState<PasskeyDialog>();
  const [openCount, setOpenCount] = useState(0); // Dialog の key。開くたびに前の送信の結果を消す
  const [passkey, setPasskey] = useState<PasskeySummary>(); // 閉じても持ち、閉じる animation の間も出す
  const open = (dialog: PasskeyDialog): void => {
    setNotice(undefined);
    setOpenDialog(dialog);
    setOpenCount((count) => count + 1);
  };

  const close = (): void => {
    setOpenDialog(undefined);
  };

  return (
    <FocusScope>
      <Stack as="section" gap={4}>
        <Cluster align="center" gap={4} justify="between">
          <Heading level={2}>{t("passkeys.title")}</Heading>
          <Button
            onPress={() => {
              open("add");
            }}
            tone="primary"
          >
            {t("passkeys.add")}
          </Button>
        </Cluster>
        {notice !== undefined && (
          <Notice tone={notice.tone}>{t(notice.message)}</Notice>
        )}
        <PasskeyList
          onDelete={(selected) => {
            setPasskey(selected);
            open("delete");
          }}
          onRename={(selected) => {
            setPasskey(selected);
            open("rename");
          }}
        />
        <AddPasskeyDialog
          isOpen={openDialog === "add"}
          key={`add-${openCount}`}
          onAdded={setNotice}
          onClose={close}
        />
        {passkey !== undefined && (
          <>
            <RenamePasskeyDialog
              isOpen={openDialog === "rename"}
              key={`rename-${openCount}`}
              onClose={close}
              onRenamed={setNotice}
              passkey={passkey}
            />
            <DeletePasskeyDialog
              isOpen={openDialog === "delete"}
              key={`delete-${openCount}`}
              onClose={close}
              onDeleted={setNotice}
              passkey={passkey}
            />
          </>
        )}
      </Stack>
    </FocusScope>
  );
};
