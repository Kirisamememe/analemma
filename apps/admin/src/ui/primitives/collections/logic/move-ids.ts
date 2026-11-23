/** 並べ直しで置く位置。 */
export type ReorderTarget = {
  /** 位置の基準にする行の ID。 */
  readonly key: string | number;
  /** 基準の行の前か後か(行の上に落とす `on` は並べ直しに使わない)。 */
  readonly dropPosition: "before" | "after" | "on";
};

/** 並べ直しで動かす行と、置く位置。 */
export type ReorderMove = {
  /** 動かす行の ID。 */
  readonly keys: ReadonlySet<string | number>;
  /** 置く位置。 */
  readonly target: ReorderTarget;
};

/** 動かす行を置く位置に移した ID の並びを返す(並びが変わらなければ `undefined`)。 */
export const moveIds = (
  ids: readonly string[],
  { keys, target }: ReorderMove,
): readonly string[] | undefined => {
  if (target.dropPosition === "on" || keys.has(target.key)) {
    return undefined;
  }

  const moved = ids.filter((id) => keys.has(id));
  const rest = ids.filter((id) => !keys.has(id));
  const index = typeof target.key === "string" ? rest.indexOf(target.key) : -1;

  if (moved.length === 0 || index === -1) {
    return undefined;
  }

  const at = target.dropPosition === "after" ? index + 1 : index;
  const next = [...rest.slice(0, at), ...moved, ...rest.slice(at)];

  return next.every((id, position) => id === ids[position]) ? undefined : next;
};
