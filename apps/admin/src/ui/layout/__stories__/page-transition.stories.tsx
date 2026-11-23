import type { Meta, StoryObj } from "@storybook/react-vite";

import { Center } from "@/ui/layout/center";
import { Heading } from "@/ui/layout/heading";
import { PageTransition } from "@/ui/layout/page-transition";
import { Stack } from "@/ui/layout/stack";
import { Text } from "@/ui/layout/text";

const meta = {
  title: "layout/PageTransition",
  component: PageTransition,
  args: {
    children: (
      <Center width="page">
        <Stack gap={2}>
          <Heading level={1}>Stilus</Heading>
          <Text>画面を開くと、中身が下から浮かび上がります。</Text>
        </Stack>
      </Center>
    ),
  },
  parameters: { layout: "fullscreen", stage: null },
} satisfies Meta<typeof PageTransition>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
