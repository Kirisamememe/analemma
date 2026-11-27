import { ORPCError } from "@orpc/client";

/** API の失敗が、セッションが無いか切れたことによるものかを返す。 */
export const isUnauthorized = (error: unknown): boolean =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED";

/** API の失敗が、server が今は受けられない(503)ことによるものかを返す。 */
export const isUnavailable = (error: unknown): boolean =>
  error instanceof ORPCError && error.code === "SERVICE_UNAVAILABLE";
