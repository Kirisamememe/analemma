/** 画像一覧に戻ったときに focus を移すリンクを選ぶ。 */
export const findImageReturnLink = <Link extends Record<"pathname", string>>(
  links: readonly Link[],
  href: string,
): Link | undefined =>
  links.find((link) => link.pathname === href) ??
  links.find((link) => link.pathname < href) ??
  links.at(-1);
