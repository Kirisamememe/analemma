import { passkeyEnrollment } from "../../../db/schema/passkey-enrollment";
import type { DatabaseExecutor } from "../../../platform/database";
import { ensureAdminUser, lockAdminUser } from "../admin-user/admin-user.query";

/** 新しく出す登録用の token。 */
export type NewEnrollment = {
  /** token の前半の ID。 */
  readonly id: string;
  /** token の後半の secret の SHA-256。 */
  readonly secretHash: Uint8Array<ArrayBuffer>;
  /** 出した日時。 */
  readonly now: Date;
  /** 切れる日時。 */
  readonly expiresAt: Date;
};

/** 管理者の行を用意し、前の登録用の token を消して、新しい token の行を作る。 */
export const replaceEnrollment = async (
  db: DatabaseExecutor,
  { expiresAt, id, now, secretHash }: NewEnrollment,
): Promise<void> => {
  await db.transaction(async (tx) => {
    const admin = await ensureAdminUser(tx, now);

    await lockAdminUser(tx, admin.id);

    await tx.delete(passkeyEnrollment);
    await tx.insert(passkeyEnrollment).values({
      id,
      secretHash,
      adminUserId: admin.id,
      createdAt: now,
      expiresAt,
    });
  });
};
