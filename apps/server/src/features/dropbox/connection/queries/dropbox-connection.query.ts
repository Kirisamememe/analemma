import { eq } from "drizzle-orm";

import { dropboxConnection } from "@/db/schema/dropbox";
import type { DatabaseExecutor } from "@/platform/database";

/** Dropbox との接続の行。 */
export type DropboxConnectionRow = typeof dropboxConnection.$inferSelect;

/** 新しい接続の行。 */
export type NewDropboxConnection = Omit<DropboxConnectionRow, "id">;

/** Dropbox との接続の行を読む。 */
export const readDropboxConnection = async (
  db: DatabaseExecutor,
): Promise<DropboxConnectionRow | undefined> => {
  const [row] = await db.select().from(dropboxConnection);

  return row;
};

/** 接続の行が無ければ作り、作れたかを返す。 */
export const insertDropboxConnection = async (
  db: DatabaseExecutor,
  values: NewDropboxConnection,
): Promise<boolean> => {
  const inserted = await db
    .insert(dropboxConnection)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: dropboxConnection.id });

  return inserted.length > 0;
};

/** 読んだときと同じ認可の、接続の行を消す。 */
export const deleteDropboxConnection = async (
  db: DatabaseExecutor,
  row: Pick<DropboxConnectionRow, "refreshToken">,
): Promise<void> => {
  await db
    .delete(dropboxConnection)
    .where(eq(dropboxConnection.refreshToken, row.refreshToken));
};
