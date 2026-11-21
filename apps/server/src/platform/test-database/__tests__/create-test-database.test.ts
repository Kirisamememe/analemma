import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import type { Database } from "../../database";
import type { LogEntry } from "../../logger";
import { connectTestAdmin } from "../connect-test-admin";
import { createTestDatabase } from "../create-test-database";

const logs: LogEntry[] = [];
const logger = {
  write: (entry: LogEntry) => {
    logs.push(entry);
  },
};

const hasTable = async (db: Database, table: string): Promise<boolean> => {
  const rows = await db.execute(
    sql`select to_regclass(${table}) is not null as found`,
    "objects",
  );

  return rows[0]?.["found"] === true;
};

const databaseExists = async (name: string): Promise<boolean> => {
  await using admin = connectTestAdmin();
  const rows =
    await admin.sql`select 1 from pg_database where datname = ${name}`;

  return rows.length > 0;
};

describe("テストの DB", () => {
  test("テストごとに別の DB を作り、片方に作ったテーブルはもう片方に無いこと", async () => {
    await using first = await createTestDatabase({ logger });
    await using second = await createTestDatabase({ logger });

    await first.db.execute(sql`create table notes (body text)`);

    expect(first.name).not.toBe(second.name);
    expect(await hasTable(first.db, "notes")).toBe(true);
    expect(await hasTable(second.db, "notes")).toBe(false);
  });

  test("migration を適用したテンプレートから作ること", async () => {
    await using database = await createTestDatabase({ logger });

    expect(await hasTable(database.db, "drizzle.__drizzle_migrations")).toBe(
      true,
    );
  });

  test("superuser でないロールで DB につなぐこと", async () => {
    await using database = await createTestDatabase({ logger });
    const rows = await database.db.execute(
      sql`select current_user as role, current_setting('is_superuser') as superuser`,
      "objects",
    );

    expect(rows).toEqual([{ role: "analemma", superuser: "off" }]);
  });

  test("await using を抜けると、DB を消すこと", async () => {
    const createAndClose = async (): Promise<string> => {
      await using database = await createTestDatabase({ logger });

      expect(await databaseExists(database.name)).toBe(true);

      return database.name;
    };

    const name = await createAndClose();

    expect(await databaseExists(name)).toBe(false);
  });

  test("同じテンプレートから同時に作っても、それぞれの DB を使えること", async () => {
    await using stack = new AsyncDisposableStack();
    const settled = await Promise.allSettled(
      Array.from({ length: 4 }, async () => createTestDatabase({ logger })),
    );
    const databases = settled.flatMap((result) =>
      result.status === "fulfilled" ? [stack.use(result.value)] : [],
    );
    const current = await Promise.all(
      databases.map(async ({ db }) =>
        db.execute(sql`select current_database() as name`, "objects"),
      ),
    );

    expect(databases).toHaveLength(4);
    expect(current).toEqual(databases.map(({ name }) => [{ name }]));
  });

  test("テンプレートが無いときは、作り方を伝えて失敗すること", async () => {
    const error = await createTestDatabase({
      logger,
      template: "analemma_template_missing",
    }).catch((error_: unknown) => error_);

    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : "").toContain(
      "bun run test で作る",
    );
  });
});
