import { ORPCError } from "@orpc/client";

/** API の失敗が、セッションが無いか切れたことによるものかを返す。 */
export const isUnauthorized = (error: unknown): boolean =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED";
