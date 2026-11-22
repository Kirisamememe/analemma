import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import type { contract } from "@analemma/contract";

/** server の API を呼ぶ、contract の型の付いた client。 */
export type ApiClient = ContractRouterClient<typeof contract>;

/** procedure ごとの入力。 */
export type ApiInputs = InferContractRouterInputs<typeof contract>;

/** procedure ごとの出力。 */
export type ApiOutputs = InferContractRouterOutputs<typeof contract>;
