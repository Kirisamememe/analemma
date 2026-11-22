import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Cluster } from "../../layout/cluster";
import { Text } from "../../layout/text";
import { Button } from "../button";
import { Dialog } from "../dialog";
import { Notice } from "../notice";

/** `DeleteDialog` に渡す値。 */
type DeleteDialogProps = {
  /** 削除するパスキーの名前。 */
  readonly name: string;
  /** 送信中か。 */
  readonly isPending: boolean;
  /** Dialog の中の知らせ。 */
  readonly notice: ReactNode;
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
