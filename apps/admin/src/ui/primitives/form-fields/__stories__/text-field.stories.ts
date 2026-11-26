import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextField } from "@/ui/primitives/form-fields/text-field";

const meta = {
  title: "primitives/TextField",
  component: TextField,
  parameters: { stage: "fill" },
  args: {
    name: "name",
    label: "パスキーの名前",
    placeholder: "例：仕事用のノートPC",
    description: "端末の名前など、パスキーを見分けられる名前",
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = { args: { defaultValue: "MacBook Air" } };

export const Required: Story = { args: { isRequired: true } };

export const RequiredInvalid: Story = {
  args: { isRequired: true, errorMessage: "名前を入力してください" },
};

export const RequiredLongLabel: Story = {
  args: {
    isRequired: true,
    label: "公開サイトのフッターに表示する、問い合わせ先のメールアドレス",
  },
};

export const ReadOnly: Story = {
  args: { defaultValue: "MacBook Air", isReadOnly: true },
};

export const Invalid: Story = {
  args: { errorMessage: "この名前は使えません" },
};
