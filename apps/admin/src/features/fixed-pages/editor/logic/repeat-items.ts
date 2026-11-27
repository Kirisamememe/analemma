import { REPEAT_MAX_ITEMS } from "@analemma/contract";

/** repeat の要素の帯に置くボタン。 */
type ItemButton = "up" | "down" | "remove";

/** 動かした後に focus を移すボタン(要素のボタンか、追加のボタン)。 */
export type RepeatFocus =
  | {
      /** 要素の ID。 */
      readonly id: string;
      /** 要素の帯のボタン。 */
      readonly button: ItemButton;
    }
  | "add";

/** repeat の要素を動かした後の ID の並びと、focus を移すボタン。 */
export type RepeatChange = {
  /** 動かした後の ID の並び。 */
  readonly ids: string[];
  /** focus を移すボタン。 */
  readonly focus: RepeatFocus;
};

/** 要素を末尾に足した後の ID の並びと、focus を移すボタンを返す。 */
export const addRepeatItem = (
  ids: readonly string[],
  id: string,
): RepeatChange | undefined => {
  if (ids.length >= REPEAT_MAX_ITEMS) return undefined;

  const next = [...ids, id];

  return {
    ids: next,
    focus: next.length < REPEAT_MAX_ITEMS ? "add" : { id, button: "up" },
  };
};

/** 要素を1つ上か下へ動かした後の ID の並びと、focus を移すボタンを返す。 */
export const moveRepeatItem = (
  ids: readonly string[],
  { id, direction }: Record<"id", string> & Record<"direction", -1 | 1>,
): RepeatChange | undefined => {
  const index = ids.indexOf(id);
  const to = index + direction;

  if (index < 0 || to < 0 || to >= ids.length) return undefined;

  const next = ids.toSpliced(index, 1).toSpliced(to, 0, id);
  const atEdge = to === 0 || to === ids.length - 1;
  const forward = direction === 1;

  return {
    ids: next,
    focus: { id, button: forward === atEdge ? "up" : "down" },
  };
};

/** 要素を外した後の ID の並びと、focus を移すボタンを返す。 */
export const removeRepeatItem = (
  ids: readonly string[],
  id: string,
): RepeatChange | undefined => {
  const index = ids.indexOf(id);

  if (index < 0) return undefined;

  const following = ids[index + 1];

  return {
    ids: ids.toSpliced(index, 1),
    focus:
      following === undefined ? "add" : { id: following, button: "remove" },
  };
};

/** focus を移すボタンを見分けるキー。 */
export const repeatFocusKey = (focus: RepeatFocus): string =>
  focus === "add" ? "add" : `${focus.id}/${focus.button}`;
