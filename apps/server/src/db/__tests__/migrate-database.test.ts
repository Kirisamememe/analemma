import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { migrateDatabase } from "@/db/migrate-database";
import type { Database } from "@/platform/database";
import type { LogEntry } from "@/platform/logger";
import { createTestDatabase } from "@/platform/test-database/create-test-database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import { writeTestMigrations } from "@/platform/test-database/write-test-migrations";

const logs: LogEntry[] = [];

const logger = {
  write: (entry: LogEntry) => {
    logs.push(entry);
  },
};

const hasRelation = async (db: Database, name: string): Promise<boolean> => {
  const rows = await db.execute(
    sql`select to_regclass(${name}) is not null or to_regnamespace(${name}) is not null as found`,
    "objects",
  );

  return rows[0]?.["found"] === true;
};

const CREATE_NOTES = "20260101000000_create-notes";

describe("migration を適用する", () => {
  test("同じ DB に同時に適用しても、1回だけ適用すること", async () => {
    await using database = await createTestDatabase({
      logger,
      template: "template0",
    });
    await using migrations = await writeTestMigrations({
      [CREATE_NOTES]: [
        "SELECT pg_sleep(0.3);",
        "--> statement-breakpoint",
        "CREATE TABLE notes (body text);",
      ].join("\n"),
    });

    const options = {
      target: toTestDatabaseTarget(database.name),
      logger,
      migrationsFolder: migrations.folder,
    };

    const results = await Promise.allSettled([
      migrateDatabase(options),
      migrateDatabase(options),
    ]);

    const recorded = await database.db.execute(
      sql`select name from drizzle.__drizzle_migrations`,
      "objects",
    );

    expect(results.map(({ status }) => status)).toEqual([
      "fulfilled",
      "fulfilled",
    ]);
    expect(
      results
        .flatMap((result) =>
          result.status === "fulfilled" ? [result.value.added] : [],
        )
        .toSorted((left, right) => left - right),
    ).toEqual([0, 1]);
    expect(recorded).toEqual([{ name: CREATE_NOTES }]);
  });

  test("superuser でつなぐと、何も変えずに断ること", async () => {
    await using database = await createTestDatabase({
      logger,
      template: "template0",
    });
    await using migrations = await writeTestMigrations({
      [CREATE_NOTES]: "CREATE TABLE notes (body text);",
    });

    const error = await migrateDatabase({
      target: toTestDatabaseTarget(database.name, "admin"),
      logger,
      migrationsFolder: migrations.folder,
    }).catch((error_: unknown) => error_);

    expect(error instanceof Error ? error.message : "").toContain(
      "superuser では migration を適用しない",
    );
    expect(await hasRelation(database.db, "drizzle")).toBe(false);
    expect(await hasRelation(database.db, "notes")).toBe(false);
  });

  test("適用済みの migration の SQL が書き換えられていたら、失敗すること", async () => {
    await using database = await createTestDatabase({
      logger,
      template: "template0",
    });
    await using migrations = await writeTestMigrations({
      [CREATE_NOTES]: "CREATE TABLE notes (body text);",
    });

    const options = {
      target: toTestDatabaseTarget(database.name),
      logger,
      migrationsFolder: migrations.folder,
    };

    await migrateDatabase(options);
    await migrations.rewrite(
      CREATE_NOTES,
      "CREATE TABLE notes (body text, title text);",
    );

    const error = await migrateDatabase(options).catch(
      (error_: unknown) => error_,
    );

    expect(error instanceof Error ? error.message : "").toContain(
      `書き換え:${CREATE_NOTES}`,
    );
  });

  test("適用済みの migration がフォルダから消えていたら(名前を変えたときも)、何も適用せずに失敗すること", async () => {
    await using database = await createTestDatabase({
      logger,
      template: "template0",
    });
    await using first = await writeTestMigrations({
      [CREATE_NOTES]: "CREATE TABLE notes (body text);",
    });
    await using renamed = await writeTestMigrations({
      "20260101000000_create-memos": "CREATE TABLE memos (body text);",
    });
    const target = toTestDatabaseTarget(database.name);

    await migrateDatabase({ target, logger, migrationsFolder: first.folder });

    const error = await migrateDatabase({
      target,
      logger,
      migrationsFolder: renamed.folder,
    }).catch((error_: unknown) => error_);

    expect(error instanceof Error ? error.message : "").toContain(
      `消えたもの:${CREATE_NOTES}`,
    );
    expect(await hasRelation(database.db, "memos")).toBe(false);
  });

  test("足した migration だけを、次に適用すること", async () => {
    await using database = await createTestDatabase({
      logger,
      template: "template0",
    });
    await using migrations = await writeTestMigrations({
      [CREATE_NOTES]: "CREATE TABLE notes (body text);",
    });

    const options = {
      target: toTestDatabaseTarget(database.name),
      logger,
      migrationsFolder: migrations.folder,
    };

    await migrateDatabase(options);
    await migrations.rewrite(
      "20260102000000_add-title",
      "ALTER TABLE notes ADD COLUMN title text;",
    );

    const { added, applied } = await migrateDatabase(options);

    expect(added).toBe(1);
    expect(applied.map(({ name }) => name)).toEqual([
      CREATE_NOTES,
      "20260102000000_add-title",
    ]);
    expect(await hasRelation(database.db, "notes")).toBe(true);
  });
});
