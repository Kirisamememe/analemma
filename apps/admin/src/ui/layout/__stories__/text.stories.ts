import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "@/ui/layout/text";

const meta = {
  title: "layout/Text",
  component: Text,
  args: { children: "この管理画面に登録したパスキーを使います。" },
  parameters: { stage: "fill" },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const BodyLong: Story = {
  args: {
    variant: "body-long",
    children:
      "長い文は行間を広く取ります。和文と欧文(Stilus など)の間の空きと、文節での改行は CSS に任せます。段落が何行に渡っても、読む位置を見失わないようにします。",
  },
};

export const Caption: Story = {
  args: { variant: "caption", children: "登録 2026年11月22日 10:00" },
};

export const Label: Story = {
  args: { variant: "label", children: "パスキー" },
};

export const Muted: Story = { args: { tone: "muted" } };

export const Danger: Story = {
  args: { tone: "danger", children: "名前を入力してください。" },
};

export const LongWord: Story = {
  args: {
    children:
      "passkey-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijkl",
  },
};
