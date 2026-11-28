import type { ContractOutputs } from "@analemma/contract";

import { countImagesByStatus } from "@/features/images/reading/queries/count-images-by-status.query";
import { adminProcedures } from "@/procedures";

type Counts = ContractOutputs["admin"]["images"]["counts"];

const toCounts = (
  rows: Awaited<ReturnType<typeof countImagesByStatus>>,
  match: "any" | "all",
): Counts => {
  const byStatus = { published: 0, unpublished: 0, processing: 0, failed: 0 };
  const totals = { total: 0, untagged: 0, any: 0, all: 0 };

  for (const row of rows) {
    totals.total += row.total;
    totals.untagged += row.untagged;
    totals.any += row.any;
    totals.all += row.all;

    const status =
      row.status === "unreadable" || row.status === "interrupted"
        ? "failed"
        : row.status;

    byStatus[status] += row[match];
  }

  const statuses = [
    "published",
    "unpublished",
    "processing",
    "failed",
  ] as const;

  return {
    ...totals,
    byStatus: statuses.flatMap((status) =>
      byStatus[status] > 0 ? [{ status, count: byStatus[status] }] : [],
    ),
  };
};

/** 画像一覧で選べる条件ごとの枚数を返す procedure。 */
export const countImages = adminProcedures.images.counts.handler(
  async ({ context, input }) =>
    toCounts(
      await countImagesByStatus(context.db, input),
      input.match ?? "any",
    ),
);
