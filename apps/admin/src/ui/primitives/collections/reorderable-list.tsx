import type { ReactNode } from "react";
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
} from "react-aria-components";

import { moveIds } from "@/ui/primitives/collections/move-ids";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const list = tv({ base: "flex flex-col gap-2 outline-hidden" });

const row = tv({
  base: "relative flex items-center gap-1 rounded-control bg-surface py-2 pr-3 pl-1 shadow-control outline-hidden transition after:pointer-events-none after:absolute after:inset-0 after:rounded-control after:outline after:outline-fg/10 forced-colors:after:outline-line is-focus-shown:focus-ring is-dragging:bg-surface-sunken is-dragging:shadow-none is-dragging:after:outline-fg/40 is-dragging:after:outline-dashed",
});

const handle = tv({
  base: "inline-flex h-control-sm shrink-0 cursor-grab items-center justify-center rounded-control px-1.5 text-fg-muted outline-hidden transition is-hovered:state-hover is-hovered:text-fg is-focus-shown:focus-ring is-disabled:state-disabled is-disabled:cursor-default",
});

const dropIndicator = tv({
  base: "relative -my-1 h-0 outline-hidden before:absolute before:inset-x-0 before:h-0.5 before:-translate-y-1/2 before:rounded-full",
  variants: {
    isDropTarget: {
      true: "before:bg-primary",
    },
  },
});

/** 並べ直せる一覧の1行。 */
export type ReorderableItem = {
  /** 行の ID。 */
  readonly id: string;
  /** 行を読み上げるときの名前(取っ手の名前にも使う)。 */
  readonly textValue: string;
  /** 行の中身。 */
  readonly children: ReactNode;
};

/** 並べ直せる一覧に渡す値。 */
type ReorderableListProps = {
  /** 一覧の名前。 */
  readonly label: string;
  /** 並び順に並べた行。 */
  readonly items: readonly ReorderableItem[];
  /** 並べ直した後のすべての ID を受け取る関数(並びが変わったときだけ呼ぶ)。 */
  readonly onReorder: (ids: readonly string[]) => void;
  /** 並べ直しを止めるか(行の中の操作は使える)。 */
  readonly isDisabled?: boolean;
};

/** 取っ手のドラッグかキーボードで、行を並べ直せる一覧。 */
export const ReorderableList = ({
  label,
  items,
  onReorder,
  isDisabled = false,
}: ReorderableListProps): ReactNode => {
  const { dragAndDropHooks } = useDragAndDrop({
    isDisabled,
    getItems: (keys) =>
      items
        .filter(({ id }) => keys.has(id))
        .map(({ textValue }) => ({ "text/plain": textValue })),
    onReorder: ({ keys, target }) => {
      const ids = moveIds(
        items.map(({ id }) => id),
        { keys, target },
      );

      if (ids !== undefined) {
        onReorder(ids);
      }
    },
    renderDropIndicator: (target) => (
      <DropIndicator
        className={({ isDropTarget }) => dropIndicator({ isDropTarget })}
        target={target}
      />
    ),
  });

  return (
    <GridList
      aria-label={label}
      className={list()}
      dragAndDropHooks={dragAndDropHooks}
      keyboardNavigationBehavior="tab"
    >
      {items.map(({ id, textValue, children }) => (
        <GridListItem className={row()} id={id} key={id} textValue={textValue}>
          <AriaButton className={handle()} slot="drag">
            <Icon name="grip-vertical" />
          </AriaButton>
          <div className="min-w-0 grow">{children}</div>
        </GridListItem>
      ))}
    </GridList>
  );
};
