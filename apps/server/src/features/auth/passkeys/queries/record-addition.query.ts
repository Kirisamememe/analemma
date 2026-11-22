import {
  type Reauthentication,
  type ReauthenticationGone,
  recordReauthentication,
} from "@/features/auth/current-session/record-reauthentication.query";
import {
  type PasskeyInsert,
  type PasskeyRow,
  insertPasskey,
} from "@/features/auth/registration/insert-passkey.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 足す前の再認証と、足すパスキー。 */
export type PasskeyAddition = {
  /** 追加を求めたセッションと、再認証に使ったパスキー。 */
  readonly reauthentication: Reauthentication;
  /** 足すパスキー。 */
  readonly passkey: PasskeyInsert;
};

/** パスキーを足した結果。 */
export type PasskeyAdditionResult =
  | {
      /** 足した。 */
      readonly _tag: "Added";
      /** 足したパスキーの行。 */
      readonly row: PasskeyRow;
    }
  | ReauthenticationGone
  | {
      /** 同じ資格情報の ID のパスキーが、すでにあった。 */
      readonly _tag: "Duplicate";
    };

/** 再認証に使ったパスキーの使用を書き、新しいパスキーを足す。 */
export const recordAddition = async (
  db: DatabaseExecutor,
  { passkey, reauthentication }: PasskeyAddition,
): Promise<PasskeyAdditionResult> =>
  db.transaction(async (tx) => {
    const recorded = await recordReauthentication(tx, reauthentication);

    if (recorded._tag !== "Recorded") {
      return recorded;
    }

    const inserted = await insertPasskey(tx, passkey);

    return inserted._tag === "Duplicate"
      ? { _tag: "Duplicate" }
      : { _tag: "Added", row: inserted.row };
  });
