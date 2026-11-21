import { deployToken } from "../../db/schema/deploy-token";
import type { DatabaseExecutor } from "../../platform/database";
import type { DeployTokenRow } from "./find-deploy-token.query";

/** 新しいデプロイ用のトークンの行。 */
export type NewDeployToken = {
  /** token の前半の ID。 */
  readonly id: string;
  /** token の後半の secret の SHA-256。 */
  readonly secretHash: Uint8Array<ArrayBuffer>;
  /** 管理画面で見分けるための名前。 */
  readonly name: string;
  /** 発行した日時。 */
  readonly now: Date;
};

/** デプロイ用のトークンの行を作る。 */
export const insertDeployToken = async (
  db: DatabaseExecutor,
  { id, name, now, secretHash }: NewDeployToken,
): Promise<DeployTokenRow> => {
  const [row] = await db
    .insert(deployToken)
    .values({ id, secretHash, name, createdAt: now })
    .returning();

  if (row === undefined) {
    throw new Error("デプロイ用のトークンの行を作れなかった");
  }

  return row;
};
