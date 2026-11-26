import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useId, useState } from "react";

import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { TextArea } from "@/ui/primitives/form-fields";
import { Dialog, DialogActions, DialogSection } from "@/ui/primitives/overlays";

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

const statusStory = (status: "pending" | "success", title: string): Story => ({
  /** 保存中か成功時の表示を開く。 */
  render: function StatusDialog() {
    const [open, setOpen] = useState(true);
    return (
      <Dialog
        isOpen={open}
        onOpenChange={setOpen}
        status={status}
        title={title}
      />
    );
  },
});

export const Saving = statusStory("pending", "固定ページを保存しています");
export const Saved = statusStory("success", "固定ページを更新しました。");

export const Wide: Story = {
  /** 本文の幅を広く取った編集用の Dialog。 */
  render: function EditDialog() {
    const [open, setOpen] = useState(true);
    const [description, setDescription] = useState("");
    const formId = useId();

    return (
      <>
        <Button
          onPress={() => {
            setOpen(true);
          }}
        >
          説明を編集
        </Button>
        <Dialog
          isOpen={open}
          onOpenChange={setOpen}
          title="説明を編集"
          layout="wide"
          footer={{
            start: (
              <Text tone="muted" variant="caption">
                {description.length} 文字
              </Text>
            ),
            end: (
              <DialogActions>
                <Button form={formId} tone="primary" type="submit">
                  完了
                </Button>
              </DialogActions>
            ),
          }}
        >
          <DialogSection>
            <Form
              id={formId}
              onSubmit={() => {
                setOpen(false);
              }}
            >
              <TextArea
                isRequired
                label="説明"
                name="description"
                value={description}
                onChange={setDescription}
              />
            </Form>
          </DialogSection>
        </Dialog>
      </>
    );
  },
};
