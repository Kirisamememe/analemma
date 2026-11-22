import { ORPCError } from "@orpc/client";

/** API の失敗が、セッションが無いか切れたことによるものかを返す。 */
export const isUnauthorized = (error: unknown): boolean =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED";

/** 失敗から、contract に定義した失敗の code を取り出す。 */
export const definedCode = (error: Error): string | undefined => {
  if (!(error instanceof ORPCError) || !error.defined) {
    return undefined;
  }

  const code: unknown = error.code;

  return typeof code === "string" ? code : undefined;
};
