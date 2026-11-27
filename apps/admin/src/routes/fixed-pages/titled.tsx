import type { ReactNode } from "react";

import { Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";

/** 見出しと中身に渡す値。 */
type TitledProps = {
  /** 画面の名前。 */
  title: string;
  /** 画面の補足。 */
  description?: string | undefined;
  /** 見出しに置く操作。 */
  actions?: ReactNode;
  /** 見出しの下に置く中身。 */
  children: ReactNode;
};

/** 画面の見出しと、その下の中身。 */
export const Titled = ({
  title,
  description,
  actions,
  children,
}: TitledProps): ReactNode => (
  <Stack gap={8}>
    <PageHeader actions={actions} description={description} title={title} />
    {children}
  </Stack>
);
