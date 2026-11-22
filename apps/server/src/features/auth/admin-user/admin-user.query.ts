import { eq } from "drizzle-orm";

import { adminUser } from "@/db/schema/admin-user";
import type { DatabaseExecutor } from "@/platform/database";

/** 管理者の行。 */
export type AdminUserRow = typeof adminUser.$inferSelect;

/** ただ1人の管理者の行を引く。 */
export const findAdminUser = async (
  db: DatabaseExecutor,
): Promise<AdminUserRow | undefined> => {
  const [row] = await db.select().from(adminUser).limit(1);

  return row;
};

/** トランザクションの終わりまで、管理者の行のロックを取る。 */
export const lockAdminUser = async (
  db: DatabaseExecutor,
  adminUserId: number,
): Promise<void> => {
  await db
    .select({ id: adminUser.id })
    .from(adminUser)
    .where(eq(adminUser.id, adminUserId))
    .for("no key update");
};

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
