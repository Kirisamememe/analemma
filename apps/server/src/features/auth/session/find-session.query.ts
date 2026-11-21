import { eq } from "drizzle-orm";

import { session } from "../../../db/schema/session";
import type { DatabaseExecutor } from "../../../platform/database";

/** セッションの行。 */
export type SessionRow = typeof session.$inferSelect;

/** token の前半の ID で、セッションの行を引く。 */
export const findSession = async (
  db: DatabaseExecutor,
  id: string,
): Promise<SessionRow | undefined> => {
  const [row] = await db.select().from(session).where(eq(session.id, id));

  return row;
};
