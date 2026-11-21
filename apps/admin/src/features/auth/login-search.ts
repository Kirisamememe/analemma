/** ログインの画面の、検索の引数。 */
export type LoginSearch = {
  /** ログインした後に戻る、管理画面の中のパス。 */
  readonly redirect?: string;
};

const PUBLIC_PATHS = ["/login", "/enroll"];

/** ログインの前に開く画面(ログインと登録用 URL)のパスかを返す。 */
export const isPublicPath = (path: string): boolean => {
  const lower = path.toLowerCase();

  return PUBLIC_PATHS.some(
    (prefix) =>
      lower === prefix ||
      lower.startsWith(`${prefix}/`) ||
      lower.startsWith(`${prefix}?`) ||
      lower.startsWith(`${prefix}#`),
  );
};

const isInternalPath = (path: string): boolean =>
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !path.startsWith("/\\") &&
  !isPublicPath(path);

/** URL の検索の引数を、ログインの画面の引数にする(外への行き先は捨てる)。 */
export const toLoginSearch = (
  search: Readonly<Record<string, unknown>>,
): LoginSearch => {
  const { redirect } = search;

  return typeof redirect === "string" && isInternalPath(redirect)
    ? { redirect }
    : {};
};
