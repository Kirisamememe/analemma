import { findDropboxConnection } from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { toDropboxConnection } from "@/features/dropbox/connection/to-dropbox-connection";
import { adminProcedures } from "@/procedures";

/** Dropbox とのつながりを返す procedure。 */
export const getDropboxConnection = adminProcedures.dropbox.get.handler(
  async ({ context }) =>
    toDropboxConnection(
      context.dropbox !== undefined,
      await findDropboxConnection(context.db),
    ),
);
