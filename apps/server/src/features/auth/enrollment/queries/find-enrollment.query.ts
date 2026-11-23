import { eq } from "drizzle-orm";

import { passkeyEnrollment } from "@/db/schema/auth/passkey-enrollment";
import type { DatabaseExecutor } from "@/platform/database";

/** 登録用の token の行。 */
export type EnrollmentRow = typeof passkeyEnrollment.$inferSelect;

/** token の前半の ID で、登録用の token の行を引く。 */
export const findEnrollment = async (
  db: DatabaseExecutor,
  id: string,
): Promise<EnrollmentRow | undefined> => {
  const [row] = await db
    .select()
    .from(passkeyEnrollment)
    .where(eq(passkeyEnrollment.id, id));

  return row;
};
