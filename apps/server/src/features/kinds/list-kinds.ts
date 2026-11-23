import { listKinds as listKindRows } from "@/features/kinds/queries/kinds.query";
import { toKindSummary } from "@/features/kinds/to-kind-detail";
import { adminProcedures } from "@/procedures";

/** 種類の一覧を返す procedure。 */
export const listKinds = adminProcedures.kinds.list.handler(
  async ({ context }) => ({
    kinds: (await listKindRows(context.db)).map((row) => toKindSummary(row)),
  }),
);
