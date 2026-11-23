import type { Meta, StoryObj } from "@storybook/react-vite";

import { Center } from "@/ui/layout/center";
import { Text } from "@/ui/layout/text";

const meta = {
  title: "layout/Center",
  component: Center,
  args: {
    width: "sm",
    children: (
      <Text>
        中身の幅を絞り、左右の真ん中に寄せます。ログインの画面のような、狭い中身に使います。
      </Text>
    ),
  },
  parameters: { layout: "fullscreen", stage: null },
} satisfies Meta<typeof Center>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Small: Story = {};

export const Form: Story = { args: { width: "form" } };

export const NestedForm: Story = { args: { width: "nestedForm" } };

export const Page: Story = { args: { width: "page" } };
