import { deployToken } from "../../db/schema/deploy-token";
import type { DatabaseExecutor } from "../../platform/database";
import {
  type Reauthentication,
  type ReauthenticationGone,
  recordReauthentication,
} from "../auth/current-session/record-reauthentication.query";
import type { DeployTokenRow } from "./find-deploy-token.query";

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
  /** 結果の種類。 */
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
