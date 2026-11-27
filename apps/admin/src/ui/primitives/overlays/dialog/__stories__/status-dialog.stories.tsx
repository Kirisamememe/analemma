import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { StatusDialog } from "@/ui/primitives/overlays";

/** `OpenStatusDialog` に渡す値。 */
type OpenStatusDialogProps = {
  /** 処理の状態を伝える文言。 */
  title: string;
  /** 処理中か、成功したか。 */
  status: "pending" | "success";
};

const OpenStatusDialog = ({
  title,
  status,
}: OpenStatusDialogProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <StatusDialog
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      status={status}
      title={title}
    />
  );
};

const meta = {
  title: "primitives/StatusDialog",
  component: OpenStatusDialog,
  args: { title: "固定ページを保存しています", status: "pending" },
} satisfies Meta<typeof OpenStatusDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Saving: Story = {};

export const Saved: Story = {
  args: { title: "固定ページを更新しました。", status: "success" },
};
