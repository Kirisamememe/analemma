import type { DatabaseExecutor } from "@/platform/database";

/** 指定した画像の配信用の画像と、管理画面で決めた順のタグ。 */
export const readImageRelations = async (
  db: DatabaseExecutor,
  ids: readonly string[],
) => {
  const rows =
    ids.length === 0
      ? []
      : await db.query.image.findMany({
          columns: { id: true },
          where: { id: { in: [...ids] } },
          with: {
            deliveryImages: true,
            tags: {
              columns: { id: true, name: true },
              orderBy: { position: "asc" },
            },
          },
        });

  return new Map(rows.map((row) => [row.id, row]));
};
