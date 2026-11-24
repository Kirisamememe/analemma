import { insertDropboxConnection } from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { toDropboxConnection } from "@/features/dropbox/connection/to-dropbox-connection";
import { adminProcedures } from "@/procedures";

/** 認可の画面から戻った code を token に換え、アカウントにつなぐ procedure。 */
export const connectDropbox = adminProcedures.dropbox.connect.handler(
  async ({ context, errors, input, signal }) => {
    const { api, authorizations } = context.dropbox;

    if (api === undefined) throw errors.NOT_CONFIGURED();

    const pending = authorizations.take({
      state: input.state,
      sessionId: context.session.id,
      now: context.clock.now(),
    });

    if (pending === undefined) throw errors.AUTHORIZATION_EXPIRED();

    const exchanged = await api.exchangeCode({
      code: input.code,
      redirectUri: pending.redirectUri,
    });

    if (exchanged._tag === "Rejected") throw errors.AUTHORIZATION_REJECTED();

    let connected = false;
    await using rollback = new AsyncDisposableStack();

    rollback.defer(async () => {
      if (!connected) await api.revoke(exchanged.accessToken);
    });

    const account = await api.getAccount(exchanged.accessToken, signal);

    if (account._tag === "Unauthorized") throw errors.AUTHORIZATION_REJECTED();

    const row = {
      accountId: account.accountId,
      accountName: account.name,
      accountEmail: account.email,
      refreshToken: exchanged.refreshToken,
      connectedAt: context.clock.now(),
    };

    if (!(await insertDropboxConnection(context.db, row))) {
      throw errors.ALREADY_CONNECTED();
    }

    connected = true;

    context.logger.write({
      level: "info",
      message: "Dropbox のアカウントにつないだ",
      details: { accountId: account.accountId },
    });

    return toDropboxConnection(row);
  },
);
