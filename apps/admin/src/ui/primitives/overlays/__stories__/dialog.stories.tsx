import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";
import { Dialog } from "@/ui/primitives/overlays/dialog";

/** `DeleteDialog` に渡す値。 */
type DeleteDialogProps = {
  /** 削除するパスキーの名前。 */
  name: string;
  /** 送信中か。 */
  isPending: boolean;
  /** Dialog の中の知らせ。 */
  notice: ReactNode;
};

const DeleteDialog = ({
  name,
  isPending,
  notice,
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
        isOpen={isOpen}
        isPending={isPending}
        onOpenChange={setIsOpen}
        title={`「${name}」を削除しますか?`}
      >
        <Text>
          登録済みのパスキーで本人確認をしてから削除します。ほかのブラウザからはログアウトします。
        </Text>
        {notice}
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
  args: { name: "MacBook Air", isPending: false, notice: undefined },
} satisfies Meta<typeof DeleteDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = { args: { isPending: true } };

export const WithError: Story = {
  args: {
    notice: <Notice tone="danger">本人確認ができませんでした。</Notice>,
  },
};

export const LongName: Story = {
  args: {
    name: "passkey-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijkl",
  },
};
