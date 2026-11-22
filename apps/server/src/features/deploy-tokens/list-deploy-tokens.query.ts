import { asc } from "drizzle-orm";

import { deployToken } from "../../db/schema/deploy-token";
import type { DatabaseExecutor } from "../../platform/database";
import type { DeployTokenRow } from "./find-deploy-token.query";

/** デプロイ用のトークンを、発行した順に並べる。 */
export const listDeployTokens = async (
  db: DatabaseExecutor,
): Promise<DeployTokenRow[]> =>
  db
    .select()
    .from(deployToken)
    .orderBy(asc(deployToken.createdAt), asc(deployToken.id));
