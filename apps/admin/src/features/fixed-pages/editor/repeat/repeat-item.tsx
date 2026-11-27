import { memo, type ReactNode } from "react";

import { Branch } from "../../ui/branch";
import { ContentGroup } from "../../ui/content-group";
import type { RepeatFocus } from "../logic/repeat-items";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";

/** repeat の1つの要素に渡す値。 */
type RepeatItemProps = {
  /** 要素の ID。 */
  id: string;
  /** repeat の場所。 */
  path: string;
  /** repeat の見出しの名前。 */
  label: string;
  /** 何番目の要素か(1から)。 */
  position: number;
  /** 最後の要素か。 */
  isLast: boolean;
  /** 要素に結び付いた誤り。 */
  error: string | undefined;
  /** 要素を上か下へ動かす関数。 */
  onMove: (id: string, direction: -1 | 1) => void;
  /** 要素を外す関数。 */
  onRemove: (id: string) => void;
  /** focus を移すボタンを覚える関数。 */
  remember: (focus: RepeatFocus) => (button: HTMLButtonElement | null) => void;
  /** 要素の項目を描く関数。 */
  children: (path: string, label: string) => ReactNode;
};

const RepeatItemContent = ({
  id,
  path,
  label,
  position,
  isLast,
  error,
  onMove,
  onRemove,
  remember,
  children,
}: RepeatItemProps): ReactNode => {
  const t = useTranslate();
  const item = path + "/" + id;
  const name = { label, position };
  const itemLabel = t("fixedPageEditor.item", name);

  return (
    <Branch parent="repeat" target="item">
      <ContentGroup
        actions={
          <>
            <Button
              aria-label={t("fixedPageEditor.up", name)}
              icon="arrow-up"
              iconWeight="bold"
              rounded="xs"
              ref={remember({ id, button: "up" })}
              size="sm"
              tone="quiet"
              isDisabled={position === 1}
              onPress={() => {
                onMove(id, -1);
              }}
            />
            <Button
              aria-label={t("fixedPageEditor.down", name)}
              icon="arrow-down"
              iconWeight="bold"
              rounded="xs"
              ref={remember({ id, button: "down" })}
              size="sm"
              tone="quiet"
              isDisabled={isLast}
              onPress={() => {
                onMove(id, 1);
              }}
            />
            <Button
              aria-label={t("fixedPageEditor.remove", name)}
              icon="trash-2"
              iconWeight="bold"
              rounded="xs"
              ref={remember({ id, button: "remove" })}
              size="sm"
              tone="quiet"
              onPress={() => {
                onRemove(id);
              }}
            />
          </>
        }
        error={error}
        kind="item"
        label={itemLabel}
      >
        {children(item, itemLabel)}
      </ContentGroup>
    </Branch>
  );
};

/** repeat の1つの要素の帯と、その中の項目。 */
export const RepeatItem = memo(RepeatItemContent);
