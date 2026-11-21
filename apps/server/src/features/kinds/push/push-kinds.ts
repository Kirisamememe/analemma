import { deployProcedures } from "../../../procedures";
import { insertNewKinds } from "./insert-new-kinds.query";
import { toKindChanges } from "./to-kind-changes";
import { updateKind } from "./update-kind.query";

/** 公開サイトのデプロイのときに、種類の定義を受け取る procedure。 */
export const pushKinds = deployProcedures.kinds.push.handler(
  async ({ context, input }) => {
    const now = context.clock.now();
    const kinds = await context.db.transaction(async (tx) => {
      const created = await insertNewKinds(tx, { kinds: input.kinds, now });
      const results = await Promise.all(
        input.kinds
          .filter(({ name }) => !created.has(name))
          .map(async (definition) => ({
            name: definition.name,
            updated: await updateKind(tx, { definition, now }),
          })),
      );

      return toKindChanges({
        names: input.kinds.map(({ name }) => name),
        created,
        updated: new Set(
          results.filter(({ updated }) => updated).map(({ name }) => name),
        ),
      });
    });

    context.logger.write({
      level: "info",
      message: "種類の定義を受け取った",
      details: { deployTokenId: context.deployToken.id, kinds },
    });

    return { kinds };
  },
);
