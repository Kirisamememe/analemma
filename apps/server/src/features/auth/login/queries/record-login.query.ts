import { and, eq } from "drizzle-orm";

import { session } from "@/db/schema/auth/session";
import { lockAdminUser } from "@/features/auth/admin-user/queries/admin-user.query";
import {
  type PasskeyUse,
  recordPasskeyUse,
} from "@/features/auth/login/queries/record-passkey-use.query";
import type { SecretTokenParts } from "@/features/auth/secret-token/secret-token";
import { insertSession } from "@/features/auth/session/queries/session.query";
import type { DatabaseExecutor } from "@/platform/database";

/** ログインに使ったパスキーと、始めるセッション。 */
export type LoginRecord = {
  /** ログインに使ったパスキーと、届いた値。 */
  readonly use: PasskeyUse;
  /** 始めるセッションの token の ID と secret のハッシュ。 */
  readonly session: Omit<SecretTokenParts, "_tag">;
  /** 同じブラウザの Cookie にあった、前のセッションの token。 */
  readonly previous: SecretTokenParts | undefined;
};

/** ログインを記録してセッションを始めた結果。 */
export type RecordedLogin = {
  /** 始めたか、確かめている間にパスキーが消されたか。 */
  readonly _tag: "Recorded" | "PasskeyGone";
};

/** パスキーの使用を書き、前のセッションを消して新しく始める。 */
export const recordLogin = async (
  db: DatabaseExecutor,
  { previous, session: next, use }: LoginRecord,
): Promise<RecordedLogin> =>
  db.transaction(async (tx) => {
    await lockAdminUser(tx, use.adminUserId);

    if (!(await recordPasskeyUse(tx, use))) {
      return { _tag: "PasskeyGone" };
    }

    if (previous !== undefined) {
      await tx
        .delete(session)
        .where(
          and(
            eq(session.id, previous.id),
            eq(session.secretHash, previous.secretHash),
          ),
        );
    }

    await insertSession(tx, {
      id: next.id,
      secretHash: next.secretHash,
      adminUserId: use.adminUserId,
      now: use.now,
    });

    return { _tag: "Recorded" };
  });
