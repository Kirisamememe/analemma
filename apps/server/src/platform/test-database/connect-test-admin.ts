import postgres from "postgres";

import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";

/** テスト用の PostgreSQL への、superuser の接続。 */
export type TestAdminConnection = AsyncDisposable & {
  /** 問い合わせを送る postgres.js の関数。 */
  readonly sql: postgres.Sql;
};

/** テスト用の PostgreSQL に、DB を作ったり消したりする superuser でつなぐ。 */
export const connectTestAdmin = (): TestAdminConnection => {
  const target = toTestDatabaseTarget("postgres", "admin");

  const sql = postgres({
    host: target.host,
    port: target.port,
    database: target.database,
    username: target.username,
    password: target.password,
    max: 1,
  });

  return { sql, [Symbol.asyncDispose]: () => sql.end() };
};
