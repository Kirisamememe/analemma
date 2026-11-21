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
  const all = new Set(existing);

  return (
    requested.length === all.size &&
    new Set(requested).size === requested.length &&
    requested.every((id) => all.has(id))
  );
};
