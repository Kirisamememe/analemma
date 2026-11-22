import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageHeader } from "@/ui/patterns/page-header";
import { Button } from "@/ui/primitives/button";

const meta = {
  title: "patterns/PageHeader",
  component: PageHeader,
  args: {
    title: "パスキーとセッション",
    description:
      "ログインに使うパスキーと、ログインしているブラウザを管理します。",
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: { actions: <Button tone="primary">パスキーを追加</Button> },
};

export const TitleOnly: Story = { args: { description: undefined } };

export const LongTitle: Story = {
  args: {
    title: "passkey-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijkl",
    actions: <Button tone="danger">削除</Button>,
  },
};
