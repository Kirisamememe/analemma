import { and, eq, sql } from "drizzle-orm";

import { passkey } from "@/db/schema/auth/passkey";
import type { DatabaseExecutor } from "@/platform/database";

/** ログインや再認証に使ったパスキーと、届いた値。 */
export type PasskeyUse = {
  /** 資格情報の ID。 */
  readonly id: string;
  /** 管理者の ID。 */
  readonly adminUserId: number;
  /** 署名を確かめた公開鍵。 */
  readonly publicKey: Uint8Array<ArrayBuffer>;
  /** 届いた `signCount`。 */
  readonly signCount: number;
  /** BS:今、同期されているか。 */
  readonly backedUp: boolean;
  /** 使った日時。 */
  readonly now: Date;
};

/** パスキーの `signCount` と使った日時を書き、そのパスキーがまだあったかを返す。 */
export const recordPasskeyUse = async (
  db: DatabaseExecutor,
  use: PasskeyUse,
): Promise<boolean> => {
  const updated = await db
    .update(passkey)
    .set({
      signCount: sql`greatest(${passkey.signCount}, ${use.signCount})`,
      backedUp: use.backedUp,
      lastUsedAt: use.now,
    })
    .where(
      and(
        eq(passkey.id, use.id),
        eq(passkey.adminUserId, use.adminUserId),
        eq(passkey.publicKey, use.publicKey),
      ),
    )
    .returning({ id: passkey.id });

  return updated.length > 0;
};
