import type { DatabaseExecutor } from "../../platform/database";
import { equalSecretHashes } from "../auth/secret-token/equal-secret-hashes";
import { readSecretToken } from "../auth/secret-token/read-secret-token";
import { findDeployToken } from "./find-deploy-token.query";
import { recordDeployTokenUse } from "./record-deploy-token-use.query";

/** 確かめられたデプロイ用のトークン。 */
export type VerifiedDeployToken = {
  /** 結果の種類。 */
  readonly _tag: "Verified";
  /** token の前半の ID。 */
  readonly id: string;
};

/** デプロイ用のトークンを確かめられないこと。 */
export type RejectedDeployToken = {
  /** 結果の種類。 */
  readonly _tag: "Rejected";
  /** ログに書く、token の前半の ID(読めたときだけ)。 */
  readonly id: string | undefined;
};

/** デプロイ用のトークンを確かめるリクエスト。 */
export type DeployTokenCheck = {
  /** Drizzle で問い合わせる DB。 */
  readonly db: DatabaseExecutor;
  /** Authorization ヘッダーから読んだ token。 */
  readonly token: string;
  /** リクエストを受けた日時。 */
  readonly now: Date;
};

/** デプロイ用のトークンを確かめ、使った日時を書く。 */
export const verifyDeployToken = async ({
  db,
  now,
  token,
}: DeployTokenCheck): Promise<VerifiedDeployToken | RejectedDeployToken> => {
  const parts = await readSecretToken(token);

  if (parts._tag === "Malformed") {
    return { _tag: "Rejected", id: undefined };
  }

  const row = await findDeployToken(db, parts.id);

  if (
    row === undefined ||
    !equalSecretHashes(row.secretHash, parts.secretHash) ||
    !(await recordDeployTokenUse(db, { id: row.id, now }))
  ) {
    return { _tag: "Rejected", id: parts.id };
  }

  return { _tag: "Verified", id: row.id };
};
