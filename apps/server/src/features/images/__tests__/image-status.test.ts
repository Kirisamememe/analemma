import { expect, test } from "bun:test";

import { image } from "@/db/schema/image";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import { createTestClient, TEST_NOW } from "@/test-client";

test("公開した日時は、状態が公開の行にだけ持てること", async () => {
  await using server = await createTestClient();

  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
    max: 1,
  });

  const dates = { createdAt: TEST_NOW, updatedAt: TEST_NOW };

  const insert = async (values: typeof image.$inferInsert) =>
    connection.db.insert(image).values(values);

  expect(
    insert({ ...dates, status: "published", publishedAt: null }),
  ).rejects.toThrow();
  expect(
    insert({ ...dates, status: "unpublished", publishedAt: TEST_NOW }),
  ).rejects.toThrow();
  expect(
    insert({ ...dates, status: "processing", publishedAt: TEST_NOW }),
  ).rejects.toThrow();
  expect(
    await insert({ ...dates, status: "published", publishedAt: TEST_NOW }),
  ).toBeDefined();
});
