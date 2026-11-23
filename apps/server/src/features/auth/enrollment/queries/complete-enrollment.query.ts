import { and, eq, gt } from "drizzle-orm";

import { passkeyEnrollment } from "@/db/schema/passkey-enrollment";
import { lockAdminUser } from "@/features/auth/admin-user/queries/admin-user.query";
import { deleteAllSessions } from "@/features/auth/current-session/queries/delete-all-sessions.query";
import {
  type PasskeyInsert,
  type PasskeyRow,
  insertPasskey,
} from "@/features/auth/registration/queries/insert-passkey.query";
import type { SecretTokenParts } from "@/features/auth/secret-token/secret-token";
import { insertSession } from "@/features/auth/session/queries/session.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 登録用の token で保存するパスキーと、始めるセッション。 */
export type EnrollmentCompletion = {
  /** 使う登録用の token の ID。 */
  readonly enrollmentId: string;
  /** 保存するパスキー。 */
  readonly passkey: PasskeyInsert;
  /** 始めるセッションの token の ID と secret のハッシュ。 */
  readonly session: Omit<SecretTokenParts, "_tag">;
};

/** 登録用の token を使ってパスキーを保存したこと。 */
export type CompletedEnrollment = {
  /** どの結果か。 */
  readonly _tag: "Completed";
  /** 保存したパスキーの行。 */
  readonly row: PasskeyRow;
};

/** 登録用の token を使えなかったこと。 */
export type IncompleteEnrollment =
  | {
      /** 登録用の token が、もう無いか切れていた。 */
      readonly _tag: "InvalidEnrollment";
    }
  | {
      /** 同じ資格情報の ID のパスキーが、すでにあった。 */
      readonly _tag: "Duplicate";
    };

/** 登録用の token を1回だけ使ってパスキーを保存し、ほかのセッションを消して、セッションを始める。 */
export const completeEnrollment = async (
  db: DatabaseExecutor,
  { enrollmentId, passkey, session }: EnrollmentCompletion,
): Promise<CompletedEnrollment | IncompleteEnrollment> =>
  db.transaction(async (tx) => {
    await lockAdminUser(tx, passkey.adminUserId);

    const [enrollment] = await tx
      .select({ id: passkeyEnrollment.id })
      .from(passkeyEnrollment)
      .where(
        and(
          eq(passkeyEnrollment.id, enrollmentId),
          gt(passkeyEnrollment.expiresAt, passkey.now),
        ),
      )
      .for("update");

    if (enrollment === undefined) {
      return { _tag: "InvalidEnrollment" };
    }

    const inserted = await insertPasskey(tx, passkey);

    if (inserted._tag === "Duplicate") {
      return { _tag: "Duplicate" };
    }

    await tx
      .delete(passkeyEnrollment)
      .where(eq(passkeyEnrollment.id, enrollmentId));
    await deleteAllSessions(tx, passkey.adminUserId);
    await insertSession(tx, {
      id: session.id,
      secretHash: session.secretHash,
      adminUserId: passkey.adminUserId,
      now: passkey.now,
    });

    return { _tag: "Completed", row: inserted.row };
  });
