import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays/dialog";

/** `DeleteDialog` に渡す値。 */
type DeleteDialogProps = {
  /** 削除するパスキーの名前。 */
  name: string;
  /** 送信中か。 */
  isPending: boolean;
  /** backdrop の押下で閉じるか。 */
  isDismissable: boolean;
};

const DeleteDialog = ({
  name,
  isPending,
  isDismissable,
}: DeleteDialogProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <Button
        onPress={() => {
          setIsOpen(true);
        }}
      >
        Dialog を開く
      </Button>
      <Dialog
        isDismissable={isDismissable}
        isOpen={isOpen}
        isPending={isPending}
        onOpenChange={setIsOpen}
        title={`「${name}」を削除しますか?`}
      >
        <Text>
          登録済みのパスキーで本人確認をしてから削除します。ほかのブラウザからはログアウトします。
        </Text>
        <Cluster gap={2} justify="end">
          <Button
            isDisabled={isPending}
            onPress={() => {
              setIsOpen(false);
            }}
          >
            キャンセル
          </Button>
          <Button isPending={isPending} tone="danger">
            削除
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};

const meta = {
  title: "primitives/Dialog",
  component: DeleteDialog,
  args: { name: "MacBook Air", isPending: false, isDismissable: true },
} satisfies Meta<typeof DeleteDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = { args: { isPending: true } };

export const NotDismissable: Story = { args: { isDismissable: false } };

export const LongName: Story = {
  args: {
    name: "passkey-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijkl",
  },
};

export const Saving: Story = {
  /** 保存中のまま表示する。 */
  render: () => (
    <Dialog
      isOpen
      onOpenChange={() => undefined}
      status="pending"
      title="固定ページを保存しています"
    />
  ),
};

export const Saved: Story = {
  /** 保存が成功した状態を表示し、閉じる操作を試せる。 */
  render: function SavedDialog() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button
          onPress={() => {
            setOpen(true);
          }}
        >
          Dialog を開く
        </Button>
        <Dialog
          isOpen={open}
          onOpenChange={setOpen}
          status="success"
          title="固定ページを更新しました。"
        />
      </>
    );
  },
};
