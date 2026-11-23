import { deleteDropboxConnection } from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { toDropboxConnection } from "@/features/dropbox/connection/to-dropbox-connection";
import { adminProcedures } from "@/procedures";

/** Dropbox とのつながりを切る procedure。 */
export const disconnectDropbox = adminProcedures.dropbox.disconnect.handler(
  async ({ context }) => {
    await deleteDropboxConnection(context.db);

    context.logger.write({
      level: "info",
      message: "Dropbox とのつながりを切った",
      details: {},
    });

    return toDropboxConnection(context.dropbox !== undefined, undefined);
  },
);
