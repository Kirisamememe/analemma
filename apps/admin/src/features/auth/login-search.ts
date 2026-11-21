/** ログインの画面の、検索の引数。 */
export type LoginSearch = {
  /** ログインした後に戻る、管理画面の中のパス。 */
  readonly redirect?: string;
};

const isInternalPath = (path: string): boolean =>
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !path.startsWith("/\\") &&
  !path.startsWith("/login");

/** URL の検索の引数を、ログインの画面の引数にする(外への行き先は捨てる)。 */
export const toLoginSearch = (
  search: Readonly<Record<string, unknown>>,
): LoginSearch => {
  const { redirect } = search;

  return typeof redirect === "string" && isInternalPath(redirect)
    ? { redirect }
    : {};
};
