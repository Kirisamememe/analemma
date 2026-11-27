import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/ui/primitives/button";
import { Tooltip } from "@/ui/primitives/overlays";

const meta = {
  title: "primitives/Tooltip",
  component: Tooltip,
  args: {
    label: "送り直す",
    children: (
      <Button aria-label="morning-lake.jpg を送り直す" icon="rotate-cw" />
    ),
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
