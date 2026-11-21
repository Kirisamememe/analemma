import { eq } from "drizzle-orm";

import { deployToken } from "../../db/schema/deploy-token";
import type { DatabaseExecutor } from "../../platform/database";

/** 使ったデプロイ用のトークンと、使った日時。 */
export type DeployTokenUse = {
  /** token の前半の ID。 */
  readonly id: string;
  /** リクエストを受けた日時。 */
  readonly now: Date;
};

/** デプロイ用のトークンを最後に使った日時を書く。 */
export const recordDeployTokenUse = async (
  db: DatabaseExecutor,
  { id, now }: DeployTokenUse,
): Promise<void> => {
  await db
    .update(deployToken)
    .set({ lastUsedAt: now })
    .where(eq(deployToken.id, id));
};
