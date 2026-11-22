/** 登録用 URL の `#` の後ろから、token を読む。 */
export const readEnrollmentToken = (hash: string): string | undefined => {
  const token = hash.startsWith("#") ? hash.slice(1) : hash;

  return token === "" ? undefined : token;
};
