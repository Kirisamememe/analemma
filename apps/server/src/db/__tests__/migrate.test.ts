import { expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import type { Database } from "@/platform/database";
import type { LogEntry } from "@/platform/logger";
import { createTestDatabase } from "@/platform/test-database/create-test-database";
import { toTestDatabaseUrl } from "@/platform/test-database/to-test-database-url";

const MIGRATE = join(import.meta.dirname, "../migrate.ts");

const logs: LogEntry[] = [];

const logger = {
  write: (entry: LogEntry) => {
    logs.push(entry);
  },
};

const runMigrate = (env: Record<string, string>) =>
  spawnSync(process.execPath, ["--no-env-file", MIGRATE], {
    env,
    encoding: "utf8",
  });

const hasTable = async (db: Database, table: string): Promise<boolean> => {
  const rows = await db.execute(
    sql`select to_regclass(${table}) is not null as found`,
    "objects",
  );

  return rows[0]?.["found"] === true;
};

test("migration を適用していない DB に、superuser でないロールで適用でき、2回目も成功すること", async () => {
  await using database = await createTestDatabase({
    logger,
    template: "template0",
  });
  const env = { DATABASE_URL: toTestDatabaseUrl(database.name) };

  expect(await hasTable(database.db, "drizzle.__drizzle_migrations")).toBe(
    false,
  );

  const first = runMigrate(env);
  const second = runMigrate(env);

  expect([first.status, second.status]).toEqual([0, 0]);
  expect(first.stdout).toContain("migration を適用した");
  expect(await hasTable(database.db, "drizzle.__drizzle_migrations")).toBe(
    true,
  );
});

test("DATABASE_URL が無いと、変数の名前を添えて失敗すること", () => {
  const result = runMigrate({});

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("DATABASE_URL: 設定されていない");
});

test("URL として読めない DATABASE_URL では、パスワードを出さずに失敗すること", () => {
  const result = runMigrate({
    DATABASE_URL: "postgres://analemma:s3c#ret@127.0.0.1:bad/analemma",
  });

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("DATABASE_URL: URL として読めない");
  expect(`${result.stdout}${result.stderr}`).not.toContain("s3c");
});
