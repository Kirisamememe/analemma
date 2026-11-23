import { dropboxConnection } from "@/db/schema/dropbox-connection";
import type { DatabaseExecutor } from "@/platform/database";

/** Dropbox とのつながりの行。 */
export type DropboxConnectionRow = typeof dropboxConnection.$inferSelect;

/** Dropbox とのつながりの行を読む。 */
export const findDropboxConnection = async (
  db: DatabaseExecutor,
): Promise<DropboxConnectionRow | undefined> => {
  const [row] = await db.select().from(dropboxConnection).limit(1);

  return row;
};

/** Dropbox とのつながりを書く(前のつながりは置き換える)。 */
export const saveDropboxConnection = async (
  db: DatabaseExecutor,
  values: Omit<DropboxConnectionRow, "id">,
): Promise<DropboxConnectionRow> => {
  const [row] = await db
    .insert(dropboxConnection)
    .values(values)
    .onConflictDoUpdate({ target: dropboxConnection.id, set: values })
    .returning();

  if (row === undefined) throw new Error("書いた Dropbox の行がありません");

  return row;
};

/** Dropbox とのつながりを消す。 */
export const deleteDropboxConnection = async (
  db: DatabaseExecutor,
): Promise<void> => {
  await db.delete(dropboxConnection);
};
