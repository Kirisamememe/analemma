import type { ReactNode } from "react";

import { Cluster } from "../layout/cluster";
import { Heading } from "../layout/heading";
import { Stack } from "../layout/stack";
import { Text } from "../layout/text";

/** 画面の見出しに渡す値。 */
type PageHeaderProps = {
  /** 画面の名前。 */
  readonly title: ReactNode;
  /** 画面の補足。 */
  readonly description?: ReactNode;
  /** 画面の全体に掛かる操作(ボタンなど)。 */
  readonly actions?: ReactNode;
};

/** 画面の名前と補足と操作を並べた、画面の見出し。 */
export const PageHeader = ({
  title,
  description,
  actions,
}: PageHeaderProps): ReactNode => (
  <Cluster align="start" gap={4} justify="between">
    <Stack gap={1}>
      <Heading level={1}>{title}</Heading>
      {description !== undefined && <Text tone="muted">{description}</Text>}
    </Stack>
    {actions !== undefined && <Cluster gap={2}>{actions}</Cluster>}
  </Cluster>
);
