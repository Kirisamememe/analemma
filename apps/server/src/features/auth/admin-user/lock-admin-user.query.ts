import { eq } from "drizzle-orm";

import { adminUser } from "../../../db/schema/admin-user";
import type { DatabaseExecutor } from "../../../platform/database";

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
