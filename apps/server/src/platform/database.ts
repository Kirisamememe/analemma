import type { PgAsyncDatabase } from "drizzle-orm/pg-core/async";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js/session";
import postgres from "postgres";

import type { Logger } from "./logger";

/** Drizzle で問い合わせる DB。 */
export type Database = PostgresJsDatabase;

/** Drizzle で問い合わせる DB か、その中のトランザクション。 */
export type DatabaseExecutor = PgAsyncDatabase<PostgresJsQueryResultHKT>;

/** つなぐ DB と、つなぐときのロール。 */
export type DatabaseTarget = {
  /** ホストの名前か IP アドレス。 */
  readonly host: string;
  /** ポートの番号。 */
  readonly port: number;
  /** DB の名前。 */
  readonly database: string;
  /** つなぐときのロール。 */
  readonly username: string;
  /** ロールのパスワード。 */
  readonly password: string;
};

/** 開いた DB の接続。 */
export type DatabaseConnection = AsyncDisposable & {
  /** Drizzle で問い合わせる DB。 */
  readonly db: Database;
  /** Drizzle が使う postgres.js の接続のプール。 */
  readonly client: postgres.Sql;
};

/** DB の接続を開くための設定。 */
export type DatabaseOptions = {
  /** つなぐ DB と、つなぐときのロール。 */
  readonly target: DatabaseTarget;
  /** PostgreSQL からの通知を書き出す logger。 */
  readonly logger: Logger;
  /** プールが開く接続の数の上限。 */
  readonly max?: number;
};

const DEFAULT_MAX_CONNECTIONS = 10;

/** postgres.js で DB の接続を開き、Drizzle で包む。 */
export const openDatabase = ({
  logger,
  max = DEFAULT_MAX_CONNECTIONS,
  target,
}: DatabaseOptions): DatabaseConnection => {
  const client = postgres({
    host: target.host,
    port: target.port,
    database: target.database,
    username: target.username,
    password: target.password,
    max,
    onnotice: (notice) => {
      logger.write({
        level: "info",
        message: "PostgreSQL からの通知",
        details: { notice },
      });
    },
  });

  return {
    db: drizzle({ client }),
    client,
    [Symbol.asyncDispose]: () => client.end(),
  };
};
