import { eq } from "drizzle-orm";

import { image } from "@/db/schema/image";
import type { DatabaseExecutor } from "@/platform/database";

/** 画像の行を消し、消せたかを返す。 */
export const deleteImage = async (
  db: DatabaseExecutor,
  id: string,
): Promise<boolean> => {
  const rows = await db
    .delete(image)
    .where(eq(image.id, id))
    .returning({ id: image.id });

  return rows.length > 0;
};
