import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { ErrorState } from "@/ui/patterns/states/error-state";

const RETRY_MILLISECONDS = 1500;

/** `FailingRetry` に渡す値。 */
type FailingRetryProps = {
  /** 何を読み込めなかったかを伝える見出し。 */
  title: string;
  /** 見出しのレベル。 */
  level: 1 | 2 | 3;
  /** 置く場所。 */
  layout: "inline" | "screen";
};

/** もう一度試すと、しばらく取り直してから、また失敗する欄。 */
const FailingRetry = ({
  title,
  level,
  layout,
}: FailingRetryProps): ReactNode => {
  const [isRetrying, setIsRetrying] = useState(false);

  return (
    <ErrorState
      isRetrying={isRetrying}
      layout={layout}
      level={level}
      onRetry={() => {
        setIsRetrying(true);
        setTimeout(() => {
          setIsRetrying(false);
        }, RETRY_MILLISECONDS);
      }}
      title={title}
    />
  );
};

const meta = {
  title: "patterns/ErrorState",
  component: ErrorState,
  args: {
    title: "トークンを読み込めませんでした",
    level: 3,
    layout: "inline",
    isRetrying: false,
    /** 押しても何もしない。 */
    onRetry: () => undefined,
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const Screen: Story = {
  args: {
    title: "固定ページを読み込めませんでした",
    level: 2,
    layout: "screen",
  },
};

export const Retrying: Story = { args: { isRetrying: true } };

export const FailedAgain: Story = {
  /** もう一度試すと、1.5秒取り直してから、まだ読み込めないことを伝える。 */
  render: ({ title, level, layout }) => (
    <FailingRetry layout={layout} level={level} title={title} />
  ),
};
