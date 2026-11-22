import {
  type IncompatiblePage,
  findIncompatiblePages,
} from "@/features/kinds/push/find-incompatible-pages";
import {
  insertNewKinds,
  lockKinds,
  updateKinds,
} from "@/features/kinds/push/queries/kinds.query";
import { listKindPages } from "@/features/kinds/push/queries/list-kind-pages.query";
import {
  type KindChange,
  toKindChanges,
} from "@/features/kinds/push/to-kind-changes";
import { deployProcedures } from "@/procedures";

/** 送られた定義を受け付けたか、既存のページに合わずに断ったか。 */
type PushOutcome =
  | {
      /** どの結果か。 */
      readonly _tag: "Accepted";
      /** 種類ごとの変わり方。 */
      readonly kinds: KindChange[];
    }
  | {
      /** どの結果か。 */
      readonly _tag: "Incompatible";
      /** 送られた定義に合わない固定ページ。 */
      readonly pages: IncompatiblePage[];
    };

/** 公開サイトのデプロイのときに、種類の定義を受け取る procedure。 */
export const pushKinds = deployProcedures.kinds.push.handler(
  async ({ context, errors, input }) => {
    const now = context.clock.now();
    const names = input.kinds.map(({ name }) => name);
    const result = await context.db.transaction(
      async (tx): Promise<PushOutcome> => {
        const existing = await lockKinds(tx, names);
        const incompatible = findIncompatiblePages({
          pages: await listKindPages(tx, existing),
          definitions: input.kinds,
        });

        if (incompatible.length > 0) {
          return { _tag: "Incompatible", pages: incompatible };
        }

        const created = await insertNewKinds(tx, { kinds: input.kinds, now });
        const updated = await updateKinds(tx, {
          kinds: input.kinds.filter(({ name }) => !created.has(name)),
          now,
        });

        return {
          _tag: "Accepted",
          kinds: toKindChanges({ names, created, updated }),
        };
      },
    );

    if (result._tag === "Incompatible") {
      context.logger.write({
        level: "warn",
        message: "既存の固定ページに合わない種類の定義を断った",
        details: {
          deployTokenId: context.deployToken.id,
          pages: result.pages.map(({ id, kind }) => ({ id, kind })),
        },
      });

      throw errors.INCOMPATIBLE_PAGES({ data: { pages: result.pages } });
    }

    context.logger.write({
      level: "info",
      message: "種類の定義を受け取った",
      details: { deployTokenId: context.deployToken.id, kinds: result.kinds },
    });

    return { kinds: result.kinds };
  },
);
