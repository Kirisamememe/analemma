import { listPasskeys as listPasskeyRows } from "@/features/auth/passkeys/queries/list-passkeys.query";
import { toPasskeySummary } from "@/features/auth/passkeys/to-passkey-summary";
import { adminProcedures } from "@/procedures";

/** 管理者のパスキーの一覧を返す procedure。 */
export const listPasskeys = adminProcedures.passkeys.list.handler(
  async ({ context }) => ({
    passkeys: (
      await listPasskeyRows(context.db, context.session.adminUserId)
    ).map((row) => toPasskeySummary(row)),
  }),
);
