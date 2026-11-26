import type { Meta, StoryObj } from "@storybook/react-vite";

import { Center, Text } from "@/ui/layout";
import { OverlayLayer } from "@/ui/primitives/overlays";

const meta = {
  title: "primitives/OverlayLayer",
  component: OverlayLayer,
  args: {
    children: (
      <Center width="sm">
        <Text>ここにドロップ</Text>
      </Center>
    ),
  },
} satisfies Meta<typeof OverlayLayer>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
