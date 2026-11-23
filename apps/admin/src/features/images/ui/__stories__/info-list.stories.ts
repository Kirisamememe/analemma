import type { Meta, StoryObj } from "@storybook/react-vite";

import { InfoList } from "@/features/images/ui/info-list";

const meta = {
  title: "features/images/InfoList",
  component: InfoList,
  args: {
    layout: "columns",
    items: [
      { label: "撮影日時", value: "2025/05/01 18:42(UTC+09:00)" },
      { label: "レンズ", value: "XF16-55mmF2.8 R LM WR" },
      { label: "シャッター速度", value: "1/250秒" },
    ],
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof InfoList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Columns: Story = {};

export const Stacked: Story = {
  args: {
    layout: "stacked",
    items: [
      {
        label: "説明",
        value:
          "五月の連休、峠から西の稜線を見た。\n陽が落ちる直前の十分ほど、山の重なりが一枚ずつ色を変えていった。",
      },
      { label: "alt", value: "夕日の残る空の下に、山並みが二重に重なる" },
    ],
  },
};
