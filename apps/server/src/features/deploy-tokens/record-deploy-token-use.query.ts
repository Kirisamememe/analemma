import { eq, sql } from "drizzle-orm";

import { deployToken } from "../../db/schema/deploy-token";
import type { DatabaseExecutor } from "../../platform/database";

/** 使ったデプロイ用のトークンと、使った日時。 */
export type DeployTokenUse = {
  /** token の前半の ID。 */
  readonly id: string;
  /** リクエストを受けた日時。 */
  readonly now: Date;
};

/** デプロイ用のトークンを最後に使った日時を進め、行がまだあるかを返す。 */
export const recordDeployTokenUse = async (
  db: DatabaseExecutor,
  { id, now }: DeployTokenUse,
): Promise<boolean> => {
  const rows = await db
    .update(deployToken)
    .set({
      lastUsedAt: sql`greatest(coalesce(${deployToken.lastUsedAt}, ${now}), ${now})`,
    })
    .where(eq(deployToken.id, id))
    .returning({ id: deployToken.id });

  return rows.length > 0;
};
