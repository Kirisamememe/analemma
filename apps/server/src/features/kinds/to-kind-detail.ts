import type { InferContractRouterOutputs } from "@orpc/contract";

import type { contract } from "@analemma/contract";

import type { KindRow, KindSummaryRow } from "./kinds.query";
import { readKindFields } from "./read-kind-fields";

type KindOutputs = InferContractRouterOutputs<
  typeof contract
>["admin"]["kinds"];

/** 管理画面に返す、種類の一覧の1件。 */
export type KindSummary = KindOutputs["list"]["kinds"][number];

/** 管理画面に返す、種類の定義。 */
export type KindDetail = KindOutputs["get"];

/** 種類の行を、一覧の1件の形にする。 */
export const toKindSummary = (row: KindSummaryRow): KindSummary => ({
  name: row.name,
  label: row.label,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** 種類の行を、フォームを作るための定義の形にする。 */
export const toKindDetail = (row: KindRow): KindDetail => ({
  ...toKindSummary(row),
  fields: readKindFields(row.fields),
});
