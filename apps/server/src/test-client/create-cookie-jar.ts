/** テストのブラウザが持つ Cookie。 */
export type CookieJar = {
  /** 持っている Cookie を、Cookie ヘッダーの形で返す。 */
  readonly header: () => string;
  /** 応答の Set-Cookie を読んで、持っている Cookie を書き直す。 */
  readonly store: (setCookies: readonly string[]) => void;
};

const EXPIRED = /^\s*max-age\s*=\s*0\s*$/iv;

const splitPair = (pair: string): readonly [string, string] => {
  const index = pair.indexOf("=");

  return [pair.slice(0, index).trim(), pair.slice(index + 1).trim()];
};

/** テストのために、Set-Cookie を覚えて送り返す cookie jar を作る。 */
export const createCookieJar = (seed = ""): CookieJar => {
  const cookies = new Map(
    seed
      .split(";")
      .filter((pair) => pair.includes("="))
      .map((pair) => splitPair(pair)),
  );

  return {
    header: () =>
      [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
    store: (setCookies) => {
      for (const line of setCookies) {
        const [pair = "", ...attributes] = line.split(";");
        const [name, value] = splitPair(pair);

        if (attributes.some((attribute) => EXPIRED.test(attribute))) {
          cookies.delete(name);
        } else {
          cookies.set(name, value);
        }
      }
    },
  };
};
