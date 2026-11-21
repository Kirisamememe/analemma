import { type ReactNode, useState } from "react";

import { useTranslation } from "../../i18n/use-translation";
import { Cluster } from "../../ui/layout/cluster";
import { Heading } from "../../ui/layout/heading";
import { Stack } from "../../ui/layout/stack";
import { Button } from "../../ui/primitives/button";
import { Notice } from "../../ui/primitives/notice";
import { AddPasskeyDialog } from "./add-passkey-dialog";
import { DeletePasskeyDialog } from "./delete-passkey-dialog";
import { PasskeyList, type PasskeySummary } from "./passkey-list";
import { RenamePasskeyDialog } from "./rename-passkey-dialog";
import type { PasskeyNotice } from "./to-passkey-notice";

/** パスキーの一覧と、足す・名前を変える・消す操作。 */
export const PasskeysSection = (): ReactNode => {
  const t = useTranslation();
  const [notice, setNotice] = useState<PasskeyNotice>();
  const [isAdding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<PasskeySummary>();
  const [deleting, setDeleting] = useState<PasskeySummary>();

  return (
    <Stack as="section" gap={4}>
      <Cluster align="center" gap={4} justify="between">
        <Heading level={2}>{t("passkeys.title")}</Heading>
        <Button
          onPress={() => {
            setNotice(undefined);
            setAdding(true);
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
        onDelete={(passkey) => {
          setNotice(undefined);
          setDeleting(passkey);
        }}
        onRename={setRenaming}
      />
      <AddPasskeyDialog
        isOpen={isAdding}
        onAdded={setNotice}
        onClose={() => {
          setAdding(false);
        }}
      />
      {renaming !== undefined && (
        <RenamePasskeyDialog
          onClose={() => {
            setRenaming(undefined);
          }}
          passkey={renaming}
        />
      )}
      {deleting !== undefined && (
        <DeletePasskeyDialog
          onClose={() => {
            setDeleting(undefined);
          }}
          onDeleted={setNotice}
          passkey={deleting}
        />
      )}
    </Stack>
  );
};
