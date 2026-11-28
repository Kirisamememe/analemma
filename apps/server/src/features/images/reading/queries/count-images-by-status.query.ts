import { type SQL, count, sql } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { image } from "@/db/schema/image";
import { matchImageTags } from "@/features/images/reading/queries/image-list.query";
import type { DatabaseExecutor } from "@/platform/database";

const countMatching = (predicate: SQL | undefined) =>
  predicate === undefined
    ? count()
    : sql`count(*) filter (where ${predicate})`.mapWith(Number);

/** ライブラリ全体でタグの条件ごとの件数を、状態別に数える。 */
export const countImagesByStatus = (
  db: DatabaseExecutor,
  input: ContractInputs["admin"]["images"]["counts"],
) =>
  db
    .select({
      status: image.status,
      total: count(),
      untagged: countMatching(matchImageTags(db, { tags: "untagged" })),
      any: countMatching(matchImageTags(db, { ...input, match: "any" })),
      all: countMatching(matchImageTags(db, { ...input, match: "all" })),
    })
    .from(image)
    .groupBy(image.status);
