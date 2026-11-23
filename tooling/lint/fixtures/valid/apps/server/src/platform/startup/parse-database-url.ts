/** 文字列を URL として読む。 */
export const parseUrl = (text: string): URL | undefined => {
  try {
    return new URL(text);
  } catch {
    return undefined;
  }
};
