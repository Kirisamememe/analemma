import type { InferContractRouterOutputs } from "@orpc/contract";

import type { contract } from "@analemma/contract";

import { CHALLENGE_LIFETIME_MS } from "@/features/auth/challenge/create-challenge-store";

/** パスキーでのログインの options の出力。 */
export type LoginOptions = InferContractRouterOutputs<
  typeof contract
>["auth"]["login"]["options"];

/** 出した challenge と RP ID から、パスキーでのログインの options を作る。 */
export const createLoginOptions = (
  challenge: string,
  rpId: string,
): LoginOptions => ({
  challenge,
  rpId,
  allowCredentials: [],
  userVerification: "required",
  timeout: CHALLENGE_LIFETIME_MS,
});
