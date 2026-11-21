import { asc, eq } from "drizzle-orm";

import { passkey } from "../../../db/schema/passkey";
import type { DatabaseExecutor } from "../../../platform/database";
import type { PasskeyRow } from "../registration/insert-passkey.query";

/** 管理者のパスキーを、登録した順に並べる。 */
export const listPasskeys = async (
  db: DatabaseExecutor,
  adminUserId: number,
): Promise<PasskeyRow[]> =>
  db
    .select()
    .from(passkey)
    .where(eq(passkey.adminUserId, adminUserId))
    .orderBy(asc(passkey.createdAt), asc(passkey.id));
