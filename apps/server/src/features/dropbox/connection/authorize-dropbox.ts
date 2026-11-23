import { DROPBOX_REDIRECT_PATH } from "@analemma/contract";

import { readDropboxConnection } from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { adminProcedures } from "@/procedures";

/** Dropbox の認可の画面の URL を作り、戻るのを待つ procedure。 */
export const authorizeDropbox = adminProcedures.dropbox.authorize.handler(
  async ({ context, errors }) => {
    const { api, authorizations } = context.dropbox;

    if (api === undefined) throw errors.NOT_CONFIGURED();

    if ((await readDropboxConnection(context.db)) !== undefined) {
      throw errors.ALREADY_CONNECTED();
    }

    const redirectUri = new URL(
      DROPBOX_REDIRECT_PATH,
      context.relyingParty.origin,
    ).href;

    const { url, state } = api.authorize(redirectUri);

    authorizations.remember(
      { state, redirectUri, sessionId: context.session.id },
      context.clock.now(),
    );

    return { url };
  },
);
