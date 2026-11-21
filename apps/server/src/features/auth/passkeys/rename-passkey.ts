import { adminProcedures } from "../../../procedures";
import { renamePasskey as renamePasskeyRow } from "./rename-passkey.query";
import { toPasskeySummary } from "./to-passkey-summary";

/** 管理者のパスキーの名前を変える procedure。 */
export const renamePasskey = adminProcedures.passkeys.rename.handler(
  async ({ context, errors, input }) => {
    const row = await renamePasskeyRow(context.db, {
      adminUserId: context.session.adminUserId,
      id: input.id,
      name: input.name,
    });

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "パスキーの名前を変えた",
      details: { passkeyId: row.id },
    });

    return toPasskeySummary(row);
  },
);
