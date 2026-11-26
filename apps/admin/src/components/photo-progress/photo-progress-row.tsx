import { memo, type ReactNode } from "react";

import { Cluster, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { ActionListRow } from "@/ui/primitives/collections";
import { Spinner } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";
import type { AppHref } from "@/ui/primitives/ui-provider";

/** 写真の状態の色。 */
export type PhotoProgressTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

/** 写真1枚の行に渡す値。 */
export type PhotoProgressRowProps = {
  /** 写真の名前(ファイルの名前かパス)。 */
  name: string;
  /** 写真から作った画像を見る画面。 */
  href?: AppHref | undefined;
  /** 大きさや日時などの補足。 */
  detail: string;
  /** 状態の文言。 */
  status: string;
  /** 状態の色。 */
  tone: PhotoProgressTone;
  /** 処理している途中か。 */
  busy: boolean;
};

const Row = ({
  name,
  href,
  detail,
  status,
  tone,
  busy,
}: PhotoProgressRowProps): ReactNode => (
  <li>
    <ActionListRow>
      <Stack gap={0.5}>
        <Text variant="label">
          {href === undefined ? name : <Link href={href}>{name}</Link>}
        </Text>
        <Text tone="muted" variant="caption">
          {detail}
        </Text>
      </Stack>
      <Cluster align="center" gap={2}>
        {busy && <Spinner />}
        <Badge tone={tone}>{status}</Badge>
      </Cluster>
    </ActionListRow>
  </li>
);

/** 送ったり取り込んだりする写真1枚の、名前・補足・状態の行。 */
export const PhotoProgressRow = memo(Row);
