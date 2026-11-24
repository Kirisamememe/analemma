/** Dropbox の認可の画面から戻ったときの、URL の search。 */
export type CallbackSearch =
  | {
      /** どの結果か。 */
      readonly _tag: "Approved";
      /** Dropbox が付けた code。 */
      readonly code: string;
      /** 認可を始めたときの state。 */
      readonly state: string;
    }
  | {
      /** 利用者が Dropbox で許可しなかった。 */
      readonly _tag: "Denied";
    }
  | {
      /** code も error も無いか、形が違う。 */
      readonly _tag: "Invalid";
    };

const MAX_LENGTH = 1000;

const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_LENGTH
    ? value
    : undefined;

/** Dropbox の認可の画面から戻った URL の search を読む。 */
export const readCallbackSearch = (
  search: Readonly<Record<string, unknown>>,
): CallbackSearch => {
  const code = readText(search["code"]);
  const state = readText(search["state"]);

  if (code !== undefined && state !== undefined) {
    return { _tag: "Approved", code, state };
  }

  return search["error"] === "access_denied"
    ? { _tag: "Denied" }
    : { _tag: "Invalid" };
};
