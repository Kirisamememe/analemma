/** 並べ直す ID と、今あるすべての固定ページの ID。 */
export type OrderCheck = {
  /** 管理画面が送った、並べたい順の ID。 */
  readonly requested: readonly string[];
  /** 今あるすべての固定ページの ID。 */
  readonly existing: readonly string[];
};

/** 送られた並びが、今あるすべての固定ページを1回ずつ含むかを決める。 */
export const coversAllPages = ({
  existing,
  requested,
}: OrderCheck): boolean => {
  const all = new Set(existing.map((id) => id.toLowerCase()));
  const ids = requested.map((id) => id.toLowerCase());

  return (
    ids.length === all.size &&
    new Set(ids).size === ids.length &&
    ids.every((id) => all.has(id))
  );
};
