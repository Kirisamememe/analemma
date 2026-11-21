import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { ApiOutputs } from "../../api/api-types";
import { useTranslation } from "../../i18n/use-translation";
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

/** パスキーの一覧と、追加・名前の変更・削除の操作。 */
export const PasskeysSection = (): ReactNode => {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const addButton = useRef<HTMLButtonElement>(null);
  const [notice, setNotice] = useState<PasskeyNotice>();
  const [isAdding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<PasskeySummary>();
  const [deleting, setDeleting] = useState<PasskeySummary>();
  const focusAdd = useRef(false);
  const rememberIfGone = (passkey: PasskeySummary): void => {
    const listed =
      queryClient.getQueryData<ApiOutputs["admin"]["passkeys"]["list"]>(
        PASSKEYS_QUERY_KEY,
      );

    const isShown =
      queryClient.getQueryState(PASSKEYS_QUERY_KEY)?.status === "success" &&
      (listed?.passkeys.some(({ id }) => id === passkey.id) ?? false);

    focusAdd.current = !isShown;
  };

  useEffect(() => {
    if (renaming === undefined && deleting === undefined && focusAdd.current) {
      focusAdd.current = false;
      addButton.current?.focus();
    }
  }, [renaming, deleting]);

  return (
    <Stack as="section" gap={4}>
      <Cluster align="center" gap={4} justify="between">
        <Heading level={2}>{t("passkeys.title")}</Heading>
        <Button
          onPress={() => {
            setNotice(undefined);
            setAdding(true);
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
          setNotice(undefined);
          setDeleting(passkey);
        }}
        onRename={(passkey) => {
          setNotice(undefined);
          setRenaming(passkey);
        }}
      />
      {isAdding && (
        <AddPasskeyDialog
          isOpen
          onAdded={setNotice}
          onClose={() => {
            setAdding(false);
          }}
        />
      )}
      {renaming !== undefined && (
        <RenamePasskeyDialog
          onClose={() => {
            rememberIfGone(renaming);
            setRenaming(undefined);
          }}
          onRenamed={setNotice}
          passkey={renaming}
        />
      )}
      {deleting !== undefined && (
        <DeletePasskeyDialog
          onClose={() => {
            rememberIfGone(deleting);
            setDeleting(undefined);
          }}
          onDeleted={setNotice}
          passkey={deleting}
        />
      )}
    </Stack>
  );
};
