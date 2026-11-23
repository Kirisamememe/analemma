import type { DatabaseTarget } from "@/platform/database";

/** テスト用の PostgreSQL の接続先と、使うロール。 */
export const TEST_POSTGRES = {
  host: "127.0.0.1",
  port: 55_433,
  roles: {
    app: { username: "analemma", password: "analemma" },
    admin: { username: "postgres", password: "postgres" },
  },
} as const;

/** テスト用の PostgreSQL で使うロールの種類。 */
export type TestRole = keyof typeof TEST_POSTGRES.roles;

/** テスト用の PostgreSQL の DB への、指定したロールの接続先を作る。 */
export const toTestDatabaseTarget = (
  database: string,
  role: TestRole = "app",
): DatabaseTarget => ({
  host: TEST_POSTGRES.host,
  port: TEST_POSTGRES.port,
  database,
  ...TEST_POSTGRES.roles[role],
});
