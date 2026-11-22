import { findKind } from "@/features/kinds/kinds.query";
import { toKindDetail } from "@/features/kinds/to-kind-detail";
import { adminProcedures } from "@/procedures";

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
