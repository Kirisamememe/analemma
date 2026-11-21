import { eq } from "drizzle-orm";

import { session } from "../../../db/schema/session";
import type { DatabaseExecutor } from "../../../platform/database";

/** セッションの行を消す。 */
export const deleteSession = async (
  db: DatabaseExecutor,
  id: string,
): Promise<void> => {
  await db.delete(session).where(eq(session.id, id));
};
