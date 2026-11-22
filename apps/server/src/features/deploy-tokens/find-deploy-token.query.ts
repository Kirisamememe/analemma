import { eq } from "drizzle-orm";

import { deployToken } from "../../db/schema/deploy-token";
import type { DatabaseExecutor } from "../../platform/database";

/** デプロイ用のトークンの行。 */
export type DeployTokenRow = typeof deployToken.$inferSelect;

/** token の前半の ID で、デプロイ用のトークンの行を引く。 */
export const findDeployToken = async (
  db: DatabaseExecutor,
  id: string,
): Promise<DeployTokenRow | undefined> => {
  const [row] = await db
    .select()
    .from(deployToken)
    .where(eq(deployToken.id, id));

  return row;
};
