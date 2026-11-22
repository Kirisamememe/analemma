import type { InferContractRouterOutputs } from "@orpc/contract";

import type { contract } from "@analemma/contract";

/** 送られた定義で、種類がどう変わったか。 */
export type KindChange = InferContractRouterOutputs<
  typeof contract
>["deploy"]["kinds"]["push"]["kinds"][number];

/** 送られた種類の名前と、作った種類と書き換えた種類の名前。 */
export type KindChangeSets = {
  /** 送られた順の、種類の名前。 */
  readonly names: readonly string[];
  /** 新しく作った種類の名前。 */
  readonly created: ReadonlySet<string>;
  /** 定義を書き換えた種類の名前。 */
  readonly updated: ReadonlySet<string>;
};

const toChange = (
  name: string,
  { created, updated }: KindChangeSets,
): KindChange["change"] => {
  if (created.has(name)) {
    return "created";
  }

  return updated.has(name) ? "updated" : "unchanged";
};

/** 送られた種類ごとに、作ったか・書き換えたか・変わらなかったかを決める。 */
export const toKindChanges = (sets: KindChangeSets): KindChange[] =>
  sets.names.map((name) => ({ name, change: toChange(name, sets) }));
