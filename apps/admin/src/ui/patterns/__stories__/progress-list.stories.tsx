import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ProgressList, ProgressRow } from "@/ui/patterns/progress-list";

const meta = {
  title: "patterns/ProgressList",
  component: ProgressList,
  args: { children: null },
  parameters: { stage: "fill" },
} satisfies Meta<typeof ProgressList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const States: Story = {
  /** 待つ・進める・終わる・失敗する・送り直すの各行。 */
  render: () => (
    <ProgressList>
      <ProgressRow
        detail="4.2 MB"
        id={1}
        isBusy={false}
        name="IMG_0123.HEIC"
        status="待っています"
        tone="neutral"
      />
      <ProgressRow
        detail="6.8 MB"
        id={2}
        isBusy
        name="DSC01234.JPG"
        status="送っています"
        tone="info"
      />
      <ProgressRow
        detail="3.1 MB"
        href="/images"
        id={3}
        isBusy={false}
        name="IMG_0456.JPG"
        status="追加しました"
        tone="success"
      />
      <ProgressRow
        actionLabel="送り直す"
        actionName="IMG_0789.JPG を送り直す"
        detail="5.0 MB"
        id={4}
        isBusy={false}
        name="IMG_0789.JPG"
        onAction={fn<(id: number) => void>()}
        status="送れませんでした"
        tone="danger"
      />
      <ProgressRow
        actionLabel="送り直す"
        actionName="IMG_0790.JPG を送り直す"
        detail="5.1 MB"
        id={5}
        isActionPending
        isBusy
        name="IMG_0790.JPG"
        status="送っています"
        tone="info"
      />
      <ProgressRow
        detail="12 kB"
        id={6}
        isBusy={false}
        name="scan.bmp"
        status="対応していない形式です"
        tone="danger"
      />
    </ProgressList>
  ),
};
