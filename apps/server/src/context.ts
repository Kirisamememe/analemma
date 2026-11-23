import type { ChallengeStore } from "@/features/auth/challenge/create-challenge-store";
import type { Clock } from "@/platform/clock";
import type { Database } from "@/platform/database";
import type { FileStorage } from "@/platform/file-storage/open-file-storage";
import type { Logger } from "@/platform/logger";
import type { RelyingParty } from "@/platform/parse-relying-party";

/** 起動時に組み立て、すべてのリクエストで共有する依存。 */
export type AppContext = {
  /** 現在時刻の出どころ。 */
  readonly clock: Clock;
  /** Drizzle で問い合わせる DB。 */
  readonly db: Database;
  /** ログを書き出す logger。 */
  readonly logger: Logger;
  /** 管理画面の origin と RP ID。 */
  readonly relyingParty: RelyingParty;
  /** 配信用の画像のファイルの置き場所。 */
  readonly storage: FileStorage;
  /** 出した challenge を1回きりで覚えておく表。 */
  readonly challenges: ChallengeStore;
};

/** 1つのリクエストを処理するあいだの依存。 */
export type RequestContext = AppContext & {
  /** リクエストの HTTP のメソッド。 */
  readonly method: string;
  /** リクエストのヘッダー。 */
  readonly headers: Headers;
  /** 応答に足すヘッダー。 */
  readonly resHeaders: Headers;
};
