import type { ContractOutputs } from "@analemma/contract";

import type { collection } from "@/db/schema/collection";
import { isPublished } from "@/features/collections/published/queries/published-collections.query";

/** 作品集の行を管理画面に返す形にする。 */
export const toAdminCollection = (
  row: typeof collection.$inferSelect,
): ContractOutputs["admin"]["collections"]["create"] => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  published: isPublished(row),
  publishedAt: row.publishedAt?.toISOString() ?? null,
});
