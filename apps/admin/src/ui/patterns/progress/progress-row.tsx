import type { ReactNode, Ref } from "react";

import { Cluster, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { ActionListRow } from "@/ui/primitives/collections";
import { Spinner } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";

/** 作業の1件の、状態の見せ方。 */
export type ProgressTone = "neutral" | "info" | "success" | "danger";

/** 作業の1件に渡す値。 */
type ProgressRowProps = {
  /** 1件を見分ける ID(操作の関数に渡す)。 */
  id: number;
  /** 名前(ファイルの名前など)。 */
  name: string;
  /** 終わった後に開ける行き先。 */
  href?: string | undefined;
  /** 名前の下に出す補足(大きさなど)。 */
  detail: string;
  /** 状態の文言。 */
  status: string;
  /** 状態の見せ方。 */
  tone: ProgressTone;
  /** 進めている最中か。 */
  isBusy: boolean;
  /** 操作の文言(送り直すなど)。 */
  actionLabel?: string | undefined;
  /** 操作の、対象を含むアクセシブルな名前。 */
  actionName?: string | undefined;
  /** 操作を送っている最中か。 */
  isActionPending?: boolean | undefined;
  /** 操作を送っている最中であることを伝える名前。 */
  actionPendingLabel?: string | undefined;
  /** 操作を押したときに、ID を渡して呼ぶ関数。 */
  onAction?: ((id: number) => void) | undefined;
  /** 行の要素(終わったときに focus を引き継ぐ)。 */
  ref?: Ref<HTMLLIElement> | undefined;
};

/** 作業の1件の、名前・補足・状態と操作。 */
export const ProgressRow = ({
  id,
  name,
  href,
  detail,
  status,
  tone,
  isBusy,
  actionLabel,
  actionName,
  isActionPending = false,
  actionPendingLabel,
  onAction,
  ref,
}: ProgressRowProps): ReactNode => {
  const actionPending =
    actionPendingLabel === undefined
      ? {}
      : { isPending: isActionPending, pendingLabel: actionPendingLabel };

  return (
    <li ref={ref}>
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
          {isBusy && <Spinner />}
          <Badge tone={tone}>{status}</Badge>
          {actionLabel !== undefined && (
            <Button
              aria-label={actionName}
              {...actionPending}
              onPress={() => {
                onAction?.(id);
              }}
              size="sm"
            >
              {actionLabel}
            </Button>
          )}
        </Cluster>
      </ActionListRow>
    </li>
  );
};
