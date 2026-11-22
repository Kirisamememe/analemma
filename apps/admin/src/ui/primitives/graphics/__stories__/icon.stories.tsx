import type { Meta, StoryObj } from "@storybook/react-vite";

import { Cluster } from "@/ui/layout/cluster";
import { Stack } from "@/ui/layout/stack";
import { Text } from "@/ui/layout/text";
import { Icon, type IconName } from "@/ui/primitives/graphics/icon";

const NAMES: readonly IconName[] = [
  "circle-alert",
  "circle-check",
  "house",
  "shield-check",
  "log-out",
  "menu",
  "x",
];

const meta = {
  title: "primitives/Icon",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const All: Story = {
  /** 管理画面で使うアイコンの見本。 */
  render: () => (
    <Stack gap={2}>
      {NAMES.map((name) => (
        <Cluster key={name}>
          <Icon name={name} />
          <Text>{name}</Text>
        </Cluster>
      ))}
    </Stack>
  ),
};
