import type { Meta, StoryObj } from "@storybook/react-vite";

import { TypeSpecimen } from "../type-specimen";

const meta = {
  title: "theme/Typography",
  component: TypeSpecimen,
  args: {
    sample:
      "パスキーで Stilus にログインする。登録した端末の名前は、あとから変えられる。2026年11月22日 10:00",
  },
} satisfies Meta<typeof TypeSpecimen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Japanese: Story = {};

export const English: Story = {
  args: {
    sample:
      "Sign in to Stilus with a passkey. You can rename a registered device later. Nov 22, 2026, 10:00",
  },
};

export const SimplifiedChinese: Story = {
  args: {
    sample:
      "使用通行密钥登录 Stilus。已注册设备的名称可以稍后更改。2026年11月22日 10:00",
  },
};
