import { adminProcedures } from "@/procedures";

/** ログイン中の管理者のセッションを返す procedure。 */
export const getSession = adminProcedures.session.get.handler(
  ({ context }) => ({
    expiresAt: context.session.expiresAt.toISOString(),
  }),
);
