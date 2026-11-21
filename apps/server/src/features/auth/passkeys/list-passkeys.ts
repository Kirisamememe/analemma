import { adminProcedures } from "../../../procedures";
import { listPasskeys as listPasskeyRows } from "./list-passkeys.query";
import { toPasskeySummary } from "./to-passkey-summary";

/** 管理者のパスキーの一覧を返す procedure。 */
export const listPasskeys = adminProcedures.passkeys.list.handler(
  async ({ context }) => ({
    passkeys: (
      await listPasskeyRows(context.db, context.session.adminUserId)
    ).map((row) => toPasskeySummary(row)),
  }),
);
