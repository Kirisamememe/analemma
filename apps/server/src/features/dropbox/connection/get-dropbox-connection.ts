import { readDropboxConnection } from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { toDropboxConnection } from "@/features/dropbox/connection/to-dropbox-connection";
import { adminProcedures } from "@/procedures";

/** Dropbox との接続の状態を返す procedure。 */
export const getDropboxConnection = adminProcedures.dropbox.get.handler(
  async ({ context }) =>
    context.dropbox.api === undefined
      ? { status: "unconfigured" }
      : toDropboxConnection(await readDropboxConnection(context.db)),
);
