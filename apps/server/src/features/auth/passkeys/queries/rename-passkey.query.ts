import { and, eq } from "drizzle-orm";

import { passkey } from "@/db/schema/auth/passkey";
import type { PasskeyRow } from "@/features/auth/registration/queries/insert-passkey.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 名前を変えるパスキーと、新しい名前。 */
export type PasskeyRename = {
  /** 管理者の ID。 */
  readonly adminUserId: number;
  /** 資格情報の ID。 */
  readonly id: string;
  /** 新しい名前。 */
  readonly name: string;
};

/** 管理者のパスキーの名前を変え、変えた行を返す。 */
export const renamePasskey = async (
  db: DatabaseExecutor,
  { adminUserId, id, name }: PasskeyRename,
): Promise<PasskeyRow | undefined> => {
  const [row] = await db
    .update(passkey)
    .set({ name })
    .where(and(eq(passkey.id, id), eq(passkey.adminUserId, adminUserId)))
    .returning();

  return row;
};
