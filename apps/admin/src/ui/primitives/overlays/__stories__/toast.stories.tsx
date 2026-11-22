import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useCallback } from "react";

import { Button } from "@/ui/primitives/button";
import {
  type ToastMessage,
  useShowToast,
} from "@/ui/primitives/overlays/toast-context";

type ToastPreviewProps = {
  /** 見本の知らせ。 */
  messages: readonly ToastMessage[];
};

const ToastPreview = ({ messages }: ToastPreviewProps): ReactNode => {
  const showToast = useShowToast();
  const showMessages = useCallback(() => {
    for (const message of messages) {
      showToast(message);
    }
  }, [messages, showToast]);

  const showOnMount = useCallback(
    (button: HTMLButtonElement | null) => {
      if (button === null) {
        return;
      }

      const frame = requestAnimationFrame(showMessages);

      return () => {
        cancelAnimationFrame(frame);
      };
    },
    [showMessages],
  );

  return (
    <Button onPress={showMessages} ref={showOnMount}>
      Toast を出す
    </Button>
  );
};

const meta = {
  title: "primitives/Toast",
  component: ToastPreview,
  args: { messages: [{ tone: "success", message: "変更を保存しました。" }] },
} satisfies Meta<typeof ToastPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Danger: Story = {
  args: {
    messages: [{ tone: "danger", message: "変更を保存できませんでした。" }],
  },
};

export const LongMessage: Story = {
  args: {
    messages: [
      {
        tone: "danger",
        message:
          "この識別子の処理に失敗しました。長い識別子を確認してから、もう一度お試しください。 Toast0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789",
      },
    ],
  },
};

export const Stacked: Story = {
  args: {
    messages: [
      { tone: "danger", message: "見出しを保存できませんでした。" },
      { tone: "danger", message: "補足を保存できませんでした。" },
      { tone: "success", message: "本文を保存しました。" },
    ],
  },
};
