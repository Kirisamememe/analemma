import { adminProcedures } from "../../procedures";
import { findKind } from "./kinds.query";
import { toKindDetail } from "./to-kind-detail";

/** 管理画面のフォームを作るための、種類の定義を返す procedure。 */
export const getKind = adminProcedures.kinds.get.handler(
  async ({ context, errors, input }) => {
    const row = await findKind(context.db, input.name);

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    return toKindDetail(row);
  },
);
