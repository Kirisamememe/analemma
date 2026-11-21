import { adminUser } from "../../../db/schema/admin-user";
import type { DatabaseExecutor } from "../../../platform/database";

/** 管理者の行。 */
export type AdminUserRow = typeof adminUser.$inferSelect;

/** ただ1人の管理者の行を引く。 */
export const findAdminUser = async (
  db: DatabaseExecutor,
): Promise<AdminUserRow | undefined> => {
  const [row] = await db.select().from(adminUser).limit(1);

  return row;
};
