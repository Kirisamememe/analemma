import { openDropboxSession } from "@/features/dropbox/connection/open-dropbox-session";
import {
  deleteDropboxConnection,
  readDropboxConnection,
} from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { adminProcedures } from "@/procedures";

/** Dropbox に預けた認可を取り消し、接続の行を消す procedure。 */
export const disconnectDropbox = adminProcedures.dropbox.disconnect.handler(
  async ({ context, signal }) => {
    const row = await readDropboxConnection(context.db);

    if (row === undefined) return;

    const opened = await openDropboxSession(context, signal);

    const accessToken =
      opened._tag === "Opened" ? await opened.session.accessToken() : undefined;

    if (
      opened._tag === "Opened" &&
      accessToken !== undefined &&
      !(await opened.session.api.revoke(accessToken, signal))
    ) {
      context.logger.write({
        level: "warn",
        message: "Dropbox が認可の取り消しを断ったので、接続の行だけを消す",
        details: { accountId: row.accountId },
      });
    }

    await deleteDropboxConnection(context.db, row);

    context.logger.write({
      level: "info",
      message: "Dropbox との接続を切った",
      details: { accountId: row.accountId },
    });
  },
);
