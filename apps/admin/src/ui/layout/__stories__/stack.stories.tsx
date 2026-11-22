import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "../stack";
import { Text } from "../text";

const ITEMS = (
  <>
    <Text>MacBook Air</Text>
    <Text>iPhone</Text>
    <Text>YubiKey</Text>
  </>
);

const meta = {
  title: "layout/Stack",
  component: Stack,
  args: { gap: 2, children: ITEMS },
  parameters: { stage: "fill" },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WideGap: Story = { args: { gap: 8 } };

export const Centered: Story = { args: { align: "center" } };
