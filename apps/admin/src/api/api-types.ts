import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import type { contract } from "@analemma/contract";

/** 送り終えた本文の割合を受け取る関数。 */
export type UploadProgressCallback = (fraction: number) => void;

/** 管理画面が1回の API 呼び出しに渡す値。 */
export type ApiClientContext = {
  /** 写真の送信の進み具合を受け取る関数。 */
  readonly onUploadProgress?: UploadProgressCallback | undefined;
};

/** server の API を呼ぶ、contract の型の付いた client。 */
export type ApiClient = ContractRouterClient<typeof contract, ApiClientContext>;

/** procedure ごとの入力。 */
export type ApiInputs = InferContractRouterInputs<typeof contract>;

/** procedure ごとの出力。 */
export type ApiOutputs = InferContractRouterOutputs<typeof contract>;
