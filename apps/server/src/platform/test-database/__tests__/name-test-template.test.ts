import { expect, test } from "bun:test";

import { readMigrations } from "@/db/read-migrations";
import { nameTestTemplate } from "@/platform/test-database/name-test-template";
import { writeTestMigrations } from "@/platform/test-database/write-test-migrations";

const CREATE_NOTES = "20260101000000_create-notes";

const nameFor = async (
  migrations: Readonly<Record<string, string>>,
): Promise<string> => {
  await using written = await writeTestMigrations(migrations);

  return nameTestTemplate(readMigrations(written.folder));
};

test("migration の中身が同じなら、フォルダが違っても同じ名前にすること", async () => {
  const migrations = { [CREATE_NOTES]: "CREATE TABLE notes (body text);" };

  expect(await nameFor(migrations)).toBe(await nameFor(migrations));
});

test("SQL を1文字変えたら、別の名前にすること", async () => {
  expect(
    await nameFor({ [CREATE_NOTES]: "CREATE TABLE notes (body text);" }),
  ).not.toBe(
    await nameFor({ [CREATE_NOTES]: "CREATE TABLE notes (body text) ;" }),
  );
});

test("migration を足したら、別の名前にすること", async () => {
  const first = { [CREATE_NOTES]: "CREATE TABLE notes (body text);" };

  expect(await nameFor(first)).not.toBe(
    await nameFor({
      ...first,
      "20260102000000_add-title": "ALTER TABLE notes ADD COLUMN title text;",
    }),
  );
});

test("SQL が同じでも、migration の名前を変えたら、別の名前にすること", async () => {
  const body = "CREATE TABLE notes (body text);";

  expect(await nameFor({ [CREATE_NOTES]: body })).not.toBe(
    await nameFor({ "20260101000000_create-memos": body }),
  );
});

test("名前に `_building` を付けても、PostgreSQL の名前の上限(63バイト)に収まること", async () => {
  const name = await nameFor({
    [CREATE_NOTES]: "CREATE TABLE notes (body text);",
  });

  expect(
    new TextEncoder().encode(`${name}_building`).length,
  ).toBeLessThanOrEqual(63);
});
