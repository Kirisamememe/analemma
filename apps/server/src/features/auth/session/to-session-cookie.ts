/** セッションの token を入れる Cookie の名前と属性。 */
export type SessionCookie = {
  /** Cookie の名前。 */
  readonly name: string;
  /** `Secure` を付けるか。 */
  readonly secure: boolean;
};

/** 管理画面の origin から、セッションの Cookie の名前と属性を決める。 */
export const toSessionCookie = (origin: string): SessionCookie => {
  const secure = new URL(origin).protocol === "https:";

  return {
    name: secure ? "__Host-analemma_session" : "analemma_session",
    secure,
  };
};
