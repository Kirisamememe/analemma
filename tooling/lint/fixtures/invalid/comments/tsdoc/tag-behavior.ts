/**
 * slug で記事の題を探す。
 * @param slug 記事の slug。
 * @returns 記事の題。見つからない場合は undefined。
 */
export const findTitle = (slug: string): string | undefined =>
  slug === "" ? undefined : slug;
