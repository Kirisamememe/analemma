import { adminUser } from "../../../db/schema/admin-user";
import type { DatabaseExecutor } from "../../../platform/database";
import { type AdminUserRow, findAdminUser } from "./find-admin-user.query";

const USER_HANDLE_BYTES = 16;

/** ただ1人の管理者の行を用意して返す。 */
export const ensureAdminUser = async (
  db: DatabaseExecutor,
  now: Date,
): Promise<AdminUserRow> => {
  await db
    .insert(adminUser)
    .values({
      userHandle: crypto.getRandomValues(new Uint8Array(USER_HANDLE_BYTES)),
      createdAt: now,
    })
    .onConflictDoNothing({ target: adminUser.id });

  const row = await findAdminUser(db);

  if (row === undefined) {
    throw new Error("管理者の行を作れなかった");
  }

  return row;
};
