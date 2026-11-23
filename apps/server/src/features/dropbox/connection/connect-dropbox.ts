import { saveDropboxConnection } from "@/features/dropbox/connection/queries/dropbox-connection.query";
import { toDropboxConnection } from "@/features/dropbox/connection/to-dropbox-connection";
import { encryptToken } from "@/features/dropbox/connection/token-cipher";
import { adminProcedures } from "@/procedures";

/** Dropbox の許可の画面から戻った code で、Dropbox とつなぐ procedure。 */
export const connectDropbox = adminProcedures.dropbox.connect.handler(
  async ({ context, errors, input }) => {
    const { dropbox } = context;

    if (dropbox === undefined) {
      throw errors.NOT_CONFIGURED();
    }

    const now = context.clock.now();

    const codeVerifier = dropbox.authorizations.take(input.state, {
      sessionId: context.session.id,
      now,
    });

    const exchanged =
      codeVerifier === undefined
        ? undefined
        : await dropbox.client.exchangeCode({
            code: input.code,
            codeVerifier,
            redirectUri: dropbox.redirectUri,
          });

    if (exchanged?._tag !== "Exchanged") {
      context.logger.write({
        level: "warn",
        message: "Dropbox とつなげなかった",
        details: {
          reason: exchanged === undefined ? "unknown-state" : "rejected-code",
        },
      });

      throw errors.AUTHORIZATION_FAILED();
    }

    const row = await saveDropboxConnection(context.db, {
      accountId: exchanged.accountId,
      refreshToken: await encryptToken(
        dropbox.tokenKey,
        exchanged.refreshToken,
      ),
      connectedAt: now,
    });

    context.logger.write({
      level: "info",
      message: "Dropbox とつないだ",
      details: { accountId: exchanged.accountId },
    });

    return toDropboxConnection(true, row);
  },
);
