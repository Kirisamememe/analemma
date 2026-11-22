import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppShell } from "../app-shell";
import { Center } from "../center";
import { Heading } from "../heading";
import { Stack } from "../stack";
import { Text } from "../text";

const meta = {
  title: "layout/AppShell",
  component: AppShell,
  args: {
    children: (
      <Center width="page">
        <Stack gap={2}>
          <Heading level={1}>Stilus</Heading>
          <Text>画面の地と、中身の上下の余白を持つ骨組みです。</Text>
        </Stack>
      </Center>
    ),
  },
  parameters: { layout: "fullscreen", stage: null },
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNav: Story = {
  args: {
    nav: (
      <aside>
        <Center width="sm">
          <Text variant="label">ナビの見本</Text>
        </Center>
      </aside>
    ),
  },
};
