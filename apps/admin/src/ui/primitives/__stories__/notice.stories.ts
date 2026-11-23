import type { Meta, StoryObj } from "@storybook/react-vite";

import { Notice } from "@/ui/primitives/notice";

const meta = {
  title: "primitives/Notice",
  component: Notice,
  args: { tone: "info", children: "パスキーの一覧を読み込みました。" },
  parameters: { stage: "fill" },
} satisfies Meta<typeof Notice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Success: Story = {
  args: { tone: "success", children: "パスキーを追加しました。" },
};

export const Warning: Story = {
  args: { tone: "warning", children: "登録用 URL の期限が近づいています。" },
};

export const Danger: Story = {
  args: { tone: "danger", children: "最後のパスキーは削除できません。" },
};

export const LongText: Story = {
  args: {
    tone: "danger",
    children:
      "この登録用 URL は、もう使えません。期限が切れたか、すでに使われた可能性があります。サーバーのコマンドで発行し直してください。",
  },
};
