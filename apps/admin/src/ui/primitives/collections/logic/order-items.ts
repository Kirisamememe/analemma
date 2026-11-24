/** ID を持つ行。 */
export type Identified = {
  /** 行の ID。 */
  readonly id: string;
};

/** 並べ直しを送っている間、送った ID の順に行を並べる(送った後に増えた行は後ろに付ける)。 */
export const orderItems = <Page extends Identified>(
  pages: readonly Page[],
  order: readonly string[] | undefined,
): readonly Page[] => {
  if (order === undefined) {
    return pages;
  }

  const positions = new Map(order.map((id, position) => [id, position]));
  const rank = ({ id }: Page): number => positions.get(id) ?? order.length;

  return pages.toSorted((a, b) => rank(a) - rank(b));
};
