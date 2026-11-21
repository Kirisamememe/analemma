import { adminProcedures } from "../../procedures";
import { listKinds as listKindRows } from "./list-kinds.query";
import { toKindSummary } from "./to-kind-detail";

/** 種類の一覧を返す procedure。 */
export const listKinds = adminProcedures.kinds.list.handler(
  async ({ context }) => ({
    kinds: (await listKindRows(context.db)).map((row) => toKindSummary(row)),
  }),
);
