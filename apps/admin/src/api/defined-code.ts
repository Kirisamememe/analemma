import { ORPCError } from "@orpc/client";

/** 失敗から、contract に定義した失敗の code を取り出す。 */
export const definedCode = (error: Error): string | undefined => {
  if (!(error instanceof ORPCError) || !error.defined) {
    return undefined;
  }

  const code: unknown = error.code;

  return typeof code === "string" ? code : undefined;
};
