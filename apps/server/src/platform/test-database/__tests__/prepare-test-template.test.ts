import { expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Database } from "@/platform/database";
import type { LogEntry } from "@/platform/logger";
import { connectTestAdmin } from "@/platform/test-database/connect-test-admin";
import { createTestDatabase } from "@/platform/test-database/create-test-database";
import { prepareTestTemplate } from "@/platform/test-database/prepare-test-template";
import { writeTestMigrations } from "@/platform/test-database/write-test-migrations";

const logs: LogEntry[] = [];
const logger = {
  write: (entry: LogEntry) => {
    logs.push(entry);
  },
};

const CREATE_NOTES = "20260101000000_create-notes";

const hasTable = async (db: Database, table: string): Promise<boolean> => {
  const rows = await db.execute(
    sql`select to_regclass(${table}) is not null as found`,
    "objects",
  );

  return rows[0]?.["found"] === true;
};

const listDatabases = async (template: string): Promise<unknown[]> => {
  await using admin = connectTestAdmin();
  const rows = await admin.sql`
    select datname, datistemplate, datallowconn, datdba::regrole::text as owner
    from pg_database where datname in (${template}, ${`${template}_building`})
    order by datname
  `;

  return [...rows];
};

const dropDatabase = async (name: string): Promise<void> => {
  await using admin = connectTestAdmin();
  const { sql: adminSql } = admin;
  const found =
    await adminSql`select 1 from pg_database where datname = ${name}`;

  if (found.length > 0) {
    await adminSql`alter database ${adminSql(name)} with is_template false`;
    await adminSql`drop database ${adminSql(name)} with (force)`;
  }
};

const dropTemplate = async (template: string): Promise<void> => {
  await Promise.all([
    dropDatabase(template),
    dropDatabase(`${template}_building`),
  ]);
};

const uniqueTemplate = (): string =>
  `analemma_template_test_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;

test("同じテンプレートを同時に用意しても、どちらも成功し、migration を適用したテンプレートが1つできること", async () => {
  const template = uniqueTemplate();
  await using cleanup = new AsyncDisposableStack();

  cleanup.defer(async () => dropTemplate(template));

  const results = await Promise.allSettled([
    prepareTestTemplate({ template, logger }),
    prepareTestTemplate({ template, logger }),
  ]);

  expect(results.map(({ status }) => status)).toEqual([
    "fulfilled",
    "fulfilled",
  ]);

  await using database = await createTestDatabase({ logger, template });

  expect(await listDatabases(template)).toEqual([
    {
      datname: template,
      datistemplate: true,
      datallowconn: false,
      owner: "analemma",
    },
  ]);
  expect(await hasTable(database.db, "drizzle.__drizzle_migrations")).toBe(
    true,
  );
});

test("作りかけのテンプレートが残っていても、作り直して用意すること", async () => {
  const template = uniqueTemplate();
  await using cleanup = new AsyncDisposableStack();

  cleanup.defer(async () => dropTemplate(template));
  await using admin = connectTestAdmin();
  const { sql: adminSql } = admin;
  const building = `${template}_building`;

  await adminSql`create database ${adminSql(building)}`;
  await adminSql`alter database ${adminSql(building)} with is_template true`;

  await prepareTestTemplate({ template, logger });

  expect(await listDatabases(template)).toMatchObject([{ datname: template }]);
});

test("migration の SQL を適用したテンプレートから、テストの DB を作ること", async () => {
  const template = uniqueTemplate();
  await using cleanup = new AsyncDisposableStack();

  cleanup.defer(async () => dropTemplate(template));
  await using migrations = await writeTestMigrations({
    [CREATE_NOTES]: "CREATE TABLE notes (body text);",
  });

  await prepareTestTemplate({
    template,
    logger,
    migrationsFolder: migrations.folder,
  });
  await prepareTestTemplate({
    template,
    logger,
    migrationsFolder: migrations.folder,
  });

  await using database = await createTestDatabase({ logger, template });
  const applied = await database.db.execute(
    sql`select name from drizzle.__drizzle_migrations`,
    "objects",
  );

  expect(await hasTable(database.db, "notes")).toBe(true);
  expect(applied).toEqual([{ name: CREATE_NOTES }]);
});

test("migration が失敗したら、作りかけを消して失敗し、直した後に作り直せること", async () => {
  const template = uniqueTemplate();
  await using cleanup = new AsyncDisposableStack();

  cleanup.defer(async () => dropTemplate(template));
  await using migrations = await writeTestMigrations({
    [CREATE_NOTES]: "CREATE TABLE notes (body no_such_type);",
  });
  const options = { template, logger, migrationsFolder: migrations.folder };

  const failed = await prepareTestTemplate(options).catch(
    (error: unknown) => error,
  );

  expect(failed).toBeInstanceOf(Error);
  expect(await listDatabases(template)).toEqual([]);

  await migrations.rewrite(CREATE_NOTES, "CREATE TABLE notes (body text);");
  await prepareTestTemplate(options);

  await using database = await createTestDatabase({ logger, template });

  expect(await hasTable(database.db, "notes")).toBe(true);
});

test("名前を決めた後に migration が書き換えられたら、テンプレートを作らずに失敗すること", async () => {
  const template = uniqueTemplate();
  await using cleanup = new AsyncDisposableStack();

  cleanup.defer(async () => dropTemplate(template));
  await using migrations = await writeTestMigrations({
    [CREATE_NOTES]: "CREATE TABLE notes (body text);",
  });
  const preparing = prepareTestTemplate({
    template,
    logger,
    migrationsFolder: migrations.folder,
  });

  writeFileSync(
    join(migrations.folder, CREATE_NOTES, "migration.sql"),
    "CREATE TABLE notes (body text, title text);",
  );

  const error = await preparing.catch((error_: unknown) => error_);

  expect(error instanceof Error ? error.message : "").toContain(
    "名前を決めたときの migration と違う",
  );
  expect(await listDatabases(template)).toEqual([]);
});
