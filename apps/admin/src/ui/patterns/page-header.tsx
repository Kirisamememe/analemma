import type { ReactNode } from "react";

import { Cluster, Heading, Stack, Text } from "@/ui/layout";

/** 画面の見出しに渡す値。 */
type PageHeaderProps = {
  /** 画面の名前。 */
  title: ReactNode;
  /** 画面の補足。 */
  description?: string | undefined;
  /** 画面の全体に掛かる操作(ボタンなど)。 */
  actions?: ReactNode;
};

const isShown = (node: ReactNode): boolean =>
  node !== undefined && node !== null && typeof node !== "boolean";

/** 画面の名前と補足と操作を並べた、画面の見出し。 */
export const PageHeader = ({
  title,
  description,
  actions,
}: PageHeaderProps): ReactNode => (
  <Cluster align="start" gap={4} justify="between">
    <Stack gap={1}>
      <Heading level={1} variant="page-header">
        {title}
      </Heading>
      {description && <Text tone="muted">{description}</Text>}
    </Stack>
    {isShown(actions) && <Cluster gap={2}>{actions}</Cluster>}
  </Cluster>
);
