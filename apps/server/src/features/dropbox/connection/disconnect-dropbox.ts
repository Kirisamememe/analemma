import {
  deleteDropboxConnection,
  readDropboxConnection,
} from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { adminProcedures } from "@/procedures";

/** Dropbox に預けた認可を取り消し、接続の行を消す procedure。 */
export const disconnectDropbox = adminProcedures.dropbox.disconnect.handler(
  async ({ context, errors, signal }) => {
    const { imports } = context.dropbox;

    if (imports.isBusy()) throw errors.IMPORT_RUNNING();

    using paused = imports.pause(); // 切り終えるまで、取り込みを始めさせない

    const row = await readDropboxConnection(context.db);

    if (row === undefined) return;

    const { api } = context.dropbox;

    if (api === undefined) throw errors.NOT_CONFIGURED();

    const refreshed = await api.refresh(row.refreshToken, signal);

    if (refreshed._tag === "Refreshed") {
      await api.revoke(refreshed.accessToken, signal);
    }

    await deleteDropboxConnection(context.db, row);

    context.logger.write({
      level: "info",
      message: "Dropbox との接続を切った",
      details: { accountId: row.accountId },
    });
  },
);
