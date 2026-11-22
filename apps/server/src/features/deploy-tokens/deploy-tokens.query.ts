import { asc, eq, sql } from "drizzle-orm";

import { deployToken } from "@/db/schema/deploy-token";
import {
  type Reauthentication,
  type ReauthenticationGone,
  recordReauthentication,
} from "@/features/auth/current-session/record-reauthentication.query";
import type { DatabaseExecutor } from "@/platform/database";

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

/** デプロイ用のトークンを、発行した順に並べる。 */
export const listDeployTokens = async (
  db: DatabaseExecutor,
): Promise<DeployTokenRow[]> =>
  db
    .select()
    .from(deployToken)
    .orderBy(asc(deployToken.createdAt), asc(deployToken.id));

/** 新しいデプロイ用のトークンの行。 */
export type NewDeployToken = {
  /** token の前半の ID。 */
  readonly id: string;
  /** token の後半の secret の SHA-256。 */
  readonly secretHash: Uint8Array<ArrayBuffer>;
  /** 管理画面で見分けるための名前。 */
  readonly name: string;
};

/** 発行の前の再認証と、発行するトークン。 */
export type DeployTokenIssue = {
  /** 発行を求めたセッションと、再認証に使ったパスキー。 */
  readonly reauthentication: Reauthentication;
  /** 発行するトークン。 */
  readonly token: NewDeployToken;
};

/** 発行したデプロイ用のトークンの行。 */
export type IssuedDeployToken = {
  /** どの結果か。 */
  readonly _tag: "Issued";
  /** 作った行。 */
  readonly row: DeployTokenRow;
};

/** 再認証に使ったパスキーの使用を書き、デプロイ用のトークンの行を作る。 */
export const recordIssue = async (
  db: DatabaseExecutor,
  { reauthentication, token }: DeployTokenIssue,
): Promise<IssuedDeployToken | ReauthenticationGone> =>
  db.transaction(async (tx) => {
    const recorded = await recordReauthentication(tx, reauthentication);

    if (recorded._tag !== "Recorded") {
      return recorded;
    }

    const [row] = await tx
      .insert(deployToken)
      .values({ ...token, createdAt: reauthentication.use.now })
      .returning();

    if (row === undefined) {
      throw new Error("デプロイ用のトークンの行を作れなかった");
    }

    return { _tag: "Issued", row };
  });

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
