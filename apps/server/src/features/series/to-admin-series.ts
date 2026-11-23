import type { ContractOutputs } from "@analemma/contract";

import type { series } from "@/db/schema/series";

/** シリーズの行を管理画面に返す形にする。 */
export const toAdminSeries = (
  row: typeof series.$inferSelect,
): ContractOutputs["admin"]["series"]["create"] => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  published: row.publishedAt !== null,
  publishedAt: row.publishedAt?.toISOString() ?? null,
});
