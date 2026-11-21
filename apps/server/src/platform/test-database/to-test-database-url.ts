import { type TestRole, toTestDatabaseTarget } from "./to-test-database-target";

/** テスト用の PostgreSQL の DB につなぐ URL を、DATABASE_URL の形で作る。 */
export const toTestDatabaseUrl = (
  database: string,
  role: TestRole = "app",
): string => {
  const { host, password, port, username } = toTestDatabaseTarget(
    database,
    role,
  );

  return `postgres://${username}:${password}@${host}:${String(port)}/${database}`;
};
