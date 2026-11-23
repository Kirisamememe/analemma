import { asc, eq } from "drizzle-orm";

import { passkey } from "@/db/schema/auth/passkey";
import type { PasskeyRow } from "@/features/auth/registration/queries/insert-passkey.query";
import type { DatabaseExecutor } from "@/platform/database";

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
