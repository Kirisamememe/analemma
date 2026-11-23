import type { ReactNode } from "react";

import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { Icon, type IconName } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const emptyState = tv({
  base: [
    "flex flex-col items-center gap-4",
    "rounded-surface border border-dashed",
    "px-6 py-12 text-center",
  ],
});

const mark = tv({
  base: "flex size-control items-center justify-center rounded-full bg-surface-sunken text-fg-muted",
});

/** 中身の無い欄に渡す値。 */
type EmptyStateProps = {
  /** 欄の中身を表すアイコン。 */
  icon: IconName;
  /** 中身が無いことを伝える見出し。 */
  title: string;
  /** 次にできることの補足。 */
  description?: string | undefined;
  /** 中身を作る操作(ボタンなど)。 */
  actions?: ReactNode;
};

const isShown = (node: ReactNode): boolean =>
  node !== undefined && node !== null && typeof node !== "boolean";

/** 一覧などの中身がまだ無いことを伝える欄。 */
export const EmptyState = ({
  icon,
  title,
  description,
  actions,
}: EmptyStateProps): ReactNode => (
  <div className={emptyState()}>
    <span className={mark()}>
      <Icon name={icon} />
    </span>
    <Stack align="center" gap={1}>
      <Heading level={2}>{title}</Heading>
      {description !== undefined && description !== "" && (
        <Text tone="muted">{description}</Text>
      )}
    </Stack>
    {isShown(actions) && <Cluster gap={2}>{actions}</Cluster>}
  </div>
);
