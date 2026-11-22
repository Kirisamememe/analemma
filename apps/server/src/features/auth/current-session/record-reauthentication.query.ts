import { lockAdminUser } from "@/features/auth/admin-user/admin-user.query";
import {
  type PasskeyUse,
  recordPasskeyUse,
} from "@/features/auth/login/record-passkey-use.query";
import { lockSession } from "@/features/auth/session/session.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 再認証を求めたセッションと、再認証に使ったパスキー。 */
export type Reauthentication = {
  /** 再認証を求めたセッションの ID。 */
  readonly sessionId: string;
  /** 再認証に使ったパスキーと、届いた値。 */
  readonly use: PasskeyUse;
};

/** 確かめている間に、再認証を求めたセッションか、使ったパスキーが消されたこと。 */
export type ReauthenticationGone =
  | {
      /** 再認証を求めたセッションが消された。 */
      readonly _tag: "SessionGone";
    }
  | {
      /** 再認証に使ったパスキーが消された。 */
      readonly _tag: "PasskeyGone";
    };

/** 再認証を書いた結果。 */
export type ReauthenticationRecord =
  | {
      /** 再認証を書き、セッションとパスキーの行をロックした。 */
      readonly _tag: "Recorded";
    }
  | ReauthenticationGone;

/** 管理者とセッションの行のロックを取り、再認証に使ったパスキーの使用を書く。 */
export const recordReauthentication = async (
  tx: DatabaseExecutor,
  { sessionId, use }: Reauthentication,
): Promise<ReauthenticationRecord> => {
  await lockAdminUser(tx, use.adminUserId);

  if (
    !(await lockSession(tx, { id: sessionId, adminUserId: use.adminUserId }))
  ) {
    return { _tag: "SessionGone" };
  }

  return (await recordPasskeyUse(tx, use))
    ? { _tag: "Recorded" }
    : { _tag: "PasskeyGone" };
};
