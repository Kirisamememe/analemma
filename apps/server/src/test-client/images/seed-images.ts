import { image } from "@/db/schema/image";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import { TEST_NOW, type TestClient } from "@/test-client/create-test-client";

/** テストのために DB に直接入れる、画像の行の値。 */
type ImageValues = Partial<typeof image.$inferInsert>;

/** 画像を用意したり query を調べたりするための DB 接続。 */
export const openTestDatabase = (server: TestClient) =>
  openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
    max: 1,
  });

/** テスト用の画像を追加して ID を返す。 */
export const insertImages = async (
  server: TestClient,
  values: readonly ImageValues[],
): Promise<string[]> => {
  await using connection = openTestDatabase(server);

  const rows = await connection.db
    .insert(image)
    .values(
      values.map((value) => ({
        status: "published" as const,
        publishedAt: TEST_NOW,
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW,
        ...value,
      })),
    )
    .returning({ id: image.id });

  return rows.map(({ id }) => id);
};
