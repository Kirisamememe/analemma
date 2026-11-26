import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Cluster, Stack, Text } from "@/ui/layout";
import { Icon, type IconName } from "@/ui/primitives/graphics/icon";

const NAMES: readonly IconName[] = [
  "arrow-down",
  "arrow-left-right",
  "arrow-up",
  "check",
  "chevron-down",
  "chevron-left",
  "chevrons-up-down",
  "chevron-right",
  "circle-alert",
  "circle-check",
  "cloud-alert",
  "file-text",
  "grip-vertical",
  "house",
  "image",
  "image-off",
  "key-round",
  "languages",
  "layers",
  "list",
  "shield-check",
  "log-out",
  "menu",
  "monitor",
  "moon",
  "plus",
  "sun",
  "pencil",
  "trash-2",
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

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

export const Sizes: Story = {
  /** 大きさごとに、線の太さと文字との釣り合いを見比べる。 */
  render: () => (
    <Stack gap={3}>
      {SIZES.map((size) => (
        <Cluster align="center" gap={2} key={size}>
          <Icon name="cloud-alert" size={size} />
          <Icon name="file-text" size={size} />
          <Icon name="key-round" size={size} />
          <Icon name="check" size={size} />
          <Text>{size}</Text>
        </Cluster>
      ))}
    </Stack>
  ),
};

const pixels = (length: string): number => Number(length.replace(/px$/v, ""));

export const Bold: Story = {
  name: "Bold (1.5px)",
  /** CSS を適用したときの各サイズの線幅を確かめる。 */
  play: async ({ canvasElement }) => {
    const icons = canvasElement.querySelectorAll("svg");
    const rem = pixels(getComputedStyle(document.documentElement).fontSize);

    await expect(icons).toHaveLength(SIZES.length * 2);
    await Promise.all(
      Array.from(icons, (svg) => {
        const width = svg.getBoundingClientRect().width;
        const stroke = pixels(getComputedStyle(svg).strokeWidth);
        const drawn = (stroke * width) / svg.viewBox.baseVal.width;

        return expect(drawn).toBeCloseTo((1.5 * rem) / 16);
      }),
    );
  },
  /** 線幅が 1.5px の見本。 */
  render: () => (
    <Stack gap={3}>
      {SIZES.map((size) => (
        <Cluster align="center" gap={2} key={size}>
          <Icon name="layers" size={size} weight="bold" />
          <Icon name="list" size={size} weight="bold" />
          <Text>{size}</Text>
        </Cluster>
      ))}
    </Stack>
  ),
};
