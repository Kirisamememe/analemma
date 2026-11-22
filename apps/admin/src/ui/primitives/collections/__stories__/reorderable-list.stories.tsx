import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Cluster, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { ReorderableList } from "@/ui/primitives/collections/reorderable-list";

/** 見本の1行。 */
type SampleRow = {
  /** 行の ID。 */
  readonly id: string;
  /** 行の名前。 */
  readonly title: string;
  /** 行の補足。 */
  readonly note: string;
};

const ROWS: readonly SampleRow[] = [
  { id: "about", title: "About", note: "about · 基本のページ" },
  { id: "colophon", title: "Colophon", note: "colophon · 基本のページ" },
  { id: "contact", title: "連絡先", note: "contact · 連絡先のページ" },
  { id: "privacy", title: "プライバシー", note: "privacy · 基本のページ" },
];

/** `SampleList` に渡す値。 */
type SampleListProps = {
  /** 最初の行。 */
  readonly rows: readonly SampleRow[];
  /** 並べ直しを止めるか。 */
  readonly isDisabled: boolean;
};

const SampleList = ({ rows, isDisabled }: SampleListProps): ReactNode => {
  const [order, setOrder] = useState(rows);

  return (
    <ReorderableList
      isDisabled={isDisabled}
      items={order.map(({ id, title, note }) => ({
        id,
        textValue: title,
        children: (
          <Cluster align="center" gap={3} justify="between">
            <Stack gap={0.5}>
              <Cluster gap={2}>
                <Text as="span" variant="label">
                  {title}
                </Text>
                <Badge tone="neutral">非公開</Badge>
              </Cluster>
              <Text tone="muted" variant="caption">
                {note}
              </Text>
            </Stack>
            <Button size="sm">公開する</Button>
          </Cluster>
        ),
      }))}
      label="固定ページ"
      onReorder={(ids) => {
        setOrder(
          ids.flatMap((id) => order.filter((sample) => sample.id === id)),
        );
      }}
    />
  );
};

const meta = {
  title: "primitives/ReorderableList",
  component: SampleList,
  args: { rows: ROWS, isDisabled: false },
  argTypes: { rows: { control: false } },
  parameters: { stage: "fill" },
} satisfies Meta<typeof SampleList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { isDisabled: true } };

export const LongText: Story = {
  args: {
    rows: [
      {
        id: "long",
        title:
          "page-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop",
        note: "page-0123456789abcdefghijklmnopqrstuvwxyz0123456789 · 基本のページ",
      },
      ...ROWS.slice(0, 2),
    ],
  },
};
