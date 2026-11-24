import { and, eq, ne } from "drizzle-orm";

import { passkey } from "@/db/schema/auth/passkey";
import { session } from "@/db/schema/auth/session";
import {
  type Reauthentication,
  type ReauthenticationGone,
  recordReauthentication,
} from "@/features/auth/current-session/queries/record-reauthentication.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 消すパスキーと、消す前の再認証。 */
export type PasskeyDeletion = {
  /** 消す資格情報の ID。 */
  readonly id: string;
  /** 削除を求めたセッションと、再認証に使ったパスキー。 */
  readonly reauthentication: Reauthentication;
};

/** パスキーを消した結果。 */
export type PasskeyDeletionResult =
  | ReauthenticationGone
  | {
      /** 消した。 */
      readonly _tag: "Deleted";
      /** ログアウトさせた、ほかのセッションの数。 */
      readonly loggedOut: number;
    }
  | {
      /** 無かった。 */
      readonly _tag: "NotFound";
    }
  | {
      /** 最後の1つなので、消さなかった。 */
      readonly _tag: "LastPasskey";
    };

/** 再認証を書き、最後の1つでないパスキーを消して、ほかのセッションからログアウトさせる。 */
export const deletePasskey = async (
  db: DatabaseExecutor,
  { id, reauthentication }: PasskeyDeletion,
): Promise<PasskeyDeletionResult> =>
  db.transaction(async (tx) => {
    const recorded = await recordReauthentication(tx, reauthentication);

    if (recorded._tag !== "Recorded") {
      return recorded;
    }

    const { adminUserId } = reauthentication.use;

    const owned = await tx
      .select({ id: passkey.id })
      .from(passkey)
      .where(eq(passkey.adminUserId, adminUserId));

    if (!owned.some((row) => row.id === id)) {
      return { _tag: "NotFound" };
    }

    if (owned.length <= 1) {
      return { _tag: "LastPasskey" };
    }

    await tx
      .delete(passkey)
      .where(and(eq(passkey.id, id), eq(passkey.adminUserId, adminUserId)));

    const loggedOut = await tx
      .delete(session)
      .where(
        and(
          eq(session.adminUserId, adminUserId),
          ne(session.id, reauthentication.sessionId),
        ),
      )
      .returning({ id: session.id });

    return { _tag: "Deleted", loggedOut: loggedOut.length };
  });
