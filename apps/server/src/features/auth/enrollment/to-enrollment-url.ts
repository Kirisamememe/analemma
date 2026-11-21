/** 管理画面の origin と token から、登録用 URL を作る。 */
export const toEnrollmentUrl = (origin: string, token: string): string => {
  const url = new URL("/enroll", origin);

  url.hash = token;

  return url.href;
};
