import type { Meta, StoryObj } from "@storybook/react-vite";

import { Center } from "../../layout/center";
import { TextField } from "../text-field";

const meta = {
  title: "primitives/TextField",
  component: TextField,
  /** ログインと登録の画面と同じ幅で見せる。 */
  decorators: [
    (Story) => (
      <Center width="sm">
        <Story />
      </Center>
    ),
  ],
  args: {
    name: "name",
    label: "パスキーの名前",
    description: "端末の名前など、パスキーを見分けられる名前。",
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = { args: { defaultValue: "MacBook Air" } };

export const Required: Story = { args: { isRequired: true } };
