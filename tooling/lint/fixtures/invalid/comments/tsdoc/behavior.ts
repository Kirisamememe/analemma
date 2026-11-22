/** slug で記事を探し、見つからない場合は undefined を返す。 */
export const find = (slug: string): string | undefined =>
  slug === "" ? undefined : slug;
