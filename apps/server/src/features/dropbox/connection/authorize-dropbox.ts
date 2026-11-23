import { adminProcedures } from "@/procedures";

/** Dropbox とつなぐことを許す、Dropbox の画面の URL を出す procedure。 */
export const authorizeDropbox = adminProcedures.dropbox.authorize.handler(
  async ({ context, errors }) => {
    const { dropbox } = context;

    if (dropbox === undefined) {
      throw errors.NOT_CONFIGURED();
    }

    const { state, codeChallenge } = await dropbox.authorizations.issue({
      sessionId: context.session.id,
      now: context.clock.now(),
    });

    return {
      url: dropbox.client.authorizeUrl({
        state,
        codeChallenge,
        redirectUri: dropbox.redirectUri,
      }),
    };
  },
);
