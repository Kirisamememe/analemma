import { eq } from "drizzle-orm";

import { deployToken } from "../../db/schema/deploy-token";
import type { DatabaseExecutor } from "../../platform/database";

/** デプロイ用のトークンの行を消し、消せたかを返す。 */
export const deleteDeployToken = async (
  db: DatabaseExecutor,
  id: string,
): Promise<boolean> => {
  const rows = await db
    .delete(deployToken)
    .where(eq(deployToken.id, id))
    .returning({ id: deployToken.id });

  return rows.length > 0;
};
