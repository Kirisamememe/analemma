import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { CopyButton } from "@/features/deploy-tokens/ui/copy-button";

const meta = {
  title: "features/deploy-tokens/CopyButton",
  component: CopyButton,
  args: { onPress: fn<() => void>(), result: undefined },
} satisfies Meta<typeof CopyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Copied: Story = { args: { result: "Copied" } };

export const Failed: Story = { args: { result: "Failed" } };
