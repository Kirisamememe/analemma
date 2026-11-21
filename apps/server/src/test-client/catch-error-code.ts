import { ORPCError } from "@orpc/client";

/** 呼び出しが成功したことを表す、テストでの結果。 */
export const SUCCEEDED = "成功した";

/** テストのために、呼び出しが失敗したときの contract の失敗の名前を返す。 */
export const catchErrorCode = async (
  call: Promise<unknown>,
): Promise<string> => {
  const settled = await call.catch((error: unknown) => error);

  return settled instanceof ORPCError ? String(settled.code) : SUCCEEDED;
};
