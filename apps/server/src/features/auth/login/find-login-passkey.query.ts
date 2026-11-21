import { eq } from "drizzle-orm";

import { adminUser } from "../../../db/schema/admin-user";
import { passkey } from "../../../db/schema/passkey";
import type { DatabaseExecutor } from "../../../platform/database";

/** ログインの検証に使う、保存したパスキーと持ち主の user handle。 */
export type LoginPasskey = {
  /** 資格情報の ID。 */
  readonly id: string;
  /** 管理者の ID。 */
  readonly adminUserId: number;
  /** 管理者の user handle。 */
  readonly userHandle: Uint8Array<ArrayBuffer>;
  /** COSE_Key の公開鍵。 */
  readonly publicKey: Uint8Array<ArrayBuffer>;
  /** COSE のアルゴリズムの番号。 */
  readonly algorithm: number;
  /** 最後に受け取った `signCount`。 */
  readonly signCount: number;
  /** 登録で受け取った BE。 */
  readonly backupEligible: boolean;
};

/** 資格情報の ID で、パスキーと持ち主の user handle を引く。 */
export const findLoginPasskey = async (
  db: DatabaseExecutor,
  id: string,
): Promise<LoginPasskey | undefined> => {
  const [row] = await db
    .select({
      id: passkey.id,
      adminUserId: passkey.adminUserId,
      userHandle: adminUser.userHandle,
      publicKey: passkey.publicKey,
      algorithm: passkey.algorithm,
      signCount: passkey.signCount,
      backupEligible: passkey.backupEligible,
    })
    .from(passkey)
    .innerJoin(adminUser, eq(passkey.adminUserId, adminUser.id))
    .where(eq(passkey.id, id));

  return row;
};
