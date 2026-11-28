import { type SQL, eq } from "drizzle-orm";

import { image } from "@/db/schema/image";
import type { DatabaseExecutor } from "@/platform/database";

/** 画像の行。 */
export type ImageRow = typeof image.$inferSelect;

/** 画像を公開しているか。 */
export const isPublished = (row: Pick<ImageRow, "status">): boolean =>
  row.status === "published";

/** 公開サイトに見せてよい画像だけを選ぶ SQL の条件。 */
export const matchPublished = (): SQL => eq(image.status, "published");

/** ID で画像の行を引く。 */
export const findImage = async (
  db: DatabaseExecutor,
  id: string,
): Promise<ImageRow | undefined> => {
  const [row] = await db.select().from(image).where(eq(image.id, id));

  return row;
};

/** 画像の行を lock し、先に書き始めたトランザクションが終わるのを待つ。 */
export const lockImage = async (
  tx: DatabaseExecutor,
  id: string,
): Promise<void> => {
  await tx
    .select({ id: image.id })
    .from(image)
    .where(eq(image.id, id))
    .for("update");
};
